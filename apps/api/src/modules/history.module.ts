import { Module } from '@nestjs/common';
import { HistoryService } from '../services/history.service';
import { JsonStorageService } from '../services/json-storage.service';
import { HistoryController } from '../controllers/history.controller';

@Module({
  providers: [HistoryService],
  controllers: [HistoryController],
  exports: [HistoryService],
})
export class HistoryModule {}