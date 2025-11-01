import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GeneratePostDto, PostContent, AIProvider } from '@nottu/core';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  reasoning: { effort: string };
  maxOutputTokens: number;
  organization?: string;
}

export interface GenerationResult {
  content: PostContent;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
  generationTime: number;
}

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private config: OpenAIConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-5',
      reasoning: { 
        effort: this.configService.get<string>('OPENAI_REASONING_EFFORT') || 'medium' 
      },
      maxOutputTokens: parseInt(this.configService.get<string>('OPENAI_MAX_OUTPUT_TOKENS') || '2000'),
      organization: this.configService.get<string>('OPENAI_ORGANIZATION'),
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
    });
  }

  async generatePost(request: GeneratePostDto): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Build input prompt combining system and user instructions
      const inputPrompt = this.buildInputPrompt(request);

      // Call OpenAI Responses API
      const response = await this.openai.responses.create({
        model: this.config.model,
        input: inputPrompt,
        reasoning: this.config.reasoning,
        max_output_tokens: this.config.maxOutputTokens,
      });

      // Parse response
      const responseText = response.output_text;
      if (!responseText) {
        throw new InternalServerErrorException('No response from OpenAI');
      }

      let parsedContent: any;
      try {
        parsedContent = JSON.parse(responseText);
      } catch (error) {
        // If not JSON, try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedContent = JSON.parse(jsonMatch[0]);
          } catch {
            throw new InternalServerErrorException('Invalid JSON response from OpenAI');
          }
        } else {
          throw new InternalServerErrorException('Invalid JSON response from OpenAI');
        }
      }

      // Validate and enhance content
      const validatedContent = this.validateAndEnhanceContent(parsedContent, request);

      const generationTime = Date.now() - startTime;

      return {
        content: validatedContent,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
        model: this.config.model,
        provider: AIProvider.OPENAI,
        generationTime,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new BadRequestException('Invalid OpenAI API key');
        } else if (error.status === 429) {
          throw new BadRequestException('OpenAI rate limit exceeded');
        } else if (error.status === 400) {
          throw new BadRequestException(`OpenAI API error: ${error.message}`);
        }
      }

      throw new InternalServerErrorException('Failed to generate post with OpenAI');
    }
  }

  async generatePostStream(request: GeneratePostDto): Promise<AsyncIterable<string>> {
    const inputPrompt = this.buildInputPrompt(request);

    const stream = await this.openai.responses.stream({
      model: this.config.model,
      input: inputPrompt,
      reasoning: this.config.reasoning,
      max_output_tokens: this.config.maxOutputTokens,
    });

    return this.processStream(stream);
  }

  private async* processStream(stream: any): AsyncIterable<string> {
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        yield event.delta;
      }
    }
  }

  async generateVariations(
    originalContent: PostContent,
    count: number = 3,
  ): Promise<GenerationResult[]> {
    const variations: GenerationResult[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const variationRequest: GeneratePostDto = {
          topic: `Variation of: ${(originalContent.caption || '').slice(0, 200)}`,
          customPrompt: 'Create a different angle with similar theme',
          style: 'engaging',
        } as any;

        const variation = await this.generatePost(variationRequest);
        variations.push(variation);
      } catch (error) {
        // Continue with other variations
      }
    }

    return variations;
  }

  async generateHashtags(content: string, count: number = 10): Promise<string[]> {
    try {
      const inputPrompt = `You are a social media hashtag expert. Generate ${count} relevant, trending hashtags for the given content. Return only a JSON array of hashtags without the # symbol.

Content: ${content}

Return format: {"hashtags": ["hashtag1", "hashtag2", ...]}`;

      const response = await this.openai.responses.create({
        model: this.config.model,
        input: inputPrompt,
        reasoning: this.config.reasoning,
        max_output_tokens: 500,
      });

      const responseText = response.output_text;
      if (!responseText) {
        return [];
      }

      const parsed = JSON.parse(responseText);
      return Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    } catch (error) {
      return [];
    }
  }

  async improveContent(content: PostContent): Promise<PostContent> {
    try {
      const inputPrompt = `You are a social media content optimizer. Improve the given post content while maintaining its core message. Make it more engaging, clear, and impactful. Return the improved content in JSON format.

Original content: ${JSON.stringify(content)}

Return format: {"caption": "improved caption", "hashtags": ["hashtag1", "hashtag2"], "visualPrompt": "improved visual description"}`;

      const response = await this.openai.responses.create({
        model: this.config.model,
        input: inputPrompt,
        reasoning: this.config.reasoning,
        max_output_tokens: 1000,
      });

      const responseText = response.output_text;
      if (!responseText) {
        return content;
      }

      const improved = JSON.parse(responseText);
      return this.validateAndEnhanceContent(improved, null);
    } catch (error) {
      return content;
    }
  }

  private buildInputPrompt(request: GeneratePostDto): string {
    const tone = request.aiSettings && (request.aiSettings as any).tone ? (request.aiSettings as any).tone : 'neutral';
    const style = request.style || 'modern';
    
    const parts: string[] = [];
    parts.push(`You are an expert social media content creator.`);
    parts.push(`Your task is to create engaging, high-quality social media content that:`);
    parts.push(`- Matches the specified tone: ${tone}`);
    parts.push(`- Follows current social media best practices`);
    parts.push(`- Is authentic and engaging`);
    parts.push('');
    parts.push(`Topic: ${request.topic}`);
    
    if (request.customPrompt) parts.push(`Custom prompt: ${request.customPrompt}`);
    if (request.style) parts.push(`Style: ${request.style}`);
    
    const ai = request.aiSettings || {};
    if ((ai as any).language) parts.push(`Language: ${(ai as any).language}`);
    if ((ai as any).targetAudience) parts.push(`Target audience: ${(ai as any).targetAudience}`);
    if ((ai as any).keywords && Array.isArray((ai as any).keywords)) {
      parts.push(`Keywords: ${(ai as any).keywords.join(', ')}`);
    }
    
    parts.push('');
    parts.push('Return your response as a JSON object with this exact structure:');
    parts.push('{');
    parts.push('  "caption": "Main post caption",');
    parts.push('  "hashtags": ["hashtag1", "hashtag2"],');
    parts.push('  "visualPrompt": "Concise visual description for an image"');
    parts.push('}');
    
    return parts.join('\n');
  }

  private validateAndEnhanceContent(content: any, request: GeneratePostDto | null): PostContent {
    const caption = content.caption || content.text || content.content || '';
    if (!caption || typeof caption !== 'string') {
      throw new BadRequestException('Generated caption is empty');
    }

    let hashtags: string[] = Array.isArray(content.hashtags) ? content.hashtags : [];
    hashtags = hashtags.map((tag: string) => (tag.startsWith('#') ? tag.substring(1) : tag));

    // Limit hashtag count to a reasonable default
    if (hashtags.length > 30) hashtags = hashtags.slice(0, 30);

    const visualPrompt =
      content.visualPrompt ||
      (request?.customPrompt ? `Image for: ${request.customPrompt}` : `Image for topic: ${request?.topic}`);

    return {
      caption,
      hashtags,
      visualPrompt,
      metadata: {
        model: this.config.model,
      },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  getConfig(): Omit<OpenAIConfig, 'apiKey'> {
    return {
      model: this.config.model,
      reasoning: this.config.reasoning,
      maxOutputTokens: this.config.maxOutputTokens,
      organization: this.config.organization,
    };
  }

  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.apiKey) {
      this.openai = new OpenAI({
        apiKey: newConfig.apiKey,
        organization: this.config.organization,
      });
    }
  }
}