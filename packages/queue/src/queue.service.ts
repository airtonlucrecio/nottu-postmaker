import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { defaultQueueConfig, queueNames } from './config';
import type {
  JobProgress,
  JobStatus,
  PostGenerationHandler,
  PostGenerationJobData,
  PostGenerationResult,
  QueueConfig,
  QueueStats,
} from './types';

interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: JobProgress | number | null;
  result?: PostGenerationResult;
  error?: string;
  timestamps: {
    createdAt?: number;
    processedAt?: number | null;
    finishedAt?: number | null;
  };
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queue: Queue<PostGenerationJobData, PostGenerationResult>;
  private worker?: Worker<PostGenerationJobData, PostGenerationResult>;

  constructor(private readonly config: QueueConfig = defaultQueueConfig) {
    this.queue = new Queue<PostGenerationJobData, PostGenerationResult>(queueNames.POST_GENERATION, {
      connection: {
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
      },
      defaultJobOptions: {
        removeOnComplete: this.config.defaultJobOptions?.removeOnComplete ?? 25,
        removeOnFail: this.config.defaultJobOptions?.removeOnFail ?? 5,
        attempts: this.config.defaultJobOptions?.attempts ?? 3,
        backoff: this.config.defaultJobOptions?.backoff ?? { type: 'exponential', delay: 2000 },
      },
    });
  }

  async addPostGenerationJob(data: PostGenerationJobData): Promise<Job<PostGenerationJobData, PostGenerationResult>> {
    this.logger.debug(`Enqueuing generation job ${data.jobId}`);
    return this.queue.add('generate-post', data, {
      jobId: data.jobId,
      removeOnComplete: this.config.removeOnComplete ?? 25,
      removeOnFail: this.config.removeOnFail ?? 5,
      attempts: this.config.defaultJobOptions?.attempts ?? 3,
      backoff: this.config.defaultJobOptions?.backoff ?? { type: 'exponential', delay: 2000 },
    });
  }

  async getPostGenerationJob(jobId: string): Promise<Job<PostGenerationJobData, PostGenerationResult> | undefined> {
    return this.queue.getJob(jobId);
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse | null> {
    const job = await this.getPostGenerationJob(jobId);
    if (!job) {
      return null;
    }

    const state = (await job.getState()) as JobStatus;
    const progress = job.progress as JobProgress | number | null;
    const returnValue = job.returnvalue as PostGenerationResult | undefined;

    return {
      id: job.id as string,
      status: state,
      progress: progress,
      result: returnValue,
      error: job.failedReason ?? undefined,
      timestamps: {
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        finishedAt: job.finishedOn,
      },
    };
  }

  registerPostGenerationWorker(handler: PostGenerationHandler): void {
    if (this.worker) {
      this.logger.warn('Post generation worker already registered.');
      return;
    }

    this.worker = new Worker<PostGenerationJobData, PostGenerationResult>(
      queueNames.POST_GENERATION,
      async (job) => {
        this.logger.log(`Processing job ${job.id}`);
        const result = await handler({
          job: job.data,
          update: async (progress) => {
            await job.updateProgress(progress);
          },
        });
        return result;
      },
      {
        connection: {
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password,
          db: this.config.redis.db,
        },
        concurrency: this.config.concurrency?.postGeneration ?? 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed.`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  async getQueueStats(): Promise<QueueStats> {
    const counts = await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: counts.paused ?? 0,
    };
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down queue service');
    await this.worker?.close();
    await this.queue.close();
  }
}

export type { JobStatusResponse };
