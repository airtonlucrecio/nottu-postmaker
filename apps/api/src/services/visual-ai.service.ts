import { Injectable, BadRequestException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import axios from 'axios';
import { PostContent } from '@nottu/core';

export interface VisualAIConfig {
  dalle: {
    apiKey: string;
    enabled: boolean;
    model: string;
    quality: string;
    style: string;
    size: string;
  };
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  configured: boolean;
}

export interface ImageGenerationResult {
  imageUrl: string;
  imageData?: Buffer;
  prompt: string;
  revisedPrompt?: string;
  provider: 'dalle';
  model: string;
  generationTime: number;
  metadata: {
    width: number;
    height: number;
    format: string;
    size?: number;
  };
}

@Injectable()
export class VisualAIService implements OnModuleInit {
  private openai?: OpenAI;
  private config: VisualAIConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      dalle: { 
        apiKey: '', 
        enabled: false,
        model: 'dall-e-3',
        quality: 'standard',
        style: 'vivid',
        size: '1024x1024'
      },
    };
  }

  async onModuleInit() {
    await this.initializeProviders();
  }

  private async initializeProviders(): Promise<void> {
    try {
      if (!this.configService) {
        this.config = {
          dalle: { 
            apiKey: '', 
            enabled: false,
            model: 'dall-e-3',
            quality: 'standard',
            style: 'vivid',
            size: '1024x1024'
          },
        };
        return;
      }

      // Get API keys from config
      const dalleFromConfig = this.configService.get<string>('DALLE_API_KEY');
      const openaiFromConfig = this.configService.get<string>('OPENAI_API_KEY');
      const dalleApiKey = dalleFromConfig || openaiFromConfig || '';

      // Initialize OpenAI client if we have an API key
      if (dalleApiKey) {
        this.openai = new OpenAI({
          apiKey: dalleApiKey,
        });
      }

      // Update configuration
      this.config = {
        dalle: {
          apiKey: dalleApiKey,
          enabled: !!dalleApiKey,
          model: 'dall-e-3',
          quality: 'standard',
          style: 'vivid',
          size: '1024x1024',
        },
      };
    } catch (error) {
      console.warn('Failed to load config from ConfigService, using defaults:', error);
      // Fallback to default empty config
      this.config = {
        dalle: { 
          apiKey: '', 
          enabled: false,
          model: 'dall-e-3',
          quality: 'standard',
          style: 'vivid',
          size: '1024x1024'
        },
      };
    }
  }

  async generateImage(
    prompt: string,
    options?: {
      width?: number;
      height?: number;
      quality?: string;
      style?: string;
      size?: string;
    },
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    try {
      return await this.generateWithDALLE(prompt, options, startTime);
    } catch (error) {
      throw error;
    }
  }

  async generateFromPostContent(
    content: PostContent,
  ): Promise<ImageGenerationResult> {
    // Create image prompt from post content
    const imagePrompt = this.createImagePromptFromContent(content);
    
    return await this.generateImage(imagePrompt);
  }

  async generateMultipleVariations(
    prompt: string,
    count: number = 3,
  ): Promise<ImageGenerationResult[]> {
    const variations: ImageGenerationResult[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Add variation to prompt
        const variationPrompt = `${prompt}, variation ${i + 1}, unique perspective`;
        const result = await this.generateImage(variationPrompt);
        variations.push(result);
      } catch (error) {
        // Continue with other variations
        console.warn(`Failed to generate variation ${i + 1}:`, error);
      }
    }

    return variations;
  }

  private async generateWithDALLE(
    prompt: string,
    options?: any,
    startTime: number = Date.now(),
  ): Promise<ImageGenerationResult> {
    if (!this.openai) {
      throw new BadRequestException('DALL-E is not configured');
    }

    try {
      const response = await this.openai.images.generate({
        model: this.config.dalle.model,
        prompt: this.enhancePromptForDALLE(prompt),
        n: 1,
        size: (options?.size || this.config.dalle.size) as "1024x1024" | "1792x1024" | "1024x1792",
        quality: (options?.quality || this.config.dalle.quality) as "standard" | "hd",
        style: (options?.style || this.config.dalle.style) as "vivid" | "natural",
        response_format: 'url',
      });

      const imageData = response.data[0];
      if (!imageData?.url) {
        throw new InternalServerErrorException('No image URL returned from DALL-E');
      }

      // Download image data
      const imageBuffer = await this.downloadImage(imageData.url);

      const generationTime = Date.now() - startTime;

      return {
        imageUrl: imageData.url,
        imageData: imageBuffer,
        prompt,
        revisedPrompt: imageData.revised_prompt,
        provider: 'dalle',
        model: this.config.dalle.model,
        generationTime,
        metadata: {
          width: parseInt(this.config.dalle.size.split('x')[0]),
          height: parseInt(this.config.dalle.size.split('x')[1]),
          format: 'png',
          size: imageBuffer?.length,
        },
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        if (error.status === 400) {
          throw new BadRequestException(`DALL-E error: ${error.message}`);
        } else if (error.status === 429) {
          throw new BadRequestException('DALL-E rate limit exceeded');
        }
      }
      throw new InternalServerErrorException('Failed to generate image with DALL-E');
    }
  }

  private enhancePromptForDALLE(prompt: string): string {
    return `${prompt}, high quality, professional, social media ready, vibrant colors, modern aesthetic`;
  }

  private createImagePromptFromContent(content: PostContent): string {
    const base = content.visualPrompt && content.visualPrompt.trim().length > 0
      ? content.visualPrompt
      : `Create a visually appealing social media image matching the caption: ${content.caption}`;

    let prompt = base;

    if (content.hashtags && content.hashtags.length > 0) {
      const relevantHashtags = content.hashtags.slice(0, 5).join(', ');
      prompt += `. Related themes: ${relevantHashtags}`;
    }

    prompt += '. Style: modern, professional, social media optimized, eye-catching';

    return prompt;
  }

  private async downloadImage(url: string): Promise<Buffer | undefined> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.warn('Failed to download image:', error);
      return undefined;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.openai) return false;
      await this.openai.models.list();
      return true;
    } catch (error) {
      console.warn('DALL-E connection test failed:', error);
      return false;
    }
  }

  getAvailableProviders(): ProviderInfo[] {
    const providers: ProviderInfo[] = [];

    if (this.config?.dalle?.enabled) {
      providers.push({
        id: 'dalle',
        name: 'DALL-E 3',
        description: 'OpenAI DALL-E 3 image generation',
        configured: true,
      });
    }

    return providers;
  }

  updateConfig(newConfig: Partial<VisualAIConfig['dalle']>): void {
    this.config.dalle = { ...this.config.dalle, ...newConfig };
    if (newConfig.apiKey) {
      this.openai = new OpenAI({ apiKey: newConfig.apiKey });
    }
  }

  // Getter methods for configuration
  getConfig(): VisualAIConfig {
    return this.config;
  }

  isConfigured(): boolean {
    return this.config.dalle.enabled && !!this.config.dalle.apiKey;
  }
}