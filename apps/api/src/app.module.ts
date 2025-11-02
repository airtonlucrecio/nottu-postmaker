import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

// Controllers
import { HealthController } from './controllers/health.controller';
import { TestSimpleController } from './controllers/test-simple.controller';

// Guards
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

// Modules
import { HistoryModule } from './modules/history.module';
import { StorageModule } from './modules/storage.module';
import { SimpleQueueModule } from './modules/simple-queue.module';
import { SettingsModule } from './modules/settings.module';
import { ImagesModule } from './modules/images.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    ScheduleModule.forRoot(),

    StorageModule,
    HistoryModule,
    SettingsModule,
    ImagesModule,
    SimpleQueueModule,
  ],
  controllers: [HealthController, TestSimpleController],
  providers: [
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