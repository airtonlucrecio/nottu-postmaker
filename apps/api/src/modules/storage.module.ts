import { Module, Global } from '@nestjs/common';
import { JsonStorageService } from '../services/json-storage.service';

@Global()
@Module({
  providers: [JsonStorageService],
  exports: [JsonStorageService],
})
export class StorageModule {}