export interface RenderConfig {
  outputPath: string;
  imageQuality: number;
  format: 'png' | 'jpg' | 'webp';
  width: number;
  height: number;
  deviceScaleFactor: number;
}

export interface PostContent {
  title?: string;
  caption: string;
  hashtags: string[];
  visualPrompt: string;
}

export interface VisualAsset {
  imageUrl: string;
  width: number;
  height: number;
  format: string;
}

export interface PostComposition {
  content: PostContent;
  image: VisualAsset;
  template: string;
  settings?: {
    brandColors?: Record<string, string>;
    customTemplate?: string;
    logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    textOverlay?: boolean;
  };
}

export interface RenderResult {
  imagePath: string;
  captionPath: string;
  hashtagsPath: string;
  metadataPath: string;
  folderPath: string;
}

export interface TemplateConfig {
  name: string;
  width: number;
  height: number;
  layout: {
    imageArea: { x: number; y: number; width: number; height: number };
    textArea?: { x: number; y: number; width: number; height: number };
    logoArea?: { x: number; y: number; width: number; height: number };
  };
  styles: {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    fontFamily: string;
    padding: number;
    borderRadius: number;
  };
}

export interface SaveOptions {
  id: string;
  outputPath?: string;
  createSubfolder?: boolean;
  includeMetadata?: boolean;
}