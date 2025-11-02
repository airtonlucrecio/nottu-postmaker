export class AssetsDto {
  image?: string;
  text?: string;
  metadata?: string;
}

export class HistoryEntryDto {
  id: string;
  topic: string;
  caption?: string;
  hashtags?: string;
  assets?: AssetsDto;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  includeImage?: boolean;
  imageProvider?: string;
}