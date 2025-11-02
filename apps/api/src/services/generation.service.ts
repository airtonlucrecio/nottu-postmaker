import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostComposer } from '@nottu/render';
import { GeneratePostDto } from '@nottu/core';
import { OpenAIService } from './openai.service';
import { VisualAIService } from './visual-ai.service';
import { DiskStorageService } from './disk-storage.service';
import { HistoryService } from './history.service';

// Tipos locais para substituir os tipos de queue
export interface GeneratePostRequest {
  topic: string;
  includeImage?: boolean;
  imageProvider?: 'dalle';
}

export interface PostGenerationResult {
  id: string;
  topic: string;
  caption: string;
  hashtags: string[];
  folder: string;
  folderFs: string;
  assets: any;
  fsAssets: any;
  metadata: any;
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);
  private readonly imageProviderDefault: 'dalle';
  private readonly composer = new PostComposer();
  private composerReady = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
    private readonly visualAiService: VisualAIService,
    private readonly diskStorageService: DiskStorageService,
    private readonly historyService: HistoryService,
  ) {
    const provider = this.configService.get<string>('IA_IMAGE_PROVIDER') || 'dalle';
    this.imageProviderDefault = provider === 'dalle' ? 'dalle' : 'dalle';
  }

  async generatePost(request: GeneratePostRequest): Promise<PostGenerationResult> {
    const id = this.generateId();
    const requestedAt = new Date();
    const startedAt = new Date();
    
    this.logger.log(`Starting post generation for topic: ${request.topic}`);

    try {
      // Gerar texto (legenda e hashtags)
      const text = await this.generateText(request.topic);
      
      // Determinar provedor de imagem
      const requestedImageProvider = request.includeImage
        ? request.imageProvider || this.imageProviderDefault
        : undefined;

      let effectiveImageProvider = requestedImageProvider;

      // Gerar imagem se solicitado
      let imageResult: Awaited<ReturnType<GenerationService['generateImage']>>;
      if (effectiveImageProvider) {
        imageResult = await this.generateImage(text.caption, effectiveImageProvider);
      } else {
        this.logger.log('Image generation disabled');
        imageResult = undefined;
      }
      
      // Compor o post final
      const composition = await this.composePost(text.caption, text.hashtags, imageResult?.dataUrl);
      
      // Persistir dados
      const persisted = await this.diskStorageService.persist({
        jobId: id,
        topic: request.topic,
        caption: text.caption,
        hashtags: text.hashtags,
        provider: {
          text: 'openai',
          requestedImage: requestedImageProvider,
          effectiveImage: effectiveImageProvider,
          image: effectiveImageProvider,
        },
        imageUrl: imageResult?.originalUrl,
        composition,
        requestedAt,
        startedAt,
      });

      // Adicionar ao histórico
      await this.historyService.append({
        id: id,
        topic: request.topic,
        caption: text.caption,
        hashtags: text.hashtags,
        folder: persisted.folder,
        folderFs: persisted.folderFs,
        assets: persisted.assets,
        fsAssets: persisted.fsAssets,
        provider: {
          text: 'openai',
          requestedImage: requestedImageProvider,
          effectiveImage: effectiveImageProvider,
        },
        createdAt: persisted.metadata.completedAt || new Date().toISOString(),
      });

      this.logger.log(`Post generation completed for ID: ${id}`);

      return {
        id: id,
        topic: request.topic,
        caption: text.caption,
        hashtags: text.hashtags,
        folder: persisted.folder,
        folderFs: persisted.folderFs,
        assets: persisted.assets,
        fsAssets: persisted.fsAssets,
        metadata: {
          ...persisted.metadata,
          timings: {
            requestedAt: requestedAt.toISOString(),
            startedAt: startedAt.toISOString(),
            completedAt: persisted.metadata.completedAt,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Post generation failed for topic: ${request.topic}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private generateId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateText(topic: string): Promise<{ caption: string; hashtags: string[] }> {
    this.logger.log('Generating caption and hashtags');
    
    const dto: GeneratePostDto = {
      topic: topic,
    } as GeneratePostDto;

    const result = await this.openaiService.generatePost(dto);
    return {
      caption: result.content.caption,
      hashtags: result.content.hashtags || [],
    };
  }

  private async generateImage(
    caption: string,
    provider: string | undefined,
  ): Promise<{ dataUrl: string; originalUrl?: string } | undefined> {
    if (!provider) {
      return undefined;
    }

    this.logger.log(`Generating image with ${provider}`);

    const image = await this.visualAiService.generateImage(`Social media post: ${caption}`, provider as any);
    const format = image.metadata?.format || 'png';
    const buffer = image.imageData;
    const dataUrl = buffer
      ? `data:image/${format};base64,${buffer.toString('base64')}`
      : image.imageUrl || '';

    return {
      dataUrl,
      originalUrl: image.imageUrl,
    };
  }

  private async composePost(
    caption: string,
    hashtags: string[],
    imageUrl: string | undefined,
  ): Promise<{ buffer: Buffer; format: string; width: number; height: number; engine: string; size: number; renderTime: number }> {
    this.logger.log('Rendering final artwork');

    if (!this.composerReady) {
      await this.composer.initialize();
      this.composerReady = true;
    }

    const composerResult = await this.composer.compose(
      {
        caption,
        hashtags,
      } as any,
      imageUrl || 'https://dummyimage.com/1080x1080/1e1b4b/ffffff.png&text=Nottu',
      {
        logoPosition: 'bottom-right',
        textOverlay: true,
      } as any,
      {
        engine: 'satori',
        width: 1080,
        height: 1080,
        quality: 90,
        format: 'png',
      },
    );

    return {
      buffer: composerResult.buffer,
      format: composerResult.metadata.format,
      width: composerResult.metadata.width,
      height: composerResult.metadata.height,
      engine: composerResult.metadata.engine,
      size: composerResult.metadata.size,
      renderTime: composerResult.metadata.renderTime,
    };
  }
}
