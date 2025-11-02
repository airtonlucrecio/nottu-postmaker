import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max, IsObject, IsBoolean } from 'class-validator';
import type { AIProviderName, ImageSize, ImageQuality } from '../types/ai.types';
import type { AISettings, VisualAISettings } from '../types/ai.types';
import { AIProvider } from '../enums/ai-provider.enum';

export class GeneratePostDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  customPrompt?: string;

  @IsOptional()
  @IsEnum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
  size?: ImageSize;

  @IsOptional()
  @IsEnum(['standard', 'hd'])
  quality?: ImageQuality;

  @IsOptional()
  @IsObject()
  aiSettings?: AISettings;

  @IsOptional()
  @IsObject()
  visualSettings?: VisualAISettings;

  @IsOptional()
  @IsBoolean()
  includeImage?: boolean;
}