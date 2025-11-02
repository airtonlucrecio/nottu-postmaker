import { AssetsDto } from './history-entry.dto';

export class JobStatusResponseDto {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  topic: string;
  caption?: string;
  hashtags?: string;
  assets?: AssetsDto;
  createdAt: Date;
  error?: string;
}