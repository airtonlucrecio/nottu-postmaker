import { QueueConfig } from './types';

export const defaultQueueConfig: QueueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
  },
  concurrency: {
    postGeneration: parseInt(process.env.QUEUE_CONCURRENCY_POST || '2'),
    imageGeneration: parseInt(process.env.QUEUE_CONCURRENCY_IMAGE || '1'),
    batchGeneration: parseInt(process.env.QUEUE_CONCURRENCY_BATCH || '1'),
  },
  removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || '100'),
  removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL || '50'),
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

export const queueNames = {
  POST_GENERATION: 'post-generation',
  IMAGE_GENERATION: 'image-generation',
  BATCH_GENERATION: 'batch-generation',
} as const;

export type QueueName = typeof queueNames[keyof typeof queueNames];