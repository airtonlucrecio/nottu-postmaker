import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

// Controllers
import { GenerateController } from './controllers/generate.controller';
import { HistoryController } from './controllers/history.controller';
import { SettingsController } from './controllers/settings.controller';

// Guards
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

// Services
import { HistoryService } from './services/history.service';
import { SettingsService } from './services/settings.service';
import { LocalQueueService } from './services/local-queue.service';

// Configuration
// Removed custom configuration imports (files não existem no projeto)

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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

  ],
  controllers: [GenerateController, HistoryController, SettingsController],
  providers: [
    // Services
    HistoryService,
    SettingsService,
    LocalQueueService,
    
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