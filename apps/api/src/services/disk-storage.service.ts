import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface PersistedAssets {
  folder: string;
  folderFs: string;
  assets: {
    finalPath: string;
    captionPath: string;
    hashtagsPath: string;
    metadataPath: string;
  };
  fsAssets: {
    finalPath: string;
    captionPath: string;
    hashtagsPath: string;
    metadataPath: string;
  };
  metadata: Record<string, any>;
}

interface PersistOptions {
  jobId: string;
  topic: string;
  caption: string;
  hashtags: string[];
  provider: {
    text: string;
    image?: string;
    requestedImage?: string;
    effectiveImage?: string;
  };
  imageUrl?: string;
  visualPrompt?: string;
  textMetadata?: Record<string, any>;
  image?: {
    prompt?: string;
    revisedPrompt?: string;
    provider?: string;
    model?: string;
    metadata?: Record<string, any>;
    url?: string;
  };
  composition: {
    buffer: Buffer;
    format: string;
    width: number;
    height: number;
    engine: string;
    size: number;
    renderTime: number;
  };
  requestedAt: Date;
  startedAt: Date;
}

@Injectable()
export class DiskStorageService {
  private readonly logger = new Logger(DiskStorageService.name);
  private readonly outputBaseFs: string;
  private readonly outputBaseDisplay: string;
  private readonly outputBaseResolved: string;
  private readonly displayIsWindows: boolean;
  private readonly displayBaseNormalized: string;

  constructor(private readonly configService: ConfigService) {
    this.outputBaseFs = this.configService.get<string>('OUTPUT_PATH') || 'C:/NottuPosts';
    this.outputBaseDisplay = this.configService.get<string>('OUTPUT_WINDOWS_PATH') || this.outputBaseFs;
    this.outputBaseResolved = path.resolve(this.outputBaseFs);
    this.displayIsWindows = /^[a-zA-Z]:/.test(this.outputBaseDisplay) || this.outputBaseDisplay.includes('\\');
    this.displayBaseNormalized = this.displayIsWindows
      ? path.win32.normalize(this.outputBaseDisplay)
      : path.posix.normalize(this.outputBaseDisplay.replace(/\\/g, '/'));
  }

  async persist(options: PersistOptions): Promise<PersistedAssets> {
    const dateSegment = format(options.requestedAt, 'yyyy-MM-dd');
    const folderFs = path.resolve(this.outputBaseResolved, dateSegment, options.jobId);
    await fs.mkdir(folderFs, { recursive: true });

    const finalFileName = `final.${options.composition.format}`;
    const captionFileName = 'caption.txt';
    const hashtagsFileName = 'hashtags.txt';
    const metadataFileName = 'metadata.json';

    const finalFsPath = path.join(folderFs, finalFileName);
    const captionFsPath = path.join(folderFs, captionFileName);
    const hashtagsFsPath = path.join(folderFs, hashtagsFileName);
    const metadataFsPath = path.join(folderFs, metadataFileName);

    await fs.writeFile(finalFsPath, options.composition.buffer);
    await fs.writeFile(captionFsPath, options.caption, 'utf-8');
    await fs.writeFile(hashtagsFsPath, options.hashtags.join('\n'), 'utf-8');

    const completedAt = new Date();
    const folderDisplayPath = this.toDisplayPath(folderFs);
    const finalDisplayPath = this.toDisplayPath(finalFsPath);
    const captionDisplayPath = this.toDisplayPath(captionFsPath);
    const hashtagsDisplayPath = this.toDisplayPath(hashtagsFsPath);
    const metadataDisplayPath = this.toDisplayPath(metadataFsPath);

    const requestedImage = options.provider.requestedImage;
    const effectiveImage =
      options.provider.effectiveImage ||
      options.provider.image ||
      requestedImage;

    const providerMetadata = {
      text: options.provider.text,
      requestedImage,
      effectiveImage,
      image: effectiveImage,
      fallbackApplied:
        !!(
          requestedImage &&
          effectiveImage &&
          requestedImage !== effectiveImage
        ),
    };

    const metadata = {
      jobId: options.jobId,
      topic: options.topic,
      caption: options.caption,
      hashtags: options.hashtags,
      provider: providerMetadata,
      imageUrl: options.imageUrl,
      prompts: {
        topic: options.topic,
        visual: options.visualPrompt,
        image: options.image?.prompt,
        revisedImage: options.image?.revisedPrompt,
      },
      text: options.textMetadata,
      image: options.image
        ? {
            provider: options.image.provider || effectiveImage,
            model: options.image.model,
            url: options.image.url || options.imageUrl,
            metadata: options.image.metadata,
          }
        : undefined,
      requestedAt: options.requestedAt.toISOString(),
      startedAt: options.startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      output: {
        folder: folderDisplayPath,
        finalPath: finalDisplayPath,
        captionPath: captionDisplayPath,
        hashtagsPath: hashtagsDisplayPath,
        metadataPath: metadataDisplayPath,
        fs: {
          folder: folderFs,
          finalPath: finalFsPath,
          captionPath: captionFsPath,
          hashtagsPath: hashtagsFsPath,
          metadataPath: metadataFsPath,
        },
      },
      render: {
        width: options.composition.width,
        height: options.composition.height,
        format: options.composition.format,
        engine: options.composition.engine,
        size: options.composition.size,
        renderTime: options.composition.renderTime,
      },
    };

    await fs.writeFile(metadataFsPath, JSON.stringify(metadata, null, 2), 'utf-8');

    this.logger.debug(`Assets persisted for job ${options.jobId} at ${folderFs}`);

    return {
      folder: folderDisplayPath,
      folderFs,
      assets: {
        finalPath: finalDisplayPath,
        captionPath: captionDisplayPath,
        hashtagsPath: hashtagsDisplayPath,
        metadataPath: metadataDisplayPath,
      },
      fsAssets: {
        finalPath: finalFsPath,
        captionPath: captionFsPath,
        hashtagsPath: hashtagsFsPath,
        metadataPath: metadataFsPath,
      },
      metadata,
    };
  }

  private toDisplayPath(fsPath: string): string {
    const relative = path.relative(this.outputBaseResolved, path.resolve(fsPath));
    if (!relative || relative === '') {
      return this.displayBaseNormalized;
    }

    const segments = relative.split(path.sep).filter(Boolean);

    if (this.displayIsWindows) {
      return path.win32.join(this.displayBaseNormalized, ...segments);
    }

    return path.posix.join(this.displayBaseNormalized, ...segments);
  }
}
