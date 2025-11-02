import { Controller, Get, Post, Body, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { SettingsDto } from '../dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    @Inject(SettingsService) private readonly settingsService: SettingsService,
  ) {}

  @Get()
  async getSettings() {
    try {
      const settings = await this.settingsService.get();
      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch settings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async updateSettings(@Body() body: SettingsDto) {
    try {
      const updatedSettings = await this.settingsService.update(body as any);
      return {
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to update settings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
