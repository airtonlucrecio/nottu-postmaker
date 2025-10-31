import { Module } from '@nestjs/common';
import { LocalQueueService } from '../services/local-queue.service';

@Module({
  providers: [LocalQueueService],
  exports: [LocalQueueService],
})
export class LocalQueueModule {}