import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService, PostGenerationProcessor, QueueConfig } from '@nottu/queue';
import { GenerationService } from '../services/generation.service';
import { OpenAIService } from '../services/openai.service';
import { VisualAIService } from '../services/visual-ai.service';
import { DiskStorageService } from '../services/disk-storage.service';
import { JsonStorageService } from '../services/json-storage.service';
import { HistoryService } from '../services/history.service';
import { VisualAIModule } from './visual-ai.module';

function buildQueueConfig(configService: ConfigService): QueueConfig {
  const redisUrl = configService.get<string>('REDIS_URL') || configService.get<string>('REDIS_TLS_URL');
  const retryDelayRaw = parseInt(configService.get<string>('QUEUE_RETRY_DELAY', '2000'), 10);
  const retryBaseDelay = Number.isFinite(retryDelayRaw) ? retryDelayRaw : 2000;

  if (redisUrl) {
    const parsed = new URL(redisUrl);
    const dbSegment = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : undefined;

    return {
      redis: {
        url: redisUrl,
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        username: parsed.username || configService.get<string>('REDIS_USERNAME') || undefined,
        password: parsed.password || configService.get<string>('REDIS_PASSWORD') || undefined,
        db: dbSegment ? parseInt(dbSegment, 10) : undefined,
        tls: parsed.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: parseInt(configService.get<string>('REDIS_MAX_RETRIES', '3'), 10),
      },
      concurrency: {
        postGeneration: parseInt(configService.get<string>('QUEUE_CONCURRENCY_POST', '2'), 10),
      },
      removeOnComplete: parseInt(configService.get<string>('QUEUE_REMOVE_ON_COMPLETE', '50'), 10),
      removeOnFail: parseInt(configService.get<string>('QUEUE_REMOVE_ON_FAIL', '10'), 10),
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: parseInt(configService.get<string>('QUEUE_RETRY_ATTEMPTS', '3'), 10),
        backoff: {
          type: 'exponential',
          delay: retryBaseDelay,
        },
      },
    };
  }

  return {
    redis: {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10),
      username: configService.get<string>('REDIS_USERNAME') || undefined,
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
      db: parseInt(configService.get<string>('REDIS_DB', '0'), 10),
      maxRetriesPerRequest: parseInt(configService.get<string>('REDIS_MAX_RETRIES', '3'), 10),
    },
    concurrency: {
      postGeneration: parseInt(configService.get<string>('QUEUE_CONCURRENCY_POST', '2'), 10),
    },
    removeOnComplete: parseInt(configService.get<string>('QUEUE_REMOVE_ON_COMPLETE', '50'), 10),
    removeOnFail: parseInt(configService.get<string>('QUEUE_REMOVE_ON_FAIL', '10'), 10),
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: parseInt(configService.get<string>('QUEUE_RETRY_ATTEMPTS', '3'), 10),
      backoff: {
        type: 'exponential',
        delay: retryBaseDelay,
      },
    },
  };
}

@Module({
  imports: [ConfigModule, VisualAIModule],
  providers: [
    {
      provide: QueueService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const queueConfig = buildQueueConfig(configService);
        return new QueueService(queueConfig);
      },
    },
    {
      provide: DiskStorageService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new DiskStorageService(configService);
      },
    },
    {
      provide: OpenAIService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new OpenAIService(configService);
      },
    },

    {
      provide: GenerationService,
      inject: [ConfigService, OpenAIService, VisualAIService, DiskStorageService, HistoryService],
      useFactory: (
        configService: ConfigService,
        openaiService: OpenAIService,
        visualAiService: VisualAIService,
        diskStorageService: DiskStorageService,
        historyService: HistoryService,
      ) => {
        return new GenerationService(
          configService,
          openaiService,
          visualAiService,
          diskStorageService,
          historyService,
        );
      },
    },
    HistoryService,
    {
      provide: PostGenerationProcessor,
      useFactory: (generationService: GenerationService) =>
        new PostGenerationProcessor(({ job, update }) => generationService.processJob(job, update)),
      inject: [GenerationService],
    },
    {
      provide: 'QUEUE_WORKER',
      useFactory: (queueService: QueueService, processor: PostGenerationProcessor) => {
        queueService.registerPostGenerationWorker((context) => processor.handle(context));
        return true;
      },
      inject: [QueueService, PostGenerationProcessor],
    },
  ],
  exports: [QueueService, GenerationService, HistoryService],
})
export class QueueModule {}

