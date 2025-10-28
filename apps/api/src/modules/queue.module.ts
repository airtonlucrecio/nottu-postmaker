import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService, PostGenerationProcessor, queueNames } from '@nottu/queue';
import { GenerationService } from '../services/generation.service';
import { OpenAIService } from '../services/openai.service';
import { VisualAIService } from '../services/visual-ai.service';
import { HistoryService } from '../services/history.service';
import { SettingsService } from '../services/settings.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: QueueService,
      useFactory: (configService: ConfigService) => {
        const queueConfig = {
          redis: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
            db: configService.get('REDIS_DB', 0),
          },
          concurrency: {
            postGeneration: configService.get('QUEUE_CONCURRENCY_POST', 2),
            imageGeneration: configService.get('QUEUE_CONCURRENCY_IMAGE', 1),
            batchGeneration: configService.get('QUEUE_CONCURRENCY_BATCH', 1),
          },
        };
        return new QueueService(queueConfig);
      },
      inject: [ConfigService],
    },
    PostGenerationProcessor,
    GenerationService,
    OpenAIService,
    VisualAIService,
    HistoryService,
    SettingsService,
    {
      provide: 'QUEUE_WORKERS',
      useFactory: (
        queueService: QueueService,
        processor: PostGenerationProcessor,
        generationService: GenerationService,
      ) => {
        // Register Post Generation Worker
        queueService.registerWorker(
          queueNames.POST_GENERATION,
          async (job) => {
            return await processor.processPostGeneration(job);
          }
        );

        // Register Image Generation Worker
        queueService.registerWorker(
          queueNames.IMAGE_GENERATION,
          async (job) => {
            return await processor.processImageGeneration(job);
          }
        );

        // Register Batch Generation Worker
        queueService.registerWorker(
          queueNames.BATCH_GENERATION,
          async (job) => {
            return await processor.processBatchGeneration(job);
          }
        );

        return 'Workers registered successfully';
      },
      inject: [QueueService, PostGenerationProcessor, GenerationService],
    },
  ],
  exports: [
    QueueService,
    PostGenerationProcessor,
    GenerationService,
    OpenAIService,
    VisualAIService,
    HistoryService,
    SettingsService,
  ],
})
export class QueueModule {}