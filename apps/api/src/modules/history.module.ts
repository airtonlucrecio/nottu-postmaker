import { Module } from '@nestjs/common';
import { HistoryService } from '../services/history.service';
import { HistoryController } from '../controllers/history.controller';
import { StorageModule } from './storage.module';

@Module({
  imports: [StorageModule],
  providers: [HistoryService],
  controllers: [HistoryController],
  exports: [HistoryService],
})
export class HistoryModule {}