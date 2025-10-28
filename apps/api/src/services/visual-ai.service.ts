import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import axios from 'axios';
import { PostContent } from '@nottu/core';

export interface VisualAIConfig {
  dalle?: {
    apiKey: string;
    model: string;
    quality: 'standard' | 'hd';
    style: 'vivid' | 'natural';
    size: '1024x1024' | '1792x1024' | '1024x1792';
  };
  flux?: {
    apiKey: string;
    model: string;
    aspectRatio: string;
    outputFormat: string;
    baseUrl: string;
  };
  leonardo?: {
    apiKey: string;
    model: string;
    photoReal: boolean;
    alchemy: boolean;
    baseUrl: string;
  };
}

export interface ImageGenerationResult {
  imageUrl: string;
  imageData?: Buffer;
  prompt: string;
  revisedPrompt?: string;
  provider: 'dalle' | 'flux' | 'leonardo';
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
export class VisualAIService {
  private openai?: OpenAI;
  private config: VisualAIConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      dalle: {
        apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
        model: this.configService.get<string>('DALLE_MODEL') || 'dall-e-3',
        quality: (this.configService.get<string>('DALLE_QUALITY') as 'standard' | 'hd') || 'standard',
        style: (this.configService.get<string>('DALLE_STYLE') as 'vivid' | 'natural') || 'vivid',
        size: (this.configService.get<string>('DALLE_SIZE') as '1024x1024' | '1792x1024' | '1024x1792') || '1024x1024',
      },
      flux: {
        apiKey: this.configService.get<string>('FLUX_API_KEY') || '',
        model: this.configService.get<string>('FLUX_MODEL') || 'flux-pro',
        aspectRatio: this.configService.get<string>('FLUX_ASPECT_RATIO') || '1:1',
        outputFormat: this.configService.get<string>('FLUX_OUTPUT_FORMAT') || 'png',
        baseUrl: this.configService.get<string>('FLUX_BASE_URL') || 'https://api.bfl.ml',
      },
      leonardo: {
        apiKey: this.configService.get<string>('LEONARDO_API_KEY') || '',
        model: this.configService.get<string>('LEONARDO_MODEL') || 'leonardo-creative',
        photoReal: this.configService.get<string>('LEONARDO_PHOTO_REAL') === 'true',
        alchemy: this.configService.get<string>('LEONARDO_ALCHEMY') === 'true',
        baseUrl: this.configService.get<string>('LEONARDO_BASE_URL') || 'https://cloud.leonardo.ai/api/rest/v1',
      },
    };

    // Initialize OpenAI for DALL-E if API key is available
    if (this.config.dalle?.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.dalle.apiKey,
      });
    }
  }

  async generateImage(
    prompt: string,
    provider: 'dalle' | 'flux' | 'leonardo' = 'dalle',
    options?: {
      width?: number;
      height?: number;
      quality?: string;
      style?: string;
    },
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    try {
      switch (provider) {
        case 'dalle':
          return await this.generateWithDALLE(prompt, options, startTime);
        case 'flux':
          return await this.generateWithFlux(prompt, options, startTime);
        case 'leonardo':
          return await this.generateWithLeonardo(prompt, options, startTime);
        default:
          throw new BadRequestException(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error generating image with ${provider}:`, error);
      throw error;
    }
  }

  async generateFromPostContent(
    content: PostContent,
    provider: 'dalle' | 'flux' | 'leonardo' = 'dalle',
  ): Promise<ImageGenerationResult> {
    // Create image prompt from post content
    const imagePrompt = this.createImagePromptFromContent(content);
    
    return await this.generateImage(imagePrompt, provider);
  }

  async generateMultipleVariations(
    prompt: string,
    count: number = 3,
    provider: 'dalle' | 'flux' | 'leonardo' = 'dalle',
  ): Promise<ImageGenerationResult[]> {
    const variations: ImageGenerationResult[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Add variation to prompt
        const variationPrompt = `${prompt}, variation ${i + 1}, unique perspective`;
        const result = await this.generateImage(variationPrompt, provider);
        variations.push(result);
      } catch (error) {
        console.error(`Error generating variation ${i + 1}:`, error);
        // Continue with other variations
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
        model: this.config.dalle!.model,
        prompt: this.enhancePromptForDALLE(prompt),
        n: 1,
        size: options?.size || this.config.dalle!.size,
        quality: options?.quality || this.config.dalle!.quality,
        style: options?.style || this.config.dalle!.style,
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
        model: this.config.dalle!.model,
        generationTime,
        metadata: {
          width: parseInt(this.config.dalle!.size.split('x')[0]),
          height: parseInt(this.config.dalle!.size.split('x')[1]),
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

  private async generateWithFlux(
    prompt: string,
    options?: any,
    startTime: number = Date.now(),
  ): Promise<ImageGenerationResult> {
    if (!this.config.flux?.apiKey) {
      throw new BadRequestException('Flux is not configured');
    }

    try {
      const response = await axios.post(
        `${this.config.flux.baseUrl}/v1/flux-pro`,
        {
          prompt: this.enhancePromptForFlux(prompt),
          width: options?.width || 1024,
          height: options?.height || 1024,
          prompt_upsampling: true,
          seed: Math.floor(Math.random() * 1000000),
          safety_tolerance: 2,
          output_format: this.config.flux.outputFormat,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.flux.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data?.result?.sample) {
        throw new InternalServerErrorException('No image data returned from Flux');
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(response.data.result.sample, 'base64');
      
      const generationTime = Date.now() - startTime;

      return {
        imageUrl: `data:image/${this.config.flux.outputFormat};base64,${response.data.result.sample}`,
        imageData: imageBuffer,
        prompt,
        provider: 'flux',
        model: this.config.flux.model,
        generationTime,
        metadata: {
          width: options?.width || 1024,
          height: options?.height || 1024,
          format: this.config.flux.outputFormat,
          size: imageBuffer.length,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new BadRequestException(`Flux error: ${error.response.data?.message || error.message}`);
        } else if (error.response?.status === 429) {
          throw new BadRequestException('Flux rate limit exceeded');
        }
      }
      throw new InternalServerErrorException('Failed to generate image with Flux');
    }
  }

  private async generateWithLeonardo(
    prompt: string,
    options?: any,
    startTime: number = Date.now(),
  ): Promise<ImageGenerationResult> {
    if (!this.config.leonardo?.apiKey) {
      throw new BadRequestException('Leonardo is not configured');
    }

    try {
      // First, create generation request
      const generationResponse = await axios.post(
        `${this.config.leonardo.baseUrl}/generations`,
        {
          prompt: this.enhancePromptForLeonardo(prompt),
          modelId: this.config.leonardo.model,
          width: options?.width || 1024,
          height: options?.height || 1024,
          num_images: 1,
          photoReal: this.config.leonardo.photoReal,
          alchemy: this.config.leonardo.alchemy,
          presetStyle: 'DYNAMIC',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.leonardo.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const generationId = generationResponse.data?.sdGenerationJob?.generationId;
      if (!generationId) {
        throw new InternalServerErrorException('No generation ID returned from Leonardo');
      }

      // Poll for completion
      let imageUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (!imageUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await axios.get(
          `${this.config.leonardo.baseUrl}/generations/${generationId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.leonardo.apiKey}`,
            },
          },
        );

        const generation = statusResponse.data?.generations_by_pk;
        if (generation?.status === 'COMPLETE' && generation.generated_images?.length > 0) {
          imageUrl = generation.generated_images[0].url;
        } else if (generation?.status === 'FAILED') {
          throw new InternalServerErrorException('Leonardo generation failed');
        }

        attempts++;
      }

      if (!imageUrl) {
        throw new InternalServerErrorException('Leonardo generation timed out');
      }

      // Download image data
      const imageBuffer = await this.downloadImage(imageUrl);

      const generationTime = Date.now() - startTime;

      return {
        imageUrl,
        imageData: imageBuffer,
        prompt,
        provider: 'leonardo',
        model: this.config.leonardo.model,
        generationTime,
        metadata: {
          width: options?.width || 1024,
          height: options?.height || 1024,
          format: 'jpg',
          size: imageBuffer?.length,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new BadRequestException(`Leonardo error: ${error.response.data?.message || error.message}`);
        } else if (error.response?.status === 429) {
          throw new BadRequestException('Leonardo rate limit exceeded');
        }
      }
      throw new InternalServerErrorException('Failed to generate image with Leonardo');
    }
  }

  private enhancePromptForDALLE(prompt: string): string {
    return `${prompt}, high quality, professional, social media ready, vibrant colors, modern aesthetic`;
  }

  private enhancePromptForFlux(prompt: string): string {
    return `${prompt}, ultra high quality, photorealistic, professional photography, perfect composition, vibrant colors`;
  }

  private enhancePromptForLeonardo(prompt: string): string {
    return `${prompt}, masterpiece, best quality, ultra detailed, professional, cinematic lighting, vibrant colors`;
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
      console.error('Error downloading image:', error);
      return undefined;
    }
  }

  async testConnection(provider: 'dalle' | 'flux' | 'leonardo'): Promise<boolean> {
    try {
      switch (provider) {
        case 'dalle':
          if (!this.openai) return false;
          await this.openai.models.list();
          return true;

        case 'flux':
          if (!this.config.flux?.apiKey) return false;
          const fluxResponse = await axios.get(`${this.config.flux.baseUrl}/health`, {
            headers: { 'Authorization': `Bearer ${this.config.flux.apiKey}` },
            timeout: 5000,
          });
          return fluxResponse.status === 200;

        case 'leonardo':
          if (!this.config.leonardo?.apiKey) return false;
          const leonardoResponse = await axios.get(`${this.config.leonardo.baseUrl}/me`, {
            headers: { 'Authorization': `Bearer ${this.config.leonardo.apiKey}` },
            timeout: 5000,
          });
          return leonardoResponse.status === 200;

        default:
          return false;
      }
    } catch (error) {
      console.error(`${provider} connection test failed:`, error);
      return false;
    }
  }

  getAvailableProviders(): Array<{
    id: string;
    name: string;
    configured: boolean;
    models: string[];
  }> {
    return [
      {
        id: 'dalle',
        name: 'DALL-E',
        configured: !!this.config.dalle?.apiKey,
        models: ['dall-e-3', 'dall-e-2'],
      },
      {
        id: 'flux',
        name: 'Flux',
        configured: !!this.config.flux?.apiKey,
        models: ['flux-pro', 'flux-dev'],
      },
      {
        id: 'leonardo',
        name: 'Leonardo AI',
        configured: !!this.config.leonardo?.apiKey,
        models: ['leonardo-creative', 'leonardo-select'],
      },
    ];
  }

  updateConfig(provider: 'dalle' | 'flux' | 'leonardo', newConfig: any): void {
    if (provider === 'dalle') {
      this.config.dalle = { ...this.config.dalle, ...newConfig };
      if (newConfig.apiKey) {
        this.openai = new OpenAI({ apiKey: newConfig.apiKey });
      }
    } else if (provider === 'flux') {
      this.config.flux = { ...this.config.flux, ...newConfig };
    } else if (provider === 'leonardo') {
      this.config.leonardo = { ...this.config.leonardo, ...newConfig };
    }
  }
}