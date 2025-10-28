import { ImageFormat, LogoPosition } from '../enums/render-format.enum';

export interface RenderRequest {
  content: PostContent;
  template: string;
  settings: RenderSettings;
  assets?: RenderAssets;
}

export interface RenderResponse {
  imageUrl: string;
  imagePath: string;
  width: number;
  height: number;
  format: string;
  size: number;
  metadata?: RenderMetadata;
}

export interface RenderSettings {
  width: number;
  height: number;
  format: ImageFormat;
  quality: number;
  backgroundColor?: string;
  brandColors?: Record<string, string>;
  logoPosition?: LogoPosition;
  textOverlay?: boolean;
  customCSS?: string;
}

export interface RenderAssets {
  logo?: string;
  backgroundImage?: string;
  fonts?: string[];
  customImages?: Record<string, string>;
}

export interface RenderMetadata {
  renderTime: number;
  engine: 'puppeteer' | 'satori';
  template: string;
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
}

export interface PostContent {
  title?: string;
  caption: string;
  hashtags: string[];
  visualPrompt: string;
  metadata?: Record<string, any>;
}