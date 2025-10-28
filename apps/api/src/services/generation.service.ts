import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeneratePostDto, PostContent, PostSettings, ValidationUtils, AIProvider } from '@nottu/core';
import { PostComposer, ComposerOptions, CompositionResult } from '@nottu/render';
import { OpenAIService, GenerationResult } from './openai.service';
import { VisualAIService, ImageGenerationResult } from './visual-ai.service';
import { HistoryService, PostHistoryItem } from './history.service';
import { SettingsService } from './settings.service';

export interface GenerationRequest extends GeneratePostDto {
  userId?: string;
  includeImage?: boolean;
  visualAiProvider?: 'dalle' | 'flux' | 'leonardo';
  renderOptions?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'png' | 'jpg' | 'webp';
  };
}

export interface GenerationResponse {
  id: string;
  content: PostContent;
  settings: PostSettings;
  imageUrl?: string;
  renderUrl?: string;
  status: 'completed' | 'failed';
  metadata: {
    aiProvider: string;
    visualAiProvider?: string;
    generationTime: number;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

@Injectable()
export class GenerationService {
  private postComposer: PostComposer;

  constructor(
    private configService: ConfigService,
    private openaiService: OpenAIService,
    private visualAiService: VisualAIService,
    private historyService: HistoryService,
    private settingsService: SettingsService,
  ) {
    this.postComposer = new PostComposer();
  }

  async generatePost(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateGenerationRequest(request);

      // Get user settings
      const userSettings = await this.settingsService.getSettings(request.userId);

      // Create history entry
      const historyItem = await this.historyService.addPost({
        userId: request.userId,
        content: { caption: '', hashtags: [], visualPrompt: '' },
        settings: this.createPostSettings(request, userSettings),
        status: 'generating',
        aiProvider: AIProvider.OPENAI,
        visualAiProvider: request.visualAiProvider,
        metadata: {
          platform: 'instagram',
          tone: request.style || 'neutral',
        }, 
      });

      try {
        // Generate text content
        const textResult = await this.generateTextContent(request, userSettings);

        // Generate image if requested
        let imageResult: ImageGenerationResult | undefined;
        if (request.includeImage && request.visualAiProvider) {
          imageResult = await this.generateImageContent(textResult.content, request.visualAiProvider);
        }

        // Render final post
        const renderResult = await this.renderPost(
          textResult.content,
          historyItem.settings,
          request.renderOptions,
          imageResult,
        );

        // Update history with success
        const updatedHistoryItem = await this.historyService.updatePost(historyItem.id, {
          content: textResult.content,
          imageUrl: imageResult?.imageUrl,
          status: 'completed',
          generationTime: Date.now() - startTime,
        });

        return {
          id: historyItem.id,
          content: textResult.content,
          settings: historyItem.settings,
          imageUrl: imageResult?.imageUrl,
          renderUrl: undefined,
          status: 'completed',
          metadata: {
            aiProvider: textResult.provider,
            visualAiProvider: imageResult?.provider,
            generationTime: Date.now() - startTime,
            usage: textResult.usage,
          },
        };
      } catch (error) {
        // Update history with failure
        await this.historyService.updatePost(historyItem.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          generationTime: Date.now() - startTime,
        });

        throw error;
      }
    } catch (error) {
      console.error('Generation error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to generate post');
    }
  }

  async generatePreview(request: GenerationRequest): Promise<{
    content: PostContent;
    previewUrl: string;
  }> {
    try {
      // Validate request
      this.validateGenerationRequest(request);

      // Get user settings
      const userSettings = await this.settingsService.getSettings(request.userId);

      // Generate text content only
      const textResult = await this.generateTextContent(request, userSettings);

      // Create quick preview render
      const settings = this.createPostSettings(request, userSettings);
      const renderResult = await this.renderPost(
        textResult.content,
        settings,
        { ...request.renderOptions, quality: 70 }, // Lower quality for preview
      );

      const previewUrl = `data:image/png;base64,${renderResult.buffer.toString('base64')}`;
      return {
        content: textResult.content,
        previewUrl,
      };
    } catch (error) {
      console.error('Preview generation error:', error);
      throw new InternalServerErrorException('Failed to generate preview');
    }
  }

  async generateFromTemplate(
    templateId: string,
    templateData: any,
    request: Partial<GenerationRequest> = {},
  ): Promise<GenerationResponse> {
    try {
      // Initialize composer if not done
      await this.postComposer.initialize();

      // Generate from template
      await this.postComposer.composeFromTemplate(templateId, templateData, {
        engine: 'satori',
        width: request.renderOptions?.width || 1080,
        height: request.renderOptions?.height || 1080,
        quality: request.renderOptions?.quality || 90,
        format: (request.renderOptions?.format as any) || 'png',
      });

      const generationRequest: GenerationRequest = {
        topic: (templateData && (templateData.title || templateData.topic)) || templateId,
        style: request.style || 'modern',
        customPrompt: request.customPrompt || 'Generate post content aligned with the selected template',
        ...request,
      } as GenerationRequest;

      return await this.generatePost(generationRequest);
    } catch (error) {
      console.error('Template generation error:', error);
      throw new InternalServerErrorException('Failed to generate from template');
    }
  }

  async generateBatch(
    requests: GenerationRequest[],
    options?: { maxConcurrent?: number },
  ): Promise<GenerationResponse[]> {
    const maxConcurrent = options?.maxConcurrent || 3;
    const results: GenerationResponse[] = [];

    // Process in batches to avoid overwhelming the APIs
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (request) => {
        try {
          return await this.generatePost(request);
        } catch (error) {
          console.error(`Batch generation error for request ${i}:`, error);
          // Return error result instead of throwing
          return {
            id: `error_${Date.now()}_${Math.random()}`,
            content: { caption: '', hashtags: [], visualPrompt: '' } as PostContent,
            settings: {} as PostSettings,
            status: 'failed' as const,
            metadata: {
              aiProvider: 'openai',
              generationTime: 0,
            },
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async generateVariations(
    originalPostId: string,
    count: number = 3,
    userId?: string,
  ): Promise<GenerationResponse[]> {
    try {
      // Get original post
      const originalPost = await this.historyService.getPostById(originalPostId, userId);

      if (originalPost.status !== 'completed') {
        throw new BadRequestException('Original post must be completed to generate variations');
      }

      // Generate variations using OpenAI
      const variations = await this.openaiService.generateVariations(originalPost.content, count);

      // Convert to generation responses
      const results: GenerationResponse[] = [];

      for (const variation of variations) {
        try {
          // Create history entry for variation
          const historyItem = await this.historyService.addPost({
            userId,
            content: variation.content,
            settings: originalPost.settings,
            status: 'completed',
            aiProvider: variation.provider,
            generationTime: variation.generationTime,
            metadata: originalPost.metadata,
          });

          // Render variation
          const renderResult = await this.renderPost(
            variation.content,
            originalPost.settings,
          );

          results.push({
            id: historyItem.id,
            content: variation.content,
            settings: originalPost.settings,
            renderUrl: undefined,
            status: 'completed',
            metadata: {
              aiProvider: variation.provider,
              generationTime: variation.generationTime,
              usage: variation.usage,
            },
          });
        } catch (error) {
          console.error('Error processing variation:', error);
          // Continue with other variations
        }
      }

      return results;
    } catch (error) {
      console.error('Variations generation error:', error);
      throw new InternalServerErrorException('Failed to generate variations');
    }
  }

  private async generateTextContent(
    request: GenerationRequest,
    userSettings: any,
  ): Promise<GenerationResult> {
    const aiProvider = userSettings.preferences.defaultAiProvider;

    switch (aiProvider) {
      case 'openai':
        return await this.openaiService.generatePost(request);
      
      // Add other providers here when implemented
      // case 'anthropic':
      //   return await this.anthropicService.generatePost(request);
      // case 'gemini':
      //   return await this.geminiService.generatePost(request);

      default:
        throw new BadRequestException(`Unsupported AI provider: ${aiProvider}`);
    }
  }

  private async generateImageContent(
    content: PostContent,
    provider: 'dalle' | 'flux' | 'leonardo',
  ): Promise<ImageGenerationResult> {
    return await this.visualAiService.generateFromPostContent(content, provider);
  }

  private async renderPost(
    content: PostContent,
    settings: PostSettings,
    renderOptions?: any,
    imageResult?: ImageGenerationResult,
  ): Promise<CompositionResult> {
    // Initialize composer if not done
    await this.postComposer.initialize();

    const composerOptions: ComposerOptions = {
      engine: 'satori',
      format: (renderOptions?.format as any) || 'png',
      quality: renderOptions?.quality || 90,
      width: renderOptions?.width || 1080,
      height: renderOptions?.height || 1080,
    } as any;

    const imageUrl = imageResult?.imageUrl || 'https://dummyimage.com/1080x1080/111/eeeeee.png&text=Nottu';
    return await this.postComposer.compose(content, imageUrl, settings, composerOptions);
  }

  private createPostSettings(request: GenerationRequest, userSettings: any): PostSettings {
    return {
      outputPath: userSettings?.exportSettings?.outputPath,
      brandColors: userSettings?.brandSettings?.customColors,
      logoPosition: userSettings?.brandSettings?.logoPosition,
      textOverlay: true,
      imageQuality: (request.renderOptions?.quality || userSettings?.exportSettings?.defaultQuality || 90) as number,
      format: ((request.renderOptions?.format || userSettings?.exportSettings?.defaultFormat) as any) || 'png',
    };
  }

  private validateGenerationRequest(request: GenerationRequest): void {
    if (!request.topic || request.topic.trim().length === 0) {
      throw new BadRequestException('Topic is required');
    }

    if (request.visualAiProvider && !['dalle', 'flux', 'leonardo'].includes(request.visualAiProvider)) {
      throw new BadRequestException('Invalid visual AI provider');
    }

    if (request.renderOptions) {
      if (request.renderOptions.width && (request.renderOptions.width < 100 || request.renderOptions.width > 4096)) {
        throw new BadRequestException('Width must be between 100 and 4096 pixels');
      }

      if (request.renderOptions.height && (request.renderOptions.height < 100 || request.renderOptions.height > 4096)) {
        throw new BadRequestException('Height must be between 100 and 4096 pixels');
      }

      if (request.renderOptions.quality && (request.renderOptions.quality < 1 || request.renderOptions.quality > 100)) {
        throw new BadRequestException('Quality must be between 1 and 100');
      }
    }
  }
}