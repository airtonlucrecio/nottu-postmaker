import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenerationService } from '../services/generation.service';
import { OpenAIService } from '../services/openai.service';
import { VisualAIService } from '../services/visual-ai.service';
import { DiskStorageService } from '../services/disk-storage.service';
import { HistoryService } from '../services/history.service';
import { GenerateController } from '../controllers/generate.controller';
import { VisualAIModule } from './visual-ai.module';
import { StorageModule } from './storage.module';
import { HistoryModule } from './history.module';

@Module({
  imports: [ConfigModule, VisualAIModule, StorageModule, forwardRef(() => HistoryModule)],
  controllers: [GenerateController],
  providers: [
    {
      provide: OpenAIService,
      useFactory: (configService: ConfigService) => {
        return new OpenAIService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: DiskStorageService,
      useFactory: (configService: ConfigService) => {
        return new DiskStorageService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: GenerationService,
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
      inject: [ConfigService, OpenAIService, VisualAIService, DiskStorageService, HistoryService],
    },
  ],
  exports: [GenerationService],
})
export class SimpleQueueModule {}