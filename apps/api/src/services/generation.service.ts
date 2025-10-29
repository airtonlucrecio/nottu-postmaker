import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostComposer } from '@nottu/render';
import {
  JobProgress,
  PostGenerationJobData,
  PostGenerationResult,
} from '@nottu/queue';
import { GeneratePostDto } from '@nottu/core';
import { OpenAIService } from './openai.service';
import { VisualAIService } from './visual-ai.service';
import { DiskStorageService } from './disk-storage.service';
import { HistoryService } from './history.service';

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);
  private readonly imageProviderDefault: 'dalle' | 'flux' | 'leonardo' | 'sdxl_local';
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
    this.imageProviderDefault = ['dalle', 'flux', 'leonardo', 'sdxl_local'].includes(provider)
      ? (provider as any)
      : 'dalle';
  }

  async processJob(
    job: PostGenerationJobData,
    update: (progress: JobProgress) => Promise<void>,
  ): Promise<PostGenerationResult> {
    const startedAt = new Date();
    await update({ step: 'initializing', percentage: 5, message: 'Preparando geração' });

    try {
      const text = await this.generateText(job, update);
      const rawProvider = job.includeImage ? job.imageProvider || this.imageProviderDefault : undefined;
      const normalizedProvider = rawProvider === 'sdxl_local' ? 'dalle' : rawProvider;
      const imageResult = await this.generateImage(text.caption, normalizedProvider, update);
      const composition = await this.composePost(text.caption, text.hashtags, imageResult?.dataUrl, update);
      const persisted = await this.diskStorageService.persist({
        jobId: job.jobId,
        topic: job.topic,
        caption: text.caption,
        hashtags: text.hashtags,
        provider: {
          text: 'openai',
          image: normalizedProvider,
        },
        imageUrl: imageResult?.originalUrl,
        composition,
        requestedAt: startedAt,
      });

      await this.historyService.append({
        id: job.jobId,
        topic: job.topic,
        caption: text.caption,
        hashtags: text.hashtags,
        folder: persisted.folder,
        assets: persisted.assets,
        createdAt: new Date().toISOString(),
      });

      await update({ step: 'completed', percentage: 100, message: 'Geração concluída' });

      return {
        jobId: job.jobId,
        status: 'completed',
        caption: text.caption,
        hashtags: text.hashtags,
        folder: persisted.folder,
        assets: persisted.assets,
        metadata: {
          ...persisted.metadata,
          job,
        },
      };
    } catch (error) {
      this.logger.error(`Job ${job.jobId} failed`, error instanceof Error ? error.stack : String(error));
      await update({ step: 'failed', percentage: 100, message: (error as Error)?.message ?? 'Falha na geração' });
      throw error;
    }
  }

  private async generateText(
    job: PostGenerationJobData,
    update: (progress: JobProgress) => Promise<void>,
  ): Promise<{ caption: string; hashtags: string[] } > {
    await update({ step: 'text', percentage: 25, message: 'Gerando legenda e hashtags' });
    const dto: GeneratePostDto = {
      topic: job.topic,
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
    update: (progress: JobProgress) => Promise<void>,
  ): Promise<{ dataUrl: string; originalUrl?: string } | undefined> {
    if (!provider) {
      return undefined;
    }

    await update({ step: 'image', percentage: 55, message: `Gerando imagem com ${provider}` });

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
    update: (progress: JobProgress) => Promise<void>,
  ): Promise<{ buffer: Buffer; format: string; width: number; height: number; engine: string; size: number; renderTime: number }> {
    await update({ step: 'render', percentage: 75, message: 'Renderizando arte final' });

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
