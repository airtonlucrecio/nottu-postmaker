import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { HistoryService } from './history.service';
import { GenerationService } from './generation.service';

export interface JobData {
  jobId: string;
  topic: string;
  includeImage?: boolean;
  imageProvider?: 'dalle';
  requestedAt: string;
}

export interface JobResult {
  caption: string;
  hashtags: string[];
  assets: string[];
  folder: string;
  folderFs: string;
  fsAssets: string[];
  metadata: any;
}

export interface Job {
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

  constructor(
    private readonly historyService: HistoryService,
    private readonly generationService: GenerationService,
  ) {
    this.logger.log('LocalQueueService initialized');
    this.logger.log('GenerationService injected successfully');
  }

  async addPostGenerationJob(
    data: Omit<JobData, 'jobId' | 'requestedAt'>
  ): Promise<string> {
    const jobId = uuid();

    const jobData: JobData = {
      jobId,
      topic: data.topic,
      includeImage: data.includeImage,
      imageProvider: data.imageProvider,
      requestedAt: new Date().toISOString(),
    };

    const job: Job = {
      id: jobId,
      status: 'pending',
      data: jobData,
      timestamps: {
        created: new Date(),
      },
    };

    this.jobs.set(jobId, job);
    this.logger.log(`Job ${jobId} added to local queue`);

    // Processa de forma assíncrona (fire-and-forget)
    this.processJob(jobId).catch((error) => {
      this.logger.error(`Failed to process job ${jobId}:`, error);
    });

    return jobId;
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

      this.logger.log(`Using real GenerationService for job ${jobId}`);

      // Usa o serviço real de geração
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
          this.logger.debug(
            `Job ${jobId} progress: ${progress.percentage}% - ${progress.message}`,
          );
        },
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
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      job.timestamps.completed = new Date();
      this.logger.error(`Job ${jobId} failed: ${job.error}`);
    }
  }
}
