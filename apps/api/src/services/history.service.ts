import { Injectable, Logger, Inject } from '@nestjs/common';
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
  publicAssets?: {
    folder: string;
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
  imagePrompt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  private readonly fileName = 'history.json';

  constructor(@Inject(JsonStorageService) private readonly storage: JsonStorageService) {
    this.logger.debug('HistoryService constructor called');
    this.logger.debug(`JsonStorageService injected: ${!!this.storage}`);
  }

  async list(): Promise<HistoryEntry[]> {
    try {
      const result = await this.storage.read<HistoryEntry[]>(this.fileName, []) || [];
      return result;
    } catch (error) {
      this.logger.error('Error in list():', error);
      return [];
    }
  }

  async getHistory(): Promise<HistoryEntry[]> {
    return this.list();
  }

  async append(entry: HistoryEntry): Promise<void> {
    try {
      this.logger.debug('Append method called');
      this.logger.debug(`Storage service available: ${!!this.storage}`);
      this.logger.debug(`Storage write method available: ${!!this.storage?.write}`);
      
      const currentHistory = await this.list();
      const updatedHistory = [entry, ...currentHistory]; // Add new entry at the beginning
      await this.storage.write(this.fileName, updatedHistory);
    } catch (error) {
      this.logger.error('Error in append method:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<HistoryEntry | undefined> {
    const history = await this.list();
    return history.find((entry) => entry.id === id);
  }

  async deleteEntry(id: string): Promise<boolean> {
    try {
      const currentHistory = await this.list();
      const filteredHistory = currentHistory.filter(entry => entry.id !== id);
      
      if (filteredHistory.length === currentHistory.length) {
        return false; // Entry not found
      }
      
      await this.storage.write(this.fileName, filteredHistory);
      return true;
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

