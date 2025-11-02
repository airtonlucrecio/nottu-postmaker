import { Module } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { SettingsController } from '../controllers/settings.controller';
import { StorageModule } from './storage.module';

@Module({
  imports: [StorageModule],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}