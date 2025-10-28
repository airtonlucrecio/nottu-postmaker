import { Queue, Worker, Job } from 'bullmq';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { 
  PostGenerationJobData, 
  PostGenerationResult,
  BatchGenerationJobData,
  BatchGenerationResult,
  ImageGenerationJobData,
  ImageGenerationResult,
  QueueConfig,
  JobStatus,
  JobProgress,
  QueueStats,
  JobInfo
} from './types';
import { defaultQueueConfig, queueNames, QueueName } from './config';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<QueueName, Queue>();
  private readonly workers = new Map<QueueName, Worker>();
  private readonly config: QueueConfig;

  constructor(config?: Partial<QueueConfig>) {
    this.config = { ...defaultQueueConfig, ...config };
    this.initializeQueues();
  }

  private initializeQueues(): void {
    // Initialize Post Generation Queue
    this.queues.set(queueNames.POST_GENERATION, new Queue(queueNames.POST_GENERATION, {
      connection: this.config.redis,
      defaultJobOptions: this.config.defaultJobOptions,
    }));

    // Initialize Image Generation Queue
    this.queues.set(queueNames.IMAGE_GENERATION, new Queue(queueNames.IMAGE_GENERATION, {
      connection: this.config.redis,
      defaultJobOptions: this.config.defaultJobOptions,
    }));

    // Initialize Batch Generation Queue
    this.queues.set(queueNames.BATCH_GENERATION, new Queue(queueNames.BATCH_GENERATION, {
      connection: this.config.redis,
      defaultJobOptions: this.config.defaultJobOptions,
    }));

    this.logger.log('Queues initialized successfully');
  }

  // Post Generation Methods
  async addPostGenerationJob(
    data: PostGenerationJobData,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
    }
  ): Promise<Job<PostGenerationJobData, PostGenerationResult>> {
    const queue = this.queues.get(queueNames.POST_GENERATION);
    if (!queue) {
      throw new Error('Post generation queue not initialized');
    }

    const job = await queue.add('generate-post', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.attempts || this.config.defaultJobOptions.attempts,
      removeOnComplete: this.config.removeOnComplete,
      removeOnFail: this.config.removeOnFail,
    });

    this.logger.log(`Post generation job added: ${job.id}`);
    return job;
  }

  async getPostGenerationJob(jobId: string): Promise<Job<PostGenerationJobData, PostGenerationResult> | undefined> {
    const queue = this.queues.get(queueNames.POST_GENERATION);
    return queue?.getJob(jobId);
  }

  // Image Generation Methods
  async addImageGenerationJob(
    data: ImageGenerationJobData,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
    }
  ): Promise<Job<ImageGenerationJobData, ImageGenerationResult>> {
    const queue = this.queues.get(queueNames.IMAGE_GENERATION);
    if (!queue) {
      throw new Error('Image generation queue not initialized');
    }

    const job = await queue.add('generate-image', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.attempts || this.config.defaultJobOptions.attempts,
      removeOnComplete: this.config.removeOnComplete,
      removeOnFail: this.config.removeOnFail,
    });

    this.logger.log(`Image generation job added: ${job.id}`);
    return job;
  }

  async getImageGenerationJob(jobId: string): Promise<Job<ImageGenerationJobData, ImageGenerationResult> | undefined> {
    const queue = this.queues.get(queueNames.IMAGE_GENERATION);
    return queue?.getJob(jobId);
  }

  // Batch Generation Methods
  async addBatchGenerationJob(
    data: BatchGenerationJobData,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
    }
  ): Promise<Job<BatchGenerationJobData, BatchGenerationResult>> {
    const queue = this.queues.get(queueNames.BATCH_GENERATION);
    if (!queue) {
      throw new Error('Batch generation queue not initialized');
    }

    const job = await queue.add('generate-batch', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.attempts || this.config.defaultJobOptions.attempts,
      removeOnComplete: this.config.removeOnComplete,
      removeOnFail: this.config.removeOnFail,
    });

    this.logger.log(`Batch generation job added: ${job.id}`);
    return job;
  }

  async getBatchGenerationJob(jobId: string): Promise<Job<BatchGenerationJobData, BatchGenerationResult> | undefined> {
    const queue = this.queues.get(queueNames.BATCH_GENERATION);
    return queue?.getJob(jobId);
  }

  // Generic Job Management Methods
  async getJob(queueName: QueueName, jobId: string): Promise<Job | undefined> {
    const queue = this.queues.get(queueName);
    return queue?.getJob(jobId);
  }

  async getJobStatus(queueName: QueueName, jobId: string): Promise<JobStatus | undefined> {
    const job = await this.getJob(queueName, jobId);
    if (!job) return undefined;

    const state = await job.getState();
    return state as JobStatus;
  }

  async getJobProgress(queueName: QueueName, jobId: string): Promise<JobProgress | undefined> {
    const job = await this.getJob(queueName, jobId);
    if (!job) return undefined;

    return job.progress as JobProgress;
  }

  async updateJobProgress(queueName: QueueName, jobId: string, progress: JobProgress): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.updateProgress(progress);
    }
  }

  async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job removed: ${jobId} from queue: ${queueName}`);
    }
  }

  async retryJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Job retried: ${jobId} from queue: ${queueName}`);
    }
  }

  // Queue Statistics
  async getQueueStats(queueName: QueueName): Promise<QueueStats> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const counts = await queue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0,
    };
  }

  async getAllQueueStats(): Promise<Record<QueueName, QueueStats>> {
    const stats: Record<string, QueueStats> = {};
    
    for (const queueName of Object.values(queueNames)) {
      stats[queueName] = await this.getQueueStats(queueName);
    }
    
    return stats as Record<QueueName, QueueStats>;
  }

  // Queue Management
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
      this.logger.log(`Queue paused: ${queueName}`);
    }
  }

  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
      this.logger.log(`Queue resumed: ${queueName}`);
    }
  }

  async cleanQueue(
    queueName: QueueName,
    grace: number = 0,
    status?: 'completed' | 'failed'
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      if (status) {
        await queue.clean(grace, 100, status);
      } else {
        await queue.clean(grace, 100, 'completed');
        await queue.clean(grace, 100, 'failed');
      }
      this.logger.log(`Queue cleaned: ${queueName}`);
    }
  }

  // Worker Management
  registerWorker(
    queueName: QueueName,
    processor: (job: Job) => Promise<any>,
    concurrency?: number
  ): void {
    const worker = new Worker(queueName, processor, {
      connection: this.config.redis,
      concurrency: concurrency || this.getConcurrencyForQueue(queueName),
    });

    worker.on('completed', (job) => {
      this.logger.log(`Job completed: ${job.id} in queue: ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job failed: ${job?.id} in queue: ${queueName}`, err.stack);
    });

    worker.on('error', (err) => {
      this.logger.error(`Worker error in queue: ${queueName}`, err.stack);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker registered for queue: ${queueName}`);
  }

  private getConcurrencyForQueue(queueName: QueueName): number {
    switch (queueName) {
      case queueNames.POST_GENERATION:
        return this.config.concurrency.postGeneration;
      case queueNames.IMAGE_GENERATION:
        return this.config.concurrency.imageGeneration;
      case queueNames.BATCH_GENERATION:
        return this.config.concurrency.batchGeneration;
      default:
        return 1;
    }
  }

  // Health Check
  async isHealthy(): Promise<boolean> {
    try {
      for (const queue of this.queues.values()) {
        // Check if queue is accessible
        await queue.getWaiting();
      }
      return true;
    } catch (error) {
      this.logger.error('Queue health check failed', error);
      return false;
    }
  }

  // Cleanup
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down queue service...');
    
    // Close all workers
    for (const [queueName, worker] of this.workers) {
      await worker.close();
      this.logger.log(`Worker closed: ${queueName}`);
    }

    // Close all queues
    for (const [queueName, queue] of this.queues) {
      await queue.close();
      this.logger.log(`Queue closed: ${queueName}`);
    }

    this.logger.log('Queue service shutdown complete');
  }
}