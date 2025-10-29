import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppSettings, SettingsService } from '../services/settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async get(): Promise<AppSettings> {
    return this.settingsService.get();
  }

  @Post()
  async update(@Body() payload: Partial<AppSettings>): Promise<AppSettings> {
    return this.settingsService.update(payload);
  }
}
