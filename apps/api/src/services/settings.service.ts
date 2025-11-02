import { Injectable, Inject } from '@nestjs/common';
import { JsonStorageService } from './json-storage.service';

export interface AppSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logoPath: string;
  layoutPresets: Array<Record<string, any>>;
}

const DEFAULT_SETTINGS: AppSettings = {
  colors: {
    primary: '#4E3FE2',
    secondary: '#0A0A0F',
    accent: '#8B5CF6',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
  logoPath: '',
  layoutPresets: [],
};

@Injectable()
export class SettingsService {
  private readonly fileName = 'settings.json';

  constructor(
    @Inject(JsonStorageService) private readonly storage: JsonStorageService
  ) {}

  async get(): Promise<AppSettings> {
    return this.storage.read<AppSettings>(this.fileName, DEFAULT_SETTINGS);
  }

  async update(payload: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get();
    const next: AppSettings = {
      ...current,
      ...payload,
      colors: { ...current.colors, ...(payload.colors || {}) },
      fonts: { ...current.fonts, ...(payload.fonts || {}) },
      layoutPresets: payload.layoutPresets ?? current.layoutPresets,
      logoPath: payload.logoPath ?? current.logoPath,
    };
    await this.storage.write(this.fileName, next);
    return next;
  }
}
