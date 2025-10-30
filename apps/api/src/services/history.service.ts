import { Injectable } from '@nestjs/common';
import { JsonStorageService } from './json-storage.service';
import { Injectable } from '@nestjs/common';
import { JsonStorageService } from './json-storage.service';

export interface HistoryEntry {
export interface HistoryEntry {
  id: string;
  topic: string;
  caption: string;
  hashtags: string[];
  folder: string;
  folderFs?: string;
  assets: {
    finalPath: string;
    captionPath: string;
    hashtagsPath: string;
    metadataPath: string;
  };
  fsAssets?: {
    finalPath: string;
    captionPath: string;
    hashtagsPath: string;
    metadataPath: string;
  };
  provider?: {
    text: string;
    requestedImage?: string;
    effectiveImage?: string;
  };
  createdAt: string;
}

@Injectable()
export class HistoryService {
  private readonly fileName = 'history.json';

  constructor(private readonly storage: JsonStorageService) {}

  async list(): Promise<HistoryEntry[]> {
    return this.storage.read<HistoryEntry[]>(this.fileName, []);
  }

  async append(entry: HistoryEntry): Promise<void> {
    const history = await this.list();
    history.push(entry);
    await this.storage.write(this.fileName, history);
  private readonly fileName = 'history.json';

  constructor(private readonly storage: JsonStorageService) {}

  async list(): Promise<HistoryEntry[]> {
    return this.storage.read<HistoryEntry[]>(this.fileName, []);
  }

  async append(entry: HistoryEntry): Promise<void> {
    const history = await this.list();
    history.push(entry);
    await this.storage.write(this.fileName, history);
  }
}

