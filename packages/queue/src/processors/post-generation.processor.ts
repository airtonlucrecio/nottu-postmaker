import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { 
  PostGenerationJobData, 
  PostGenerationResult,
  BatchGenerationJobData,
  BatchGenerationResult,
  ImageGenerationJobData,
  ImageGenerationResult,
  JobProgress 
} from '../types';

export class PostGenerationProcessor {
  private readonly logger = new Logger(PostGenerationProcessor.name);

  async processPostGeneration(
    job: Job<PostGenerationJobData, PostGenerationResult>
  ): Promise<PostGenerationResult> {
    const { id, userId, request, settings, options } = job.data;
    
    try {
      // Update progress - Starting
      await this.updateProgress(job, {
        step: 'initializing',
        progress: 0,
        message: 'Starting post generation...',
        details: {
          currentStep: 1,
          totalSteps: 5,
        }
      });

      // Validate input data
      this.validatePostGenerationData(job.data);

      // Step 1: Generate text content
      await this.updateProgress(job, {
        step: 'generating_text',
        progress: 20,
        message: 'Generating text content...',
        details: {
          currentStep: 2,
          totalSteps: 5,
        }
      });

      const textContent = await this.generateTextContent(request, settings);

      // Step 2: Generate image (if needed)
      let imageUrl: string | undefined;
      if (request.includeImage) {
        await this.updateProgress(job, {
          step: 'generating_image',
          progress: 40,
          message: 'Generating image...',
          details: {
            currentStep: 3,
            totalSteps: 5,
          }
        });

        imageUrl = await this.generateImage(textContent, request.provider);
      }

      // Step 3: Render final post
      await this.updateProgress(job, {
        step: 'rendering',
        progress: 60,
        message: 'Rendering final post...',
        details: {
          currentStep: 4,
          totalSteps: 5,
        }
      });

      const renderedImageUrl = await this.renderPost(
        textContent,
        imageUrl,
        settings,
        options?.renderOptions
      );

      // Step 4: Complete
      await this.updateProgress(job, {
        step: 'completed',
        progress: 100,
        message: 'Post generation completed successfully',
        details: {
          currentStep: 5,
          totalSteps: 5,
        }
      });

      return {
        id,
        success: true,
        content: textContent,
        imageUrl: renderedImageUrl,
        metadata: {
          generatedAt: new Date(),
          provider: request.provider,
          processingTime: Date.now() - job.timestamp,
        }
      };

    } catch (error) {
      this.logger.error(`Post generation failed for job ${job.id}`, (error as Error).message || 'Unknown error occurred');
      
      await this.updateProgress(job, {
        step: 'failed',
        progress: 0,
        message: `Generation failed: ${(error as Error).message || 'Unknown error'}`,
        details: {
          error: (error as Error).message || 'Unknown error occurred',
        }
      });

      return {
        id,
        success: false,
        error: (error as Error).message || 'Unknown error occurred',
        metadata: {
          generatedAt: new Date(),
          provider: request.provider,
          processingTime: Date.now() - job.timestamp,
        }
      };
    }
  }

  async processBatchGeneration(
    job: Job<BatchGenerationJobData, BatchGenerationResult>
  ): Promise<BatchGenerationResult> {
    const { batchId, userId, requests, settings, options } = job.data;
    const results: PostGenerationResult[] = [];
    const totalRequests = requests.length;

    try {
      this.logger.log(`Starting batch generation for ${totalRequests} posts`);

      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        const progress = Math.round(((i + 1) / totalRequests) * 100);

        await this.updateProgress(job, {
          step: 'processing_batch',
          progress,
          message: `Processing post ${i + 1} of ${totalRequests}`,
          details: {
            currentPost: i + 1,
            totalPosts: totalRequests,
            completedPosts: i,
          }
        });

        try {
          // Create a mock job for individual post processing
          const mockJob = {
            id: `${job.id}-${i}`,
            data: {
              id: `${batchId}-${i}`,
              userId,
              request,
              settings,
              options
            },
            timestamp: Date.now()
          } as Job<PostGenerationJobData, PostGenerationResult>;

          const result = await this.processPostGeneration(mockJob);
          results.push(result);

        } catch (error) {
          this.logger.error(`Failed to process post ${i + 1} in batch ${batchId}`, (error as Error).message);
          
          results.push({
            id: `${batchId}-${i}`,
            success: false,
            error: (error as Error).message || 'Unknown error occurred',
            metadata: {
              generatedAt: new Date(),
              provider: request.provider,
              processingTime: 0,
            }
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      await this.updateProgress(job, {
        step: 'completed',
        progress: 100,
        message: `Batch generation completed: ${successCount} successful, ${failureCount} failed`,
        details: {
          totalPosts: totalRequests,
          successfulPosts: successCount,
          failedPosts: failureCount,
        }
      });

      return {
        batchId,
        success: failureCount === 0,
        results,
        summary: {
          total: totalRequests,
          successful: successCount,
          failed: failureCount,
        },
        metadata: {
          generatedAt: new Date(),
          processingTime: Date.now() - job.timestamp,
        }
      };

    } catch (error) {
      this.logger.error(`Batch generation failed for batch ${batchId}`, (error as Error).message);
      
      return {
        batchId,
        success: false,
        results,
        error: (error as Error).message || 'Unknown error occurred',
        summary: {
          total: totalRequests,
          successful: results.filter(r => r.success).length,
          failed: results.length - results.filter(r => r.success).length,
        },
        metadata: {
          generatedAt: new Date(),
          processingTime: Date.now() - job.timestamp,
        }
      };
    }
  }

  async processImageGeneration(
    job: Job<ImageGenerationJobData, ImageGenerationResult>
  ): Promise<ImageGenerationResult> {
    const { id, userId, prompt, provider, options } = job.data;

    try {
      await this.updateProgress(job, {
        step: 'generating_image',
        progress: 0,
        message: 'Starting image generation...',
        details: {
          provider,
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        }
      });

      const imageResult = await this.generateImageWithProvider(
        { prompt },
        provider,
        options
      );

      await this.updateProgress(job, {
        step: 'completed',
        progress: 100,
        message: 'Image generation completed successfully',
        details: {
          imageSize: `${imageResult.width}x${imageResult.height}`,
          format: imageResult.format,
        }
      });

      return {
        id,
        success: true,
        imageUrl: imageResult.url,
        imageData: imageResult.data,
        metadata: {
          width: imageResult.width,
          height: imageResult.height,
          format: imageResult.format,
          provider,
          generatedAt: new Date(),
          processingTime: Date.now() - job.timestamp,
        }
      };

    } catch (error) {
      this.logger.error(`Image generation failed for job ${job.id}`, (error as Error).message);
      
      return {
        id,
        success: false,
        error: (error as Error).message || 'Unknown error occurred',
        metadata: {
          provider,
          generatedAt: new Date(),
          processingTime: Date.now() - job.timestamp,
        }
      };
    }
  }

  private async updateProgress(job: Job, progress: JobProgress): Promise<void> {
    try {
      await job.updateProgress(progress);
    } catch (error) {
      this.logger.warn(`Failed to update job progress: ${job.id}`, (error as Error).message);
    }
  }

  private validatePostGenerationData(data: PostGenerationJobData): void {
    if (!data.id) {
      throw new Error('Job ID is required');
    }
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    if (!data.request) {
      throw new Error('Generation request is required');
    }
    if (!data.request.topic && !data.request.customPrompt) {
      throw new Error('Either topic or custom prompt is required');
    }
    if (!data.request.provider) {
      throw new Error('AI provider is required');
    }
  }

  private async generateTextContent(request: any, settings: any): Promise<any> {
    // Mock implementation - replace with actual AI service integration
    return {
      caption: `Generated caption for: ${request.topic || request.customPrompt}`,
      hashtags: ['#generated', '#ai', '#content'],
      description: 'AI-generated content description'
    };
  }

  private async generateImage(content: any, provider: string): Promise<string> {
    // Mock implementation - replace with actual image generation service
    return 'https://example.com/generated-image.jpg';
  }

  private async renderPost(
    content: any, 
    imageUrl?: string, 
    settings?: any, 
    renderOptions?: any
  ): Promise<string> {
    // Mock implementation - replace with actual render service integration
    return 'https://example.com/rendered-post.jpg';
  }

  private async generateImageWithProvider(
    content: any,
    provider: string,
    options?: any
  ): Promise<{
    url: string;
    data: Buffer;
    width: number;
    height: number;
    format: string;
  }> {
    // Mock implementation - replace with actual image generation service
    return {
      url: 'https://example.com/generated-image.jpg',
      data: Buffer.from('mock-image-data'),
      width: 1024,
      height: 1024,
      format: 'jpeg'
    };
  }
}