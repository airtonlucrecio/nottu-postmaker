import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class JsonStorageService {
  private readonly logger = new Logger(JsonStorageService.name);
  private readonly storageRoot: string;

  constructor() {
    this.storageRoot = path.resolve('storage');
  }

  async read<T>(fileName: string, defaultValue: T): Promise<T> {
    const filePath = await this.ensureFile(fileName, defaultValue);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.error(`Failed to read ${fileName}`, error instanceof Error ? error.stack : String(error));
      return defaultValue;
    }
  }

  async write<T>(fileName: string, value: T): Promise<void> {
    const filePath = await this.ensureFile(fileName, value);
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
  }

  private async ensureFile<T>(fileName: string, defaultValue: T): Promise<string> {
    await fs.mkdir(this.storageRoot, { recursive: true });
    const filePath = path.join(this.storageRoot, fileName);
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
    }
    return filePath;
  }
}
