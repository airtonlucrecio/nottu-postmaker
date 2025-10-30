import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Existing module and app wiring
import { QueueModule } from './modules/queue.module';
import { GenerateController } from './controllers/generate.controller';
import { HistoryController } from './controllers/history.controller';
import { SettingsController } from './controllers/settings.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { SettingsService } from './services/settings.service';
import { JsonStorageService } from './services/json-storage.service';
import { APP_GUARD } from '@nestjs/core';

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

    // Application modules
    QueueModule,
  ],
  controllers: [GenerateController, HistoryController, SettingsController],
  providers: [
    // Exported/available services for controllers
    JsonStorageService,
    SettingsService,
    // Global guards
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}