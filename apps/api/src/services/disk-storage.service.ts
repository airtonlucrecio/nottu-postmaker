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
  publicAssets: {
    folder: string;
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
  private readonly servePrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.outputBaseFs =
      this.configService.get<string>('OUTPUT_PATH') || path.join(process.cwd(), 'output');
    this.outputBaseDisplay = this.configService.get<string>('OUTPUT_WINDOWS_PATH') || this.outputBaseFs;
    this.outputBaseResolved = path.resolve(this.outputBaseFs);
    this.displayIsWindows = /^[a-zA-Z]:/.test(this.outputBaseDisplay) || this.outputBaseDisplay.includes('\\');
    this.displayBaseNormalized = this.displayIsWindows
      ? path.win32.normalize(this.outputBaseDisplay)
      : path.posix.normalize(this.outputBaseDisplay.replace(/\\/g, '/'));
    const prefixRaw = this.configService.get<string>('OUTPUT_SERVE_PREFIX') || '/files';
    const trimmed = prefixRaw.trim();
    const sanitized = trimmed === '' ? '/files' : trimmed;
    this.servePrefix = `/${sanitized.replace(/^\/+|\/+$/g, '')}`;
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

    const folderServePath = this.toServePath(folderFs);
    const finalServePath = this.toServePath(finalFsPath);
    const captionServePath = this.toServePath(captionFsPath);
    const hashtagsServePath = this.toServePath(hashtagsFsPath);
    const metadataServePath = this.toServePath(metadataFsPath);

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
        public: {
          folder: folderServePath,
          finalPath: finalServePath,
          captionPath: captionServePath,
          hashtagsPath: hashtagsServePath,
          metadataPath: metadataServePath,
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
      publicAssets: {
        folder: folderServePath,
        finalPath: finalServePath,
        captionPath: captionServePath,
        hashtagsPath: hashtagsServePath,
        metadataPath: metadataServePath,
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

  private toServePath(fsPath: string): string {
    const resolved = path.resolve(fsPath);
    const relative = path.relative(this.outputBaseResolved, resolved);

    if (!relative || relative === '' || relative.startsWith('..')) {
      return this.servePrefix === '/' ? '/' : `${this.servePrefix}/`;
    }

    const normalized = relative
      .split(path.sep)
      .filter((segment) => segment && segment !== '.' && segment !== '..')
      .join('/');

    const prefix = this.servePrefix === '/' ? '' : this.servePrefix;

    if (!normalized) {
      return this.servePrefix === '/' ? '/' : `${prefix}/`;
    }

    return `${prefix}/${normalized}`.replace(/\/{2,}/g, '/');
  }
}
