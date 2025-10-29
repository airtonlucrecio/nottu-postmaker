import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface PersistedAssets {
  folder: string;
  assets: {
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
  };
  imageUrl?: string;
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
}

@Injectable()
export class DiskStorageService {
  private readonly logger = new Logger(DiskStorageService.name);
  private readonly outputBase: string;

  constructor(private readonly configService: ConfigService) {
    this.outputBase = this.configService.get<string>('OUTPUT_PATH') || 'C:/NottuPosts';
  }

  async persist(options: PersistOptions): Promise<PersistedAssets> {
    const dateSegment = format(options.requestedAt, 'yyyy-MM-dd');
    const folderFs = path.resolve(this.outputBase, dateSegment, options.jobId);
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
    const metadata = {
      jobId: options.jobId,
      topic: options.topic,
      caption: options.caption,
      hashtags: options.hashtags,
      provider: options.provider,
      imageUrl: options.imageUrl,
      requestedAt: options.requestedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      output: {
        folder: this.toWindowsPath(folderFs),
        finalPath: this.toWindowsPath(finalFsPath),
        captionPath: this.toWindowsPath(captionFsPath),
        hashtagsPath: this.toWindowsPath(hashtagsFsPath),
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
      folder: this.toWindowsPath(folderFs),
      assets: {
        finalPath: this.toWindowsPath(finalFsPath),
        captionPath: this.toWindowsPath(captionFsPath),
        hashtagsPath: this.toWindowsPath(hashtagsFsPath),
        metadataPath: this.toWindowsPath(metadataFsPath),
      },
      metadata,
    };
  }

  private toWindowsPath(fsPath: string): string {
    const baseFs = path.resolve(this.outputBase);
    const relative = path.relative(baseFs, path.resolve(fsPath));
    if (!relative || relative === '') {
      return path.win32.normalize(this.outputBase);
    }
    return path.win32.join(this.outputBase, relative.split(path.sep).join(path.win32.sep));
  }
}
