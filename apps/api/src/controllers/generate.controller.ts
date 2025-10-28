import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  HttpException,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { GeneratePostDto, PostResponseDto, ValidationUtils, PostStatus, AIProvider } from '@nottu/core';
import { GenerationService, GenerationResponse } from '../services/generation.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { QueueService } from '@nottu/queue';

@Controller('api/generate')
@UseGuards(ApiKeyGuard, RateLimitGuard)
export class GenerateController {
  constructor(
    private readonly generationService: GenerationService,
    private readonly queueService: QueueService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async generatePost(
    @Body() generatePostDto: GeneratePostDto,
    @Req() request: Request,
  ): Promise<any> {
    try {
      this.validateGenerateRequest(generatePostDto);

      const job = await this.queueService.addPostGenerationJob({
        id: `post-${Date.now()}`,
        request: generatePostDto,
        settings: {},
        options: {
          priority: 'normal',
        },
      });

      return {
        success: true,
        jobId: job.id,
        message: 'Post generation started',
        estimatedTime: '30-60 seconds',
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          code: 'GENERATION_FAILED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async generatePreview(
    @Body() generatePostDto: GeneratePostDto,
    @Req() request: Request,
  ): Promise<{ previewUrl: string }> {
    try {
      this.validateGenerateRequest(generatePostDto);

      const userId = this.extractUserId(request);

      const result = await this.generationService.generatePreview({
        ...generatePostDto,
        userId,
      });

      return { previewUrl: result.previewUrl };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error generating preview:', error);
      throw new InternalServerErrorException(
        'Failed to generate preview. Please try again.',
      );
    }
  }

  @Post('template')
  @HttpCode(HttpStatus.OK)
  async generateFromTemplate(
    @Body()
    body: {
      templateId: string;
      data: Record<string, any>;
      settings?: {
        width?: number;
        height?: number;
        format?: 'png' | 'jpg' | 'webp';
        quality?: number;
      };
    },
    @Req() request: Request,
  ): Promise<PostResponseDto> {
    try {
      this.validateTemplateRequest(body);

      const userId = this.extractUserId(request);

      const renderOptions = body.settings
        ? {
            width: body.settings.width,
            height: body.settings.height,
            format: body.settings.format,
            quality: body.settings.quality,
          }
        : undefined;

      const gen = await this.generationService.generateFromTemplate(
        body.templateId,
        body.data,
        {
          userId,
          renderOptions,
        },
      );

      const status = gen.status === 'completed' ? PostStatus.COMPLETED : PostStatus.FAILED;

      return {
        id: gen.id,
        imageUrl: gen.imageUrl || '',
        imagePath: '',
        caption: gen.content.caption || '',
        hashtags: gen.content.hashtags || [],
        folder: gen.settings?.outputPath || '',
        status,
        processingTime: gen.metadata.generationTime,
        metadata: {
          aiProvider: (gen.metadata.aiProvider as unknown) as AIProvider,
          renderEngine: 'satori',
          imagePrompt: gen.content.visualPrompt || '',
          gptResponse: undefined,
          timestamp: new Date().toISOString(),
          template: body.templateId,
        },
        createdAt: new Date(),
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error generating from template:', error);
      throw new InternalServerErrorException(
        'Failed to generate post from template. Please try again.',
      );
    }
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async generateBatch(
    @Body()
    body: {
      posts: GeneratePostDto[];
      settings?: {
        format?: 'png' | 'jpg' | 'webp';
        quality?: number;
      };
    },
    @Req() request: Request,
  ): Promise<GenerationResponse[]> {
    try {
      if (!body.posts || !Array.isArray(body.posts) || body.posts.length === 0) {
        throw new BadRequestException('Posts array is required and cannot be empty');
      }

      if (body.posts.length > 10) {
        throw new BadRequestException('Maximum 10 posts allowed per batch');
      }

      body.posts.forEach((post, index) => {
        try {
          this.validateGenerateRequest(post);
        } catch (error: any) {
          throw new BadRequestException(`Invalid post at index ${index}: ${error.message}`);
        }
      });

      const userId = this.extractUserId(request);

      const requests = body.posts.map(p => ({
        ...p,
        userId,
      }));

      const result = await this.generationService.generateBatch(requests);
      return result;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error generating batch:', error);
      throw new InternalServerErrorException(
        'Failed to start batch generation. Please try again.',
      );
    }
  }

  @Get('status/:jobId')
  async getGenerationStatus(@Param('jobId') jobId: string): Promise<any> {
    try {
      let job: any = await this.queueService.getPostGenerationJob(jobId);
      let queueType = 'post-generation';

      if (!job) {
        job = await this.queueService.getBatchGenerationJob(jobId);
        queueType = 'batch-generation';
      }

      if (!job) {
        job = await this.queueService.getImageGenerationJob(jobId);
        queueType = 'image-generation';
      }

      if (!job) {
        throw new Error('Job not found');
      }

      const status = await job.getState();
      const progress = job.progress;
      const result = job.returnvalue;

      return {
        success: true,
        jobId,
        status,
        progress,
        result,
        queueType,
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        finishedAt: job.finishedOn,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          code: 'STATUS_CHECK_FAILED',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private validateGenerateRequest(dto: GeneratePostDto): void {
    if (!dto.topic || typeof dto.topic !== 'string' || dto.topic.trim().length === 0) {
      throw new BadRequestException('Topic is required and cannot be empty');
    }

    if (dto.topic.length > 500) {
      throw new BadRequestException('Topic cannot exceed 500 characters');
    }

    if (dto.provider && !ValidationUtils.isValidAIProvider(dto.provider)) {
      throw new BadRequestException('Invalid AI provider');
    }
  }

  private validateTemplateRequest(body: {
    templateId: string;
    data: Record<string, any>;
    settings?: any;
  }): void {
    if (!body.templateId || typeof body.templateId !== 'string') {
      throw new BadRequestException('Template ID is required');
    }

    if (!body.data || typeof body.data !== 'object') {
      throw new BadRequestException('Template data is required');
    }
  }

  private extractUserId(request: Request): string | undefined {
    return (request.headers['x-user-id'] as string) || 'anonymous';
  }

  private extractSessionId(request: Request): string {
    return (request.headers['x-session-id'] as string) || 'anonymous-session';
  }
}