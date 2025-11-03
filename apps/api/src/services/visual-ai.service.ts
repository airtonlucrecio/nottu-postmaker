import { Injectable, BadRequestException, InternalServerErrorException, OnModuleInit, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(VisualAIService.name);
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
          timeout: 0, // No timeout - allow unlimited processing time for image generation
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
      maxRetries?: number;
    },
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const maxRetries = options?.maxRetries || 7; // Increased for server errors

    try {
      return await this.generateWithDALLE(prompt, options, startTime, maxRetries);
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
    maxRetries: number = 7,
  ): Promise<ImageGenerationResult> {
    if (!this.config.dalle.apiKey) {
      throw new BadRequestException('DALL-E is not configured');
    }

    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Generating image with DALL-E using fetch (attempt ${attempt}/${maxRetries})`);
        
        // Use fetch instead of SDK to avoid timeout issues
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.dalle.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.dalle.model,
            prompt: this.enhancePromptForDALLE(prompt),
            n: 1,
            size: (options?.size || this.config.dalle.size),
            quality: (options?.quality || this.config.dalle.quality),
            style: (options?.style || this.config.dalle.style),
            response_format: 'url',
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          const isServerError = response.status >= 500 && response.status < 600;
          const isRateLimited = response.status === 429;
          const isBadGateway = response.status === 502 || response.status === 503;
          
          // Log the error with context
          this.logger.error(`DALL-E API failed with HTTP ${response.status} (attempt ${attempt}/${maxRetries}):`, errorData);
          
          // Handle permanent errors immediately (don't retry)
          if (response.status === 400) {
            throw new BadRequestException(`DALL-E error: ${errorData?.error?.message || errorText}`);
          } else if (response.status === 401) {
            throw new BadRequestException('Invalid OpenAI API key');
          } else if (response.status === 403) {
            throw new BadRequestException('OpenAI API access forbidden');
          }
          
          // Handle temporary errors with retry logic
          if (isServerError || isRateLimited || isBadGateway) {
            lastError = new Error(`OpenAI server error (HTTP ${response.status}): ${errorData?.error?.message || errorText}`);
            
            if (attempt < maxRetries) {
              // Exponential backoff with longer delays for server errors
              const baseDelay = isRateLimited ? 10000 : 5000; // 10s for rate limit, 5s for server errors
              const delay = baseDelay * Math.pow(2, attempt - 1); // 5s, 10s, 20s, 40s, 80s, 160s, 320s
              
              this.logger.warn(`Temporary OpenAI server error (HTTP ${response.status}). Retrying in ${delay/1000}s... (attempt ${attempt}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            // Unknown error, don't retry
            throw new InternalServerErrorException(`DALL-E API error (HTTP ${response.status}): ${errorData?.error?.message || errorText}`);
          }
        } else {
          // Success! Process the response
          const data = await response.json();
          const imageData = data.data?.[0];
          
          if (!imageData?.url) {
            throw new InternalServerErrorException('No image URL returned from DALL-E');
          }

          this.logger.log(`DALL-E image generated successfully: ${imageData.url} (attempt ${attempt}/${maxRetries})`);

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
        }
      } catch (error: any) {
        // Handle network errors and other exceptions
        this.logger.error(`DALL-E generation attempt ${attempt}/${maxRetries} failed:`, {
          error: error?.message,
          status: error?.status,
          code: error?.code,
          type: error?.type
        });
        
        if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
          throw error;
        }
        
        lastError = error;
        
        if (attempt < maxRetries) {
          // Network error - retry with exponential backoff
          const delay = 3000 * Math.pow(2, attempt - 1); // 3s, 6s, 12s, 24s, 48s, 96s, 192s
          this.logger.warn(`Network error during DALL-E generation. Retrying in ${delay/1000}s... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries exhausted
    this.logger.error(`DALL-E image generation failed after ${maxRetries} attempts. Last error:`, lastError);
    
    if (lastError?.message?.includes('server_error') || lastError?.message?.includes('HTTP 5')) {
      throw new InternalServerErrorException(
        `OpenAI servers are temporarily unavailable. Please try again later. (Failed after ${maxRetries} attempts)`
      );
    }
    
    throw new InternalServerErrorException(
      `Image generation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
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
        // Removed timeout to allow unlimited processing time for image download
      });
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.warn('Failed to download image:', error);
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