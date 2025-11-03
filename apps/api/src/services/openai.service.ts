import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GeneratePostDto, PostContent, AIProvider } from '@nottu/core';
import { Agent } from 'https';
import { Agent as HttpAgent } from 'http';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  reasoning: { effort: string };
  maxOutputTokens: number;
  organization?: string;
  imageModel: string;
  imageSize: string;
  imageQuality: string;
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
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private config: OpenAIConfig;
  private modelPriority: string[];

  constructor(private configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o',
      reasoning: { effort: this.configService.get<string>('OPENAI_REASONING_EFFORT') || 'medium' },
      maxOutputTokens: this.configService.get<number>('OPENAI_MAX_OUTPUT_TOKENS') || 4000,
      organization: this.configService.get<string>('OPENAI_ORGANIZATION'),
      imageModel: this.configService.get<string>('OPENAI_IMAGE_MODEL') || 'dall-e-3',
      imageSize: this.configService.get<string>('OPENAI_IMAGE_SIZE') || '1024x1024',
      imageQuality: this.configService.get<string>('OPENAI_IMAGE_QUALITY') || 'standard',
    };

    this.modelPriority = ['gpt-4o', 'gpt-3.5-turbo'];

    if (!this.config.apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    // Create custom HTTP agents with no timeout
    const httpsAgent = new Agent({
      timeout: 0,
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 50,
      maxFreeSockets: 10,
      scheduling: 'lifo'
    });

    const httpAgent = new HttpAgent({
      timeout: 0,
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 50,
      maxFreeSockets: 10,
      scheduling: 'lifo'
    });

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
      timeout: 0, // No timeout - allow unlimited processing time
      // @ts-ignore - OpenAI types don't include httpAgent but it's supported
      httpAgent: httpAgent,
      // @ts-ignore - OpenAI types don't include httpsAgent but it's supported
      httpsAgent: httpsAgent,
      maxRetries: 0, // We handle retries manually
    });
  }

  // Utility functions
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private backoffWithJitter(attempt: number): number {
    const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30s
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    return baseDelay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generic function for OpenAI chat with JSON response, retry and fallback
  private async chatJSON(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 1000,
    temperature: number = 0.7,
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: Error | null = null;
    const startTime = Date.now();

    this.logger.log(`Starting OpenAI request with ${this.modelPriority.length} models, maxRetries: ${maxRetries}`);

    // Try each model in priority order
    for (const model of this.modelPriority) {
      let attempt = 0;
      
      this.logger.log(`Trying model: ${model}`);
      
      while (attempt < maxRetries) {
        attempt++;
        const attemptStartTime = Date.now();
        
        try {
          this.logger.log(`Model ${model}, attempt ${attempt}/${maxRetries} - Starting request`);
          
          // Truncate prompts if they're too long to avoid context_length errors
          const truncatedSystemPrompt = this.truncateText(systemPrompt, 2000);
          const truncatedUserPrompt = this.truncateText(userPrompt, 6000);

          this.logger.log(`Model ${model}, attempt ${attempt} - Sending request to OpenAI API using fetch`);
          
          // Use fetch instead of SDK to avoid timeout issues
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: truncatedSystemPrompt
                },
                {
                  role: 'user',
                  content: truncatedUserPrompt
                }
              ],
              max_tokens: maxTokens,
              temperature,
              response_format: { type: 'json_object' } // Force JSON response
            })
          });

          const attemptTime = Date.now() - attemptStartTime;
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorData: any = {};
            
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }
            
            this.logger.error(`Model ${model}, attempt ${attempt} failed with HTTP ${response.status} after ${attemptTime}ms:`, errorData);
            
            // Handle specific HTTP errors
            if (response.status === 429 || response.status === 503 || response.status === 500) {
              if (attempt < maxRetries) {
                const delay = this.backoffWithJitter(attempt);
                this.logger.warn(`Rate limit/server error with ${model}, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
                await this.sleep(delay);
                continue;
              }
            }
            
            if (response.status === 400 && errorData?.error?.code === 'context_length_exceeded') {
              this.logger.warn(`Context length exceeded with ${model}, trying next model`);
              break;
            }
            
            throw new Error(`HTTP ${response.status}: ${errorData?.error?.message || errorText}`);
          }

          const data = await response.json();
          this.logger.log(`Model ${model}, attempt ${attempt} - Success in ${attemptTime}ms`);

          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error('Empty response from OpenAI');
          }

          // Parse JSON response
          const jsonResponse = JSON.parse(content);
          
          const totalTime = Date.now() - startTime;
          this.logger.log(`OpenAI request completed successfully in ${totalTime}ms using ${model}`);
          
          // Return successful response with metadata
          return {
            data: jsonResponse,
            model: model,
            usage: data.usage,
            attempt: attempt
          };

        } catch (error: any) {
           const attemptTime = Date.now() - attemptStartTime;
           lastError = error;
           
           this.logger.error(`Model ${model}, attempt ${attempt} failed after ${attemptTime}ms:`, {
             error: error?.message,
             status: error?.status,
             code: error?.code,
             type: error?.type,
             stack: error?.stack?.split('\n').slice(0, 3).join('\n')
           });
           
           // Check if it's a rate limit or server error that we should retry
           if (error?.message?.includes('HTTP 429') || error?.message?.includes('HTTP 503') || error?.message?.includes('HTTP 500')) {
            if (attempt < maxRetries) {
              const delay = this.backoffWithJitter(attempt);
              this.logger.warn(`Rate limit/server error with ${model}, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
              await this.sleep(delay);
              continue;
            }
          }
          
          // For context_length_exceeded, try next model immediately
           if (error?.message?.includes('context_length_exceeded')) {
            this.logger.warn(`Context length exceeded with ${model}, trying next model`);
            break;
          }
          
          // Check for timeout-related errors
          if (error?.message?.toLowerCase().includes('timeout') || 
              error?.code === 'ECONNRESET' || 
              error?.code === 'ETIMEDOUT' ||
              error?.type === 'request_timeout') {
            this.logger.error(`TIMEOUT DETECTED with ${model} on attempt ${attempt}: ${error?.message}`);
          }
          
          // For other errors, try next model after short delay
          if (attempt >= maxRetries) {
            this.logger.warn(`Max retries reached for ${model}, trying next model`);
            break;
          }
          
          // Short delay before retry with same model
          await this.sleep(1000);
        }
      }
    }

    const totalTime = Date.now() - startTime;
    this.logger.error(`All OpenAI models failed after ${totalTime}ms. Last error:`, lastError?.message);

    // If all models failed, throw the last error
    throw new BadRequestException(
      lastError?.message || 'All OpenAI models failed after retries'
    );
  }

  async generatePost(request: GeneratePostDto): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Build input prompt combining system and user instructions
      const inputPrompt = this.buildInputPrompt(request);

      // Use chatJSON with retry and fallback
      const result = await this.chatJSON(
        'You are an expert social media content creator. Always respond with valid JSON only.',
        inputPrompt,
        this.config.maxOutputTokens,
        0.7
      );

      // Extract the actual content from the result
      const parsedContent = result.data;

      // Validate and enhance content
      const validatedContent = this.validateAndEnhanceContent(parsedContent, request);
      
      // Update metadata with the actual model used
      validatedContent.metadata = {
        ...(validatedContent.metadata || {}),
        model: result.model
      };

      // Generate image if requested
      if (request.includeImage === true && validatedContent.visualPrompt) {
        try {
          const imageResult = await this.generateImageWithDalle3(validatedContent.visualPrompt, {
            size: request.size as '1024x1024' | '1792x1024' | '1024x1792',
            quality: request.quality as 'standard' | 'hd'
          });
          
          // Add image URLs to metadata
          validatedContent.metadata = {
            ...validatedContent.metadata,
            imageUrls: imageResult.urls,
            imageModel: imageResult.model
          };
        } catch (imageError: any) {
          // Log the error but don't fail the entire generation
          console.warn('Image generation failed:', imageError?.message);
          validatedContent.metadata = {
            ...validatedContent.metadata,
            imageError: imageError?.message || 'Image generation failed'
          };
        }
      }

      const generationTime = Date.now() - startTime;

      return {
        content: validatedContent,
        usage: {
          promptTokens: result.usage?.prompt_tokens || 0,
          completionTokens: result.usage?.completion_tokens || 0,
          totalTokens: result.usage?.total_tokens || 0,
        },
        model: result.model,
        provider: AIProvider.OPENAI,
        generationTime,
      };
    } catch (error: any) {
      // chatJSON already handles retries and fallbacks, so any error here is final
      throw new BadRequestException(`Failed to generate post: ${error?.message || 'Unknown error'}`);
    }
  }

  async generatePostStream(request: GeneratePostDto): Promise<AsyncIterable<string>> {
    const inputPrompt = this.buildInputPrompt(request);

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media content creator. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: inputPrompt
        }
      ],
      max_tokens: this.config.maxOutputTokens,
      temperature: 0.7,
      stream: true,
    });

    return this.processStream(stream);
  }

  private async* processStream(stream: any): AsyncIterable<string> {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
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
      const systemPrompt = 'You are a social media hashtag expert. Always respond with valid JSON only.';
      const userPrompt = `Generate ${count} relevant, trending hashtags for the given content.
Return ONLY a JSON object like {"hashtags":["tag1","tag2",...]} WITHOUT # prefix.

Content:
${content}`;

      const result = await this.chatJSON(systemPrompt, userPrompt, 500, 0.7);
      return Array.isArray(result.data?.hashtags) ? result.data.hashtags : [];
    } catch {
      return [];
    }
  }

  async improveContent(content: PostContent): Promise<PostContent> {
    try {
      const systemPrompt = 'You are a social media content optimizer. Always respond with valid JSON only.';
      const userPrompt = `Improve the post while keeping the core message. Return JSON:
{"caption":"...","hashtags":["h1","h2"],"visualPrompt":"..."}
Original: ${JSON.stringify(content)}`;

      const result = await this.chatJSON(systemPrompt, userPrompt, 1000, 0.7);
      const improved = this.validateAndEnhanceContent(result.data, null);
      improved.metadata = { ...(improved.metadata || {}), model: result.model };
      return improved;
    } catch {
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

  async generateImageWithDalle3(
    prompt: string,
    options: {
      size?: '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      n?: number;
      maxRetries?: number;
    } = {}
  ): Promise<{ urls: string[]; model: string }> {
    const {
      size = this.config.imageSize as '1024x1024' | '1792x1024' | '1024x1792',
      quality = this.config.imageQuality as 'standard' | 'hd',
      n = 1,
      maxRetries = 3
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.openai.images.generate({
          model: this.config.imageModel,
          prompt,
          size,
          quality,
          n,
        });

        const urls = response.data.map(image => image.url).filter(Boolean) as string[];
        
        if (urls.length === 0) {
          throw new BadRequestException('No image URLs returned from DALL-E 3');
        }

        return {
          urls,
          model: this.config.imageModel
        };

      } catch (error: any) {
        lastError = error;
        
        // Check if it's a retryable error (rate limit, server error)
        const isRetryable = error?.status === 429 || error?.status === 500 || error?.status === 503;
        
        if (!isRetryable || attempt === maxRetries) {
          break;
        }

        // Wait with exponential backoff
        const delay = this.backoffWithJitter(attempt);
        this.logger.warn(`Image generation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`);
        await this.sleep(delay);
      }
    }

    // If we get here, all retries failed
    const errorMessage = lastError?.message || 'Unknown error during image generation';
    throw new BadRequestException(`Failed to generate image after ${maxRetries} attempts: ${errorMessage}`);
  }

  async testConnection(): Promise<boolean> {
    try {
      this.logger.log('Testing OpenAI connection with simple request...');
      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      
      const duration = Date.now() - startTime;
      this.logger.log(`OpenAI connection test successful in ${duration}ms`);
      
      return !!response.choices[0]?.message?.content;
    } catch (error: any) {
      const duration = Date.now() - Date.now();
      this.logger.error(`OpenAI connection test failed after ${duration}ms:`, {
        error: error?.message,
        status: error?.status,
        code: error?.code,
        type: error?.type
      });
      return false;
    }
  }

  // Simple test method to isolate timeout issues
  async testSimpleRequest(): Promise<any> {
    this.logger.log('Testing simple OpenAI request to isolate timeout issues...');
    const startTime = Date.now();
    
    try {
      // First try with fetch directly to bypass SDK issues
      const fetchResponse = await this.testWithFetch();
      if (fetchResponse.success) {
        return fetchResponse;
      }
      
      // If fetch fails, try with SDK
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond with valid JSON only.' },
          { role: 'user', content: 'Generate a simple JSON object with a "message" field containing "Hello World"' }
        ],
        max_tokens: 50,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const duration = Date.now() - startTime;
      this.logger.log(`Simple OpenAI request successful in ${duration}ms`);
      
      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return { success: true, data: parsed, duration, model: 'gpt-3.5-turbo', method: 'sdk' };
      }
      
      return { success: false, error: 'Empty response', duration };
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Simple OpenAI request failed after ${duration}ms:`, {
        error: error?.message,
        status: error?.status,
        code: error?.code,
        type: error?.type
      });
      
      return { 
        success: false, 
        error: error?.message, 
        duration,
        errorDetails: {
          status: error?.status,
          code: error?.code,
          type: error?.type
        }
      };
    }
  }

  // Test with native fetch to bypass SDK issues
  private async testWithFetch(): Promise<any> {
    const startTime = Date.now();
    this.logger.log('Testing with native fetch...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Respond with valid JSON only.' },
            { role: 'user', content: 'Generate a simple JSON object with a "message" field containing "Hello World"' }
          ],
          max_tokens: 50,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Fetch request failed with status ${response.status}: ${errorText}`);
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${errorText}`, 
          duration,
          method: 'fetch'
        };
      }

      const data = await response.json();
      this.logger.log(`Fetch request successful in ${duration}ms`);
      
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return { 
          success: true, 
          data: parsed, 
          duration, 
          model: 'gpt-3.5-turbo',
          method: 'fetch',
          usage: data.usage
        };
      }
      
      return { success: false, error: 'Empty response from fetch', duration, method: 'fetch' };
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Fetch request failed after ${duration}ms:`, error?.message);
      
      return { 
        success: false, 
        error: error?.message, 
        duration,
        method: 'fetch'
      };
    }
  }

  getConfig(): Omit<OpenAIConfig, 'apiKey'> {
    return {
      model: this.config.model,
      reasoning: this.config.reasoning,
      maxOutputTokens: this.config.maxOutputTokens,
      organization: this.config.organization,
      imageModel: this.config.imageModel,
      imageSize: this.config.imageSize,
      imageQuality: this.config.imageQuality,
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