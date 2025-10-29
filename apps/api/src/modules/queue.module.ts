import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService, PostGenerationProcessor } from '@nottu/queue';
import { GenerationService } from '../services/generation.service';
import { OpenAIService } from '../services/openai.service';
import { VisualAIService } from '../services/visual-ai.service';
import { DiskStorageService } from '../services/disk-storage.service';
import { JsonStorageService } from '../services/json-storage.service';
import { HistoryService } from '../services/history.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: QueueService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new QueueService({
          redis: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10),
            password: configService.get<string>('REDIS_PASSWORD'),
            db: parseInt(configService.get<string>('REDIS_DB', '0'), 10),
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
              delay: parseInt(configService.get<string>('QUEUE_RETRY_DELAY', '2000'), 10),
            },
          },
        });
      },
    },
    JsonStorageService,
    DiskStorageService,
    OpenAIService,
    VisualAIService,
    GenerationService,
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
