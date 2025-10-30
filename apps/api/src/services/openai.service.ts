import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GeneratePostDto, PostContent, AIProvider } from '@nottu/core';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
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
      temperature: parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') || '0.7'),
      maxTokens: parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '2000'),
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
      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(request);

      // Build user prompt
      const userPrompt = this.buildUserPrompt(request);

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
      });

      // Parse response
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new InternalServerErrorException('No response from OpenAI');
      }

      let parsedContent: any;
      try {
        parsedContent = JSON.parse(response);
      } catch (error) {
        throw new InternalServerErrorException('Invalid JSON response from OpenAI');
      }

      // Validate and enhance content
      const validatedContent = this.validateAndEnhanceContent(parsedContent, request);

      const generationTime = Date.now() - startTime;

      return {
        content: validatedContent,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        model: this.config.model,
        provider: AIProvider.OPENAI,
        generationTime,
      };
    } catch (error) {
      console.error('OpenAI generation error:', error);

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
        console.error(`Error generating variation ${i + 1}:`, error);
        // Continue with other variations
      }
    }

    return variations;
  }

  async generateHashtags(content: string, count: number = 10): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a social media hashtag expert. Generate relevant, trending hashtags for the given content. Return only a JSON array of hashtags without the # symbol.`,
          },
          {
            role: 'user',
            content: `Generate ${count} relevant hashtags for this content: ${content}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      const parsed = JSON.parse(response);
      return Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return [];
    }
  }

  async improveContent(content: PostContent): Promise<PostContent> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a social media content optimizer. Improve the given post content while maintaining its core message. Make it more engaging, clear, and impactful. Return the improved content in JSON format.`,
          },
          {
            role: 'user',
            content: `Improve this post content: ${JSON.stringify(content)}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return content;
      }

      const improved = JSON.parse(response);
      return this.validateAndEnhanceContent(improved, null);
    } catch (error) {
      console.error('Error improving content:', error);
      return content;
    }
  }

  private buildSystemPrompt(request: GeneratePostDto): string {
    const tone = request.aiSettings && (request.aiSettings as any).tone ? (request.aiSettings as any).tone : 'neutral';
    const style = request.style || 'modern';
    return `You are an expert social media content creator.

Your task is to create engaging, high-quality social media content that:
- Matches the specified tone: ${tone}
- Follows current social media best practices
- Is authentic and engaging

Return your response as a JSON object with this exact structure:
{
  "caption": "Main post caption",
  "hashtags": ["hashtag1", "hashtag2"],
  "visualPrompt": "Concise visual description for an image"
}`;
  }

  private buildUserPrompt(request: GeneratePostDto): string {
    const parts: string[] = [];
    parts.push(`Topic: ${request.topic}`);
    if (request.customPrompt) parts.push(`Custom prompt: ${request.customPrompt}`);
    if (request.style) parts.push(`Style: ${request.style}`);
    const ai = request.aiSettings || {};
    if ((ai as any).language) parts.push(`Language: ${(ai as any).language}`);
    if ((ai as any).targetAudience) parts.push(`Target audience: ${(ai as any).targetAudience}`);
    if ((ai as any).keywords && Array.isArray((ai as any).keywords)) {
      parts.push(`Keywords: ${(ai as any).keywords.join(', ')}`);
    }
    parts.push('Return JSON only with keys caption, hashtags, visualPrompt.');
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
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  getConfig(): Omit<OpenAIConfig, 'apiKey'> {
    return {
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
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