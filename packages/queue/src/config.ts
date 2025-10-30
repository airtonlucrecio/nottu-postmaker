import { QueueConfig } from './types';

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = value !== undefined ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? (parsed as number) : fallback;
};

const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
let redisHost = process.env.REDIS_HOST || 'localhost';
let redisPort = toInt(process.env.REDIS_PORT, 6379);
let redisDb = toInt(process.env.REDIS_DB, 0);
let redisPassword = process.env.REDIS_PASSWORD;
let redisUsername = process.env.REDIS_USERNAME;
let redisTls: QueueConfig['redis']['tls'];

if (redisUrl) {
  try {
    const parsed = new URL(redisUrl);
    redisHost = parsed.hostname || redisHost;
    redisPort = parsed.port ? toInt(parsed.port, redisPort) : redisPort;
    redisPassword = parsed.password || redisPassword;
    redisUsername = parsed.username || redisUsername;
    redisDb = parsed.pathname && parsed.pathname !== '/' ? toInt(parsed.pathname.slice(1), redisDb) : redisDb;
    if (parsed.protocol === 'rediss:') {
      redisTls = { rejectUnauthorized: false };
    }
  } catch (error) {
    console.warn('[queue-config] Failed to parse REDIS_URL:', error);
  }
}

export const defaultQueueConfig: QueueConfig = {
  redis: {
    host: redisHost,
    port: redisPort,
    username: redisUsername,
    password: redisPassword,
    db: redisDb,
    url: redisUrl,
    tls: redisTls,
    maxRetriesPerRequest: toInt(process.env.REDIS_MAX_RETRIES, 3),
    retryDelayOnFailover: 100,
  },
  concurrency: {
    postGeneration: toInt(process.env.QUEUE_CONCURRENCY_POST, 2),
  },
  removeOnComplete: toInt(process.env.QUEUE_REMOVE_ON_COMPLETE, 100),
  removeOnFail: toInt(process.env.QUEUE_REMOVE_ON_FAIL, 50),
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: toInt(process.env.QUEUE_RETRY_DELAY, 2000),
    },
  },
};

export const queueNames = {
  POST_GENERATION: 'post-generation',
} as const;