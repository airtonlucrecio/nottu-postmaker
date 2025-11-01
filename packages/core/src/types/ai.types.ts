export interface AIRequest {
  topic: string;
  provider: AIProviderName;
  template?: string;
  style?: string;
  customPrompt?: string;
  settings?: AISettings;
}

export interface AIResponse {
  title?: string;
  caption: string;
  hashtags: string[];
  visualPrompt: string;
  metadata?: {
    model: string;
    tokens: number;
    processingTime: number;
  };
}

export interface VisualAIRequest {
  prompt: string;
  provider: AIProviderName;
  style?: string;
  size?: ImageSize;
  quality?: ImageQuality;
  settings?: VisualAISettings;
}

export interface VisualAIResponse {
  imageUrl: string;
  imageData?: Buffer;
  width: number;
  height: number;
  format: string;
  metadata?: {
    model: string;
    seed?: number;
    steps?: number;
    guidance?: number;
    processingTime: number;
  };
}

export interface AISettings {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
  brandVoice?: string;
  targetAudience?: string;
}

export interface VisualAISettings {
  style?: string;
  aspectRatio?: string;
  seed?: number;
  steps?: number;
  guidance?: number;
  negativePrompt?: string;
}

export interface AIProviderConfig {
  name: AIProviderName;
  type: 'text' | 'image';
  models: string[];
  config: OpenAIConfig;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  organization?: string;
}

export type ImageSize = 
  | '1024x1024' 
  | '1024x1792' 
  | '1792x1024'
  | '1080x1080'
  | '1080x1350'
  | '1350x1080';

export type ImageQuality = 'standard' | 'hd' | 'ultra';

export type AIProviderName = 'dalle' | 'openai';

export type AIProviderType = 'text' | 'image';