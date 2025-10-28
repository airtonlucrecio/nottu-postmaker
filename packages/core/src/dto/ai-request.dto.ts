import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import type { AIProviderName, ImageSize, ImageQuality, AISettings, VisualAISettings } from '../types/ai.types';
import { AIProvider } from '../enums/ai-provider.enum';

export class AIRequestDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsEnum(AIProvider)
  provider!: AIProvider;

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
  @IsObject()
  settings?: AISettings;
}

export class VisualAIRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsEnum(AIProvider)
  provider!: AIProvider;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsEnum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
  size?: ImageSize;

  @IsOptional()
  @IsEnum(['standard', 'hd'])
  quality?: ImageQuality;

  @IsOptional()
  @IsObject()
  settings?: VisualAISettings;
}