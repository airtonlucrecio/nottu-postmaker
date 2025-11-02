import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostComposer } from '@nottu/render';
import { GeneratePostDto, PostContent } from '@nottu/core';
import { OpenAIService } from './openai.service';
import { VisualAIService, type ImageGenerationResult } from './visual-ai.service';
import { DiskStorageService } from './disk-storage.service';
import { HistoryService } from './history.service';

// Tipos locais para substituir os tipos de queue
export interface GeneratePostRequest {
  topic: string;
  includeImage?: boolean;
  imageProvider?: 'dalle';
}

export interface PostGenerationResult {
  id: string;
  topic: string;
  caption: string;
  hashtags: string[];
  folder: string;
  folderFs: string;
  assets: any;
  fsAssets: any;
  metadata: any;
  provider: {
    text: string;
    requestedImage?: string;
    effectiveImage?: string;
    image?: string;
  };
  imagePrompt?: string;
  textMetadata?: Record<string, any>;
  imageMetadata?: ImageGenerationResult['metadata'];
  imageModel?: string;
  imageUrl?: string;
  imageRevisedPrompt?: string;
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);
  private readonly imageProviderDefault: 'dalle';
  private readonly composer = new PostComposer();
  private composerReady = false;
  private readonly renderEngine: 'puppeteer' | 'satori';

  constructor(
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
    private readonly visualAiService: VisualAIService,
    private readonly diskStorageService: DiskStorageService,
    private readonly historyService: HistoryService,
  ) {
    const provider = this.configService.get<string>('IA_IMAGE_PROVIDER') || 'dalle';
    this.imageProviderDefault = provider === 'dalle' ? 'dalle' : 'dalle';

    const requestedEngine = (this.configService.get<string>('RENDER_ENGINE') || '').toLowerCase();
    this.renderEngine = requestedEngine === 'satori' ? 'satori' : 'puppeteer';
    if (this.renderEngine !== 'puppeteer' && requestedEngine !== 'satori') {
      this.logger.warn(
        `Unknown render engine "${requestedEngine}" requested. Falling back to Puppeteer.`,
      );
    }
  }

  async generatePost(request: GeneratePostRequest): Promise<PostGenerationResult> {
    const id = this.generateId();
    const requestedAt = new Date();
    const startedAt = new Date();
    
    this.logger.log(`Starting post generation for topic: ${request.topic}`);

    try {
      const content = await this.generatePostContent(request);

      const shouldGenerateImage = request.includeImage !== false;
      const imagePrompt = shouldGenerateImage
        ? (content.visualPrompt && content.visualPrompt.trim().length > 0
            ? content.visualPrompt.trim()
            : request.topic)
        : undefined;

      const requestedImageProvider = imagePrompt
        ? request.imageProvider || this.imageProviderDefault
        : undefined;

      let effectiveImageProvider = requestedImageProvider;
      let imageResult: Awaited<ReturnType<GenerationService['generateImage']>>;

      if (imagePrompt && requestedImageProvider) {
        try {
          imageResult = await this.generateImage(imagePrompt, requestedImageProvider);
          if (imageResult?.provider) {
            effectiveImageProvider = imageResult.provider as typeof effectiveImageProvider;
          }
        } catch (imageError) {
          const message = imageError instanceof Error ? imageError.message : String(imageError);
          this.logger.error(`Image generation failed with ${requestedImageProvider}: ${message}`);
          imageResult = undefined;
          effectiveImageProvider = undefined;
        }
      } else if (!imagePrompt) {
        this.logger.log('Image generation skipped because no visual prompt was produced.');
        imageResult = undefined;
      } else {
        this.logger.warn('Image generation requested but no provider configured.');
        imageResult = undefined;
      }

      const composition = await this.composePost(
        content.caption,
        content.hashtags,
        imageResult?.dataUrl || imageResult?.originalUrl,
      );

      const persisted = await this.diskStorageService.persist({
        jobId: id,
        topic: request.topic,
        caption: content.caption,
        hashtags: content.hashtags,
        provider: {
          text: 'openai',
          requestedImage: requestedImageProvider,
          effectiveImage: effectiveImageProvider,
          image: effectiveImageProvider,
        },
        imageUrl: imageResult?.originalUrl,
        visualPrompt: content.visualPrompt,
        textMetadata: content.metadata,
        image: imageResult
          ? {
              prompt: imageResult.prompt,
              revisedPrompt: imageResult.revisedPrompt,
              provider: imageResult.provider,
              model: imageResult.model,
              metadata: imageResult.metadata,
              url: imageResult.originalUrl,
            }
          : undefined,
        composition,
        requestedAt,
        startedAt,
      });

      await this.historyService.append({
        id: id,
        topic: request.topic,
        caption: content.caption,
        hashtags: content.hashtags,
        folder: persisted.folder,
        folderFs: persisted.folderFs,
        assets: persisted.assets,
        fsAssets: persisted.fsAssets,
        provider: {
          text: 'openai',
          requestedImage: requestedImageProvider,
          effectiveImage: effectiveImageProvider,
        },
        imagePrompt: imagePrompt,
        metadata: persisted.metadata,
        createdAt: persisted.metadata.completedAt || new Date().toISOString(),
      });

      this.logger.log(`Post generation completed for ID: ${id}`);

      return {
        id: id,
        topic: request.topic,
        caption: content.caption,
        hashtags: content.hashtags,
        folder: persisted.folder,
        folderFs: persisted.folderFs,
        assets: persisted.assets,
        fsAssets: persisted.fsAssets,
        provider: {
          text: 'openai',
          requestedImage: requestedImageProvider,
          effectiveImage: effectiveImageProvider,
          image: effectiveImageProvider,
        },
        imagePrompt,
        textMetadata: content.metadata,
        imageMetadata: imageResult?.metadata,
        imageModel: imageResult?.model,
        imageUrl: imageResult?.originalUrl,
        imageRevisedPrompt: imageResult?.revisedPrompt,
        metadata: {
          ...persisted.metadata,
          timings: {
            requestedAt: requestedAt.toISOString(),
            startedAt: startedAt.toISOString(),
            completedAt: persisted.metadata.completedAt,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Post generation failed for topic: ${request.topic}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private generateId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generatePostContent(request: GeneratePostRequest): Promise<PostContent> {
    this.logger.log('Generating caption, hashtags and visual prompt');

    const dto: GeneratePostDto = {
      topic: request.topic,
      includeImage: request.includeImage !== false,
    } as GeneratePostDto;

    const result = await this.openaiService.generatePost(dto);
    return result.content;
  }

  private async generateImage(
    prompt: string,
    provider: string | undefined,
  ): Promise<
    | ({
        dataUrl?: string;
        originalUrl?: string;
        metadata?: ImageGenerationResult['metadata'];
        prompt: string;
        revisedPrompt?: string;
        provider: string;
        model: string;
      })
    | undefined
  > {
    if (!provider) {
      return undefined;
    }

    this.logger.log(`Generating image with ${provider}`);

    if (provider !== 'dalle') {
      this.logger.warn(`Provider ${provider} is not supported yet. Skipping image generation.`);
      return undefined;
    }

    const image = await this.visualAiService.generateImage(prompt);
    const format = image.metadata?.format || 'png';
    const buffer = image.imageData;
    const dataUrl = buffer ? `data:image/${format};base64,${buffer.toString('base64')}` : undefined;

    return {
      dataUrl,
      originalUrl: image.imageUrl,
      metadata: image.metadata,
      prompt: image.prompt,
      revisedPrompt: image.revisedPrompt,
      provider: image.provider,
      model: image.model,
    };
  }

  private async composePost(
    caption: string,
    hashtags: string[],
    imageUrl: string | undefined,
  ): Promise<{ buffer: Buffer; format: string; width: number; height: number; engine: string; size: number; renderTime: number }> {
    this.logger.log('Rendering final artwork');

    if (!this.composerReady) {
      await this.composer.initialize();
      this.composerReady = true;
    }

    const composerResult = await this.composer.compose(
      {
        caption,
        hashtags,
      } as any,
      imageUrl || 'https://dummyimage.com/1080x1080/1e1b4b/ffffff.png&text=Nottu',
      {
        logoPosition: 'bottom-right',
        textOverlay: true,
      } as any,
      {
        engine: this.renderEngine,
        width: 1080,
        height: 1080,
        quality: 90,
        format: 'png',
      },
    );

    return {
      buffer: composerResult.buffer,
      format: composerResult.metadata.format,
      width: composerResult.metadata.width,
      height: composerResult.metadata.height,
      engine: composerResult.metadata.engine,
      size: composerResult.metadata.size,
      renderTime: composerResult.metadata.renderTime,
    };
  }
}
