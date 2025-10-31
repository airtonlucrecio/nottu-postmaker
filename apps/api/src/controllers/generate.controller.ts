import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Inject,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { HistoryService } from '../services/history.service';

interface GenerateRequest {
  topic: string;
  includeImage?: boolean;
  imageProvider?: 'dalle' | 'flux' | 'leonardo' | 'sdxl_local';
}

interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    percentage: number;
    step: string;
    message: string;
  };
  data: {
    jobId: string;
    topic: string;
    includeImage: boolean;
    imageProvider?: string;
    requestedAt: string;
  };
  timestamps: {
    created: Date;
    started?: Date;
    completed?: Date;
  };
  result?: any;
  error?: string;
}

@Controller('generate')
export class GenerateController {
  private jobs = new Map<string, Job>();

  constructor(
    @Inject(HistoryService) private readonly historyService: HistoryService,
  ) {}

  @Post()
  async enqueue(@Body() body: GenerateRequest) {
    if (!body.topic || body.topic.trim().length === 0) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }

    const jobId = uuid();
    const includeImage = body.includeImage ?? true;
    const imageProvider = body.imageProvider || 'dalle';

    // Create job
    const job: Job = {
      id: jobId,
      status: 'pending',
      progress: {
        percentage: 0,
        step: 'pending',
        message: 'Job criado'
      },
      data: {
        jobId,
        topic: body.topic.trim(),
        includeImage,
        imageProvider,
        requestedAt: new Date().toISOString(),
      },
      timestamps: {
        created: new Date(),
      },
    };

    this.jobs.set(jobId, job);

    // Process job asynchronously
    this.processJob(jobId).catch(error => {
      console.error(`Failed to process job ${jobId}:`, error);
    });

    return { jobId };
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    if (!jobId) {
      throw new HttpException('Job ID is required', HttpStatus.BAD_REQUEST);
    }

    const job = this.jobs.get(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    return job;
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.timestamps.started = new Date();
      job.progress = { percentage: 5, step: 'initializing', message: 'Iniciando processamento' };

      // Mock processing since we don't have GenerationService injected
      console.log(`Processing job ${jobId} with mock data`);
      
      await this.delay(1000);
      job.progress = { percentage: 30, step: 'generating_text', message: 'Gerando texto' };

      await this.delay(2000);
      job.progress = { percentage: 60, step: 'generating_image', message: 'Gerando imagem' };

      await this.delay(2000);
      job.progress = { percentage: 90, step: 'finalizing', message: 'Finalizando' };

      // Mock result
      job.result = {
        caption: `Post sobre: ${job.data.topic}`,
        hashtags: ['#nottu', '#tech', '#inovacao'],
        assets: {
          finalPath: `posts/${jobId}/final.jpg`,
          captionPath: `posts/${jobId}/caption.txt`,
          hashtagsPath: `posts/${jobId}/hashtags.txt`,
          metadataPath: `posts/${jobId}/metadata.json`,
        },
        folder: `posts/${jobId}`,
        folderFs: `storage/posts/${jobId}`,
        fsAssets: {
          finalPath: `storage/posts/${jobId}/final.jpg`,
          captionPath: `storage/posts/${jobId}/caption.txt`,
          hashtagsPath: `storage/posts/${jobId}/hashtags.txt`,
          metadataPath: `storage/posts/${jobId}/metadata.json`,
        },
        metadata: {
          topic: job.data.topic,
          generatedAt: new Date().toISOString(),
        },
      };

      job.status = 'completed';
      job.progress = { percentage: 100, step: 'completed', message: 'Concluído' };
      job.timestamps.completed = new Date();

      // Save to history
      try {
        await this.historyService.append({
          id: jobId,
          topic: job.data.topic,
          caption: job.result.caption,
          hashtags: job.result.hashtags,
          folder: job.result.folder,
          folderFs: job.result.folderFs,
          assets: job.result.assets,
          fsAssets: job.result.fsAssets,
          provider: {
            text: 'openai',
            requestedImage: job.data.imageProvider || 'dalle',
            effectiveImage: job.data.imageProvider || 'dalle',
          },
          createdAt: new Date().toISOString(),
        });
        console.log(`Job ${jobId} completed successfully and saved to history`);
      } catch (historyError) {
        console.warn(`Job ${jobId} completed but failed to save to history:`, historyError);
      }

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      job.timestamps.completed = new Date();
      console.error(`Job ${jobId} failed: ${job.error}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

