import { PostStatus, GenerationStepStatus } from '../enums/post-status.enum';
import { AIProvider } from '../enums/ai-provider.enum';
import { LogoPosition, ImageFormat } from '../enums/render-format.enum';

export interface Post {
  id: string;
  topic: string;
  status: PostStatus;
  provider: AIProvider;
  template: string;
  createdAt: Date;
  updatedAt: Date;
  processingTime?: number;
  userId?: string;
}

export interface PostContent {
  title?: string;
  caption: string;
  hashtags: string[];
  visualPrompt: string;
  metadata?: Record<string, any>;
}

export interface PostAssets {
  imageUrl: string;
  imagePath: string;
  captionPath?: string;
  hashtagsPath?: string;
  metadataPath?: string;
  folderPath: string;
}

export interface PostGeneration {
  id: string;
  post: Post;
  content?: PostContent;
  assets?: PostAssets;
  steps: GenerationStep[];
  error?: string;
}

export interface GenerationStep {
  id: string;
  name: string;
  status: GenerationStepStatus;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  message?: string;
  data?: Record<string, any>;
}

export interface PostSettings {
  outputPath?: string;
  brandColors?: Record<string, string>;
  customTemplate?: string;
  logoPosition?: LogoPosition;
  textOverlay?: boolean;
  imageQuality?: number;
  format?: ImageFormat;
}

export interface PostFilter {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  provider?: AIProvider;
  status?: PostStatus;
  template?: string;
}

export interface PostPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PostHistory {
  posts: Post[];
  pagination: PostPagination;
}

export interface PostExportOptions {
  format: ImageFormat;
  quality: number;
  includeCaption: boolean;
  includeHashtags: boolean;
  includeMetadata: boolean;
}