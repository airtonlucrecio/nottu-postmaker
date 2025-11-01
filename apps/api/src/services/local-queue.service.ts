import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { HistoryService } from './history.service';

interface JobData {
  jobId: string;
  topic: string;
  includeImage?: boolean;
  imageProvider?: 'dalle';
  requestedAt: string;
}

interface JobResult {
  caption: string;
  hashtags: string[];
  assets: string[];
  folder: string;
  folderFs: string;
  fsAssets: string[];
  metadata: any;
}

interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: { percentage: number; step?: string; message?: string };
  result?: JobResult;
  error?: string;
  timestamps: {
    created: Date;
    started?: Date;
    completed?: Date;
  };
  data: JobData;
}

@Injectable()
export class LocalQueueService {
  private readonly logger = new Logger(LocalQueueService.name);
  private jobs = new Map<string, Job>();

  private generationService: any;

  constructor(private readonly historyService: HistoryService) {
    this.logger.log('LocalQueueService initialized');
    this.generationService = null; // Temporarily use mock only
  }

  setGenerationService(generationService: any) {
    this.generationService = generationService;
    this.logger.log('GenerationService injected successfully');
  }

  async addPostGenerationJob(data: JobData): Promise<{ id: string }> {
    const jobId = data.jobId || uuid();
    
    const job: Job = {
      id: jobId,
      status: 'pending',
      data,
      timestamps: {
        created: new Date(),
      },
    };

    this.jobs.set(jobId, job);
    this.logger.log(`Job ${jobId} added to local queue`);

    // Process job immediately (asynchronous processing)
    this.processJob(jobId).catch(error => {
      this.logger.error(`Failed to process job ${jobId}:`, error);
    });

    return { id: jobId };
  }

  async getJobStatus(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) || null;
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.timestamps.started = new Date();
      job.progress = { percentage: 5, step: 'initializing', message: 'Iniciando processamento' };

      if (this.generationService) {
        this.logger.log(`Using real GenerationService for job ${jobId}`);
        // Use real generation service
        const result = await this.generationService.processJob(
          {
            jobId: job.data.jobId,
            topic: job.data.topic,
            includeImage: job.data.includeImage,
            imageProvider: job.data.imageProvider,
            requestedAt: job.data.requestedAt,
          },
          async (progress) => {
            job.progress = progress;
            this.logger.debug(`Job ${jobId} progress: ${progress.percentage}% - ${progress.message}`);
          }
        );

        job.result = {
          caption: result.caption,
          hashtags: result.hashtags,
          assets: result.assets ? Object.values(result.assets) : [],
          folder: result.folder,
          folderFs: result.folderFs,
          fsAssets: result.fsAssets ? Object.values(result.fsAssets) : [],
          metadata: result.metadata,
        };

        job.status = 'completed';
        job.progress = { percentage: 100, step: 'completed', message: 'Concluído' };
        job.timestamps.completed = new Date();

        this.logger.log(`Job ${jobId} completed successfully`);
      } else {
        this.logger.warn(`GenerationService not available, using mock processing for job ${jobId}`);
        // Fallback to mock processing if generation service is not available
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
          assets: [],
          folder: `posts/${jobId}`,
          folderFs: `storage/posts/${jobId}`,
          fsAssets: [],
          metadata: {
            topic: job.data.topic,
            generatedAt: new Date().toISOString(),
          },
        };

        job.status = 'completed';
        job.progress = { percentage: 100, step: 'completed', message: 'Concluído' };
        job.timestamps.completed = new Date();

        // Save to history
        await this.historyService.append({
          id: jobId,
          topic: job.data.topic,
          caption: job.result.caption,
          hashtags: job.result.hashtags,
          folder: job.result.folder,
          folderFs: job.result.folderFs,
          assets: {
            finalPath: `${job.result.folder}/final.jpg`,
            captionPath: `${job.result.folder}/caption.txt`,
            hashtagsPath: `${job.result.folder}/hashtags.txt`,
            metadataPath: `${job.result.folder}/metadata.json`,
          },
          fsAssets: {
            finalPath: `${job.result.folderFs}/final.jpg`,
            captionPath: `${job.result.folderFs}/caption.txt`,
            hashtagsPath: `${job.result.folderFs}/hashtags.txt`,
            metadataPath: `${job.result.folderFs}/metadata.json`,
          },
          provider: {
            text: 'openai',
            requestedImage: job.data.imageProvider || 'dalle',
            effectiveImage: job.data.imageProvider || 'dalle',
          },
          createdAt: new Date().toISOString(),
        });

        this.logger.log(`Job ${jobId} completed successfully (mock mode)`);
      }
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      job.timestamps.completed = new Date();
      this.logger.error(`Job ${jobId} failed: ${job.error}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}