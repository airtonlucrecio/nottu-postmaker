import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import { defaultQueueConfig, queueNames } from './config';
import {
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
  private readonly connectionOptions: RedisOptions;
  private worker?: Worker<PostGenerationJobData, PostGenerationResult>;

  constructor(private readonly config: QueueConfig = defaultQueueConfig) {
    this.connectionOptions = this.buildConnectionOptions(this.config.redis);

    this.queue = new Queue<PostGenerationJobData, PostGenerationResult>(queueNames.POST_GENERATION, {
      connection: this.cloneConnectionOptions(),
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

  async getPostGenerationJob(jobId: string): Promise<Job<PostGenerationJobData, PostGenerationResult> | null> {
    const job = await this.queue.getJob(jobId);
    return job ?? null;
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse | null> {
    const job = await this.getPostGenerationJob(jobId);
    if (!job) {
      return null;
    }

    const state = (await job.getState()) as JobStatus;
    const progress = (job.progress ?? null) as JobProgress | number | null;
    const returnValue = (job.returnvalue ?? undefined) as PostGenerationResult | undefined;

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
        try {
          const result = await handler({
            job: job.data,
            update: async (progress) => {
              await job.updateProgress(progress);
            },
          });
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Handler failed for job ${job.id}: ${message}`);
          throw error;
        }
      },
      {
        connection: this.cloneConnectionOptions(),
        concurrency: this.config.concurrency?.postGeneration ?? 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed.`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
      if (job) {
        job.log(err.message).catch((logError) => {
          this.logger.warn(`Failed to log job error for ${job.id}: ${logError instanceof Error ? logError.message : logError}`);
        });
      }
    });

    this.worker.on('error', (err) => {
      this.logger.error(`Queue worker error: ${err.message}`);
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

  private buildConnectionOptions(redisConfig: QueueConfig['redis']): RedisOptions {
    const options: RedisOptions = {
      host: redisConfig.host,
      port: redisConfig.port,
      username: redisConfig.username,
      password: redisConfig.password,
      db: redisConfig.db,
      tls: redisConfig.tls,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      retryStrategy: redisConfig.retryStrategy,
    };

    if ((!options.host || !options.port) && redisConfig.url) {
      try {
        const parsed = new URL(redisConfig.url);
        options.host = options.host ?? parsed.hostname;
        options.port = options.port ?? (parsed.port ? parseInt(parsed.port, 10) : undefined);
        options.password = options.password ?? parsed.password;
        options.username = options.username ?? parsed.username;
        options.db = options.db ?? (parsed.pathname && parsed.pathname !== '/' ? parseInt(parsed.pathname.slice(1), 10) : undefined);
        if (parsed.protocol === 'rediss:' && !options.tls) {
          options.tls = { rejectUnauthorized: false };
        }
      } catch (error) {
        this.logger.warn(`Failed to parse redis url: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return options;
  }

  private cloneConnectionOptions(): RedisOptions {
    const { tls, ...rest } = this.connectionOptions;
    return {
      ...rest,
      tls: tls ? { ...tls } : undefined,
    };
  }
}

export type { JobStatusResponse };
