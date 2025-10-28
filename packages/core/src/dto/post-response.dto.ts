import type { GenerationStep } from '../types/post.types';
import { AIProvider } from '../enums/ai-provider.enum';
import { PostStatus } from '../enums/post-status.enum';
import { IsString, IsArray, IsOptional, IsEnum, IsNumber, IsDate } from 'class-validator';

export class PostResponseDto {
  @IsString()
  id!: string;

  @IsString()
  imageUrl!: string;

  @IsString()
  imagePath!: string;

  @IsString()
  caption!: string;

  @IsArray()
  @IsString({ each: true })
  hashtags!: string[];

  @IsString()
  folder!: string;

  @IsEnum(PostStatus)
  status!: PostStatus;

  @IsOptional()
  @IsNumber()
  processingTime?: number;

  @IsOptional()
  metadata?: {
    aiProvider: AIProvider;
    renderEngine: string;
    imagePrompt: string;
    gptResponse: any;
    timestamp: string;
    template: string;
  };

  @IsDate()
  createdAt!: Date;
}

export class PostPreviewDto {
  @IsString()
  id!: string;

  @IsString()
  topic!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  caption!: string;

  @IsArray()
  @IsString({ each: true })
  hashtags!: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsEnum(PostStatus)
  status!: PostStatus;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsNumber()
  estimatedTime?: number;

  @IsOptional()
  @IsArray()
  steps?: GenerationStep[];

  @IsDate()
  createdAt!: Date;
}

export class PostListDto {
  @IsArray()
  posts!: PostPreviewDto[];

  @IsNumber()
  total!: number;

  @IsNumber()
  page!: number;

  @IsNumber()
  limit!: number;

  @IsOptional()
  hasNext?: boolean;

  @IsOptional()
  hasPrev?: boolean;
}

export class PostHistoryDto {
  @IsString()
  id!: string;

  @IsString()
  topic!: string;

  @IsString()
  caption!: string;

  @IsArray()
  @IsString({ each: true })
  hashtags!: string[];

  @IsString()
  imageUrl!: string;

  @IsEnum(AIProvider)
  provider!: AIProvider;

  @IsString()
  template!: string;

  @IsEnum(PostStatus)
  status!: PostStatus;

  @IsDate()
  createdAt!: Date;

  @IsOptional()
  @IsNumber()
  processingTime?: number;
}

export class GenerationProgressDto {
  @IsString()
  id!: string;

  @IsEnum(PostStatus)
  status!: PostStatus;

  @IsNumber()
  progress!: number;

  @IsString()
  currentStep!: string;

  @IsArray()
  steps!: GenerationStep[];

  @IsOptional()
  @IsNumber()
  estimatedTime?: number;

  @IsOptional()
  @IsString()
  error?: string;
}