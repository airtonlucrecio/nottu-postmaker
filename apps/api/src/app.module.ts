import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

// Controllers
import { GenerateController } from './controllers/generate.controller';
import { SettingsController } from './controllers/settings.controller';
import { HealthController } from './controllers/health.controller';
import { ImagesController } from './controllers/images.controller';

// Guards
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

// Services
import { SettingsService } from './services/settings.service';
import { LocalQueueService } from './services/local-queue.service';
import { JsonStorageService } from './services/json-storage.service';
import { VisualAIService } from './services/visual-ai.service';

// Modules
import { HistoryModule } from './modules/history.module';
import { StorageModule } from './modules/storage.module';
import { VisualAIModule } from './modules/visual-ai.module';
import { ImagesModule } from './modules/images.module';

// Configuration
// Removed custom configuration imports (files não existem no projeto)

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
            limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
          },
        ],
      }),
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Storage module
    StorageModule,

    // History module
    HistoryModule,

    // Visual AI module
    VisualAIModule,

    // Images module
    ImagesModule,

  ],
  controllers: [GenerateController, SettingsController, HealthController],
  providers: [
    // Services
    JsonStorageService,
    SettingsService,
    LocalQueueService,
    // VisualAIService is provided by VisualAIModule

    // Global guards
    {
      provide: APP_GUARD,
      useFactory: (configService: ConfigService) => new ApiKeyGuard(configService),
      inject: [ConfigService],
    },
    {
      provide: APP_GUARD,
      useFactory: (configService: ConfigService) => new RateLimitGuard(configService),
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}