import { Injectable } from '@nestjs/common';
import { JsonStorageService } from './json-storage.service';

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
    try {
      return await this.storage.read<HistoryEntry[]>(this.fileName, []) || [];
    } catch (error) {
      return [];
    }
  }

  async append(entry: HistoryEntry): Promise<void> {
    try {
      const currentHistory = await this.list();
      const updatedHistory = [entry, ...currentHistory]; // Add new entry at the beginning
      await this.storage.write(this.fileName, updatedHistory);
    } catch (error) {
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.write(this.fileName, []);
    } catch (error) {
      throw error;
    }
  }
}

