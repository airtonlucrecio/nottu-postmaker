import { Injectable } from '@nestjs/common';

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
  constructor() {
    console.log('HistoryService constructor called');
  }

  async list(): Promise<HistoryEntry[]> {
    console.log('HistoryService.list() called');
    return [
      {
        id: 'test-1',
        topic: 'Test Topic',
        caption: 'This is a test post to verify the API is working',
        hashtags: ['#test', '#api', '#nottu'],
        folder: 'test-folder',
        assets: {
          finalPath: '',
          captionPath: '',
          hashtagsPath: '',
          metadataPath: ''
        },
        createdAt: new Date().toISOString()
      }
    ];
  }

  async append(entry: HistoryEntry): Promise<void> {
    console.log('History entry added:', entry.id);
  }
}

