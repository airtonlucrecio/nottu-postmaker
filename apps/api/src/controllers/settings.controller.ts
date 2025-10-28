import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { ValidationUtils } from '@nottu/core';
import { SettingsService } from '../services/settings.service';
import { ApiKeyGuard } from '../guards/api-key.guard';

export interface UserSettings {
  id: string;
  userId?: string;
  preferences: {
    defaultAiProvider: string;
    defaultImageSize: string;
    defaultImageQuality: string;
    defaultFormat: 'png' | 'jpg' | 'webp';
    autoSave: boolean;
    notifications: boolean;
  };
  aiSettings: {
    openai?: {
      model: string;
      temperature: number;
      maxTokens: number;
    };
    anthropic?: {
      model: string;
      temperature: number;
      maxTokens: number;
    };
    gemini?: {
      model: string;
      temperature: number;
      maxTokens: number;
    };
  };
  visualAiSettings: {
    dalle?: {
      model: string;
      quality: string;
      style: string;
    };
    flux?: {
      model: string;
      aspectRatio: string;
      outputFormat: string;
    };
    leonardo?: {
      model: string;
      photoReal: boolean;
      alchemy: boolean;
    };
  };
  brandSettings: {
    logoPosition: string;
    textOverlay: boolean;
    customColors?: {
      primary: string;
      secondary: string;
      accent: string;
    };
    customFonts?: {
      heading: string;
      body: string;
    };
  };
  exportSettings: {
    defaultWidth: number;
    defaultHeight: number;
    defaultQuality: number;
    watermark: boolean;
    metadata: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Controller('api/settings')
@UseGuards(ApiKeyGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getSettings(@Req() request: Request): Promise<UserSettings> {
    try {
      // Extract user info
      const userId = this.extractUserId(request);

      // Get settings from service
      const settings = await this.settingsService.getSettings(userId);

      return settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve settings. Please try again.',
      );
    }
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @Body() updateData: Partial<UserSettings>,
    @Req() request: Request,
  ): Promise<UserSettings> {
    try {
      // Extract user info
      const userId = this.extractUserId(request);

      // Validate update data
      this.validateSettingsUpdate(updateData);

      // Update settings
      const updatedSettings = await this.settingsService.updateSettings(
        userId,
        updateData,
      );

      return updatedSettings;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error updating settings:', error);
      throw new InternalServerErrorException(
        'Failed to update settings. Please try again.',
      );
    }
  }

  @Get('defaults')
  @HttpCode(HttpStatus.OK)
  async getDefaultSettings(): Promise<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {
    try {
      const defaults = await this.settingsService.getDefaultSettings();
      return defaults;
    } catch (error) {
      console.error('Error getting default settings:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve default settings. Please try again.',
      );
    }
  }

  @Put('reset')
  @HttpCode(HttpStatus.OK)
  async resetSettings(@Req() request: Request): Promise<UserSettings> {
    try {
      // Extract user info
      const userId = this.extractUserId(request);

      // Reset settings to defaults
      const resetSettings = await this.settingsService.resetSettings(userId);

      return resetSettings;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw new InternalServerErrorException(
        'Failed to reset settings. Please try again.',
      );
    }
  }

  @Get('providers')
  @HttpCode(HttpStatus.OK)
  async getAvailableProviders(): Promise<{
    aiProviders: Array<{
      id: string;
      name: string;
      models: string[];
      capabilities: string[];
    }>;
    visualAiProviders: Array<{
      id: string;
      name: string;
      models: string[];
      capabilities: string[];
    }>;
  }> {
    try {
      const providers = await this.settingsService.getAvailableProviders();
      return providers;
    } catch (error) {
      console.error('Error getting available providers:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve available providers. Please try again.',
      );
    }
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @Body() preferences: Partial<UserSettings['preferences']>,
    @Req() request: Request,
  ): Promise<UserSettings['preferences']> {
    try {
      // Extract user info
      const userId = this.extractUserId(request);

      // Validate preferences
      this.validatePreferences(preferences);

      // Update preferences
      const updatedPreferences = await this.settingsService.updatePreferences(
        userId,
        preferences,
      );

      return updatedPreferences;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error updating preferences:', error);
      throw new InternalServerErrorException(
        'Failed to update preferences. Please try again.',
      );
    }
  }

  @Put('ai-settings')
  @HttpCode(HttpStatus.OK)
  async updateAiSettings(
    @Body() aiSettings: Partial<UserSettings['aiSettings']>,
    @Req() request: Request,
  ): Promise<UserSettings['aiSettings']> {
    try {
      // Extract user info
      const userId = this.extractUserId(request);

      // Validate AI settings
      this.validateAiSettings(aiSettings);

      // Update AI settings
      const updatedAiSettings = await this.settingsService.updateAiSettings(
        userId,
        aiSettings,
      );

      return updatedAiSettings;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error updating AI settings:', error);
      throw new InternalServerErrorException(
        'Failed to update AI settings. Please try again.',
      );
    }
  }

  @Put('visual-ai-settings')
  @HttpCode(HttpStatus.OK)
  async updateVisualAiSettings(
    @Body() visualAiSettings: Partial<UserSettings['visualAiSettings']>,
    @Req() request: Request,
  ): Promise<UserSettings['visualAiSettings']> {
    try {
      // Extract user info
      const userId = this.extractUserId(request);

      // Validate visual AI settings
      this.validateVisualAiSettings(visualAiSettings);

      // Update visual AI settings
      const updatedVisualAiSettings = await this.settingsService.updateVisualAiSettings(
        userId,
        visualAiSettings,
      );

      return updatedVisualAiSettings;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error updating visual AI settings:', error);
      throw new InternalServerErrorException(
        'Failed to update visual AI settings. Please try again.',
      );
    }
  }

  @Put('brand-settings')
  @HttpCode(HttpStatus.OK)
  async updateBrandSettings(
    @Body() brandSettings: Partial<UserSettings['brandSettings']>,
    @Req() request: Request,
  ): Promise<UserSettings['brandSettings']> {
    try {
      // Extract user info
      const userId = this.extractUserId(request);

      // Validate brand settings
      this.validateBrandSettings(brandSettings);

      // Update brand settings
      const updatedBrandSettings = await this.settingsService.updateBrandSettings(
        userId,
        brandSettings,
      );

      return updatedBrandSettings;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error updating brand settings:', error);
      throw new InternalServerErrorException(
        'Failed to update brand settings. Please try again.',
      );
    }
  }

  @Put('export-settings')
  @HttpCode(HttpStatus.OK)
  async updateExportSettings(
    @Body() exportSettings: Partial<UserSettings['exportSettings']>,
    @Req() request: Request,
  ): Promise<UserSettings['exportSettings']> {
    try {
      // Extract user info
      const userId = this.extractUserId(request);

      // Validate export settings
      this.validateExportSettings(exportSettings);

      // Update export settings
      const updatedExportSettings = await this.settingsService.updateExportSettings(
        userId,
        exportSettings,
      );

      return updatedExportSettings;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error updating export settings:', error);
      throw new InternalServerErrorException(
        'Failed to update export settings. Please try again.',
      );
    }
  }

  private validateSettingsUpdate(updateData: Partial<UserSettings>): void {
    // Validate each section if present
    if (updateData.preferences) {
      this.validatePreferences(updateData.preferences);
    }

    if (updateData.aiSettings) {
      this.validateAiSettings(updateData.aiSettings);
    }

    if (updateData.visualAiSettings) {
      this.validateVisualAiSettings(updateData.visualAiSettings);
    }

    if (updateData.brandSettings) {
      this.validateBrandSettings(updateData.brandSettings);
    }

    if (updateData.exportSettings) {
      this.validateExportSettings(updateData.exportSettings);
    }
  }

  private validatePreferences(preferences: Partial<UserSettings['preferences']>): void {
    if (preferences.defaultAiProvider && !ValidationUtils.isValidAIProvider(preferences.defaultAiProvider)) {
      throw new BadRequestException('Invalid default AI provider');
    }

    if (preferences.defaultImageSize && !ValidationUtils.isValidImageSize(preferences.defaultImageSize)) {
      throw new BadRequestException('Invalid default image size');
    }

    if (preferences.defaultImageQuality && !ValidationUtils.isValidImageQuality(preferences.defaultImageQuality)) {
      throw new BadRequestException('Invalid default image quality');
    }

    if (preferences.defaultFormat && !['png', 'jpg', 'webp'].includes(preferences.defaultFormat)) {
      throw new BadRequestException('Invalid default format');
    }

    if (preferences.autoSave !== undefined && typeof preferences.autoSave !== 'boolean') {
      throw new BadRequestException('autoSave must be a boolean');
    }

    if (preferences.notifications !== undefined && typeof preferences.notifications !== 'boolean') {
      throw new BadRequestException('notifications must be a boolean');
    }
  }

  private validateAiSettings(aiSettings: Partial<UserSettings['aiSettings']>): void {
    // Validate OpenAI settings
    if (aiSettings.openai) {
      if (aiSettings.openai.temperature !== undefined) {
        if (aiSettings.openai.temperature < 0 || aiSettings.openai.temperature > 2) {
          throw new BadRequestException('OpenAI temperature must be between 0 and 2');
        }
      }

      if (aiSettings.openai.maxTokens !== undefined) {
        if (aiSettings.openai.maxTokens < 1 || aiSettings.openai.maxTokens > 4000) {
          throw new BadRequestException('OpenAI maxTokens must be between 1 and 4000');
        }
      }
    }

    // Validate Anthropic settings
    if (aiSettings.anthropic) {
      if (aiSettings.anthropic.temperature !== undefined) {
        if (aiSettings.anthropic.temperature < 0 || aiSettings.anthropic.temperature > 1) {
          throw new BadRequestException('Anthropic temperature must be between 0 and 1');
        }
      }

      if (aiSettings.anthropic.maxTokens !== undefined) {
        if (aiSettings.anthropic.maxTokens < 1 || aiSettings.anthropic.maxTokens > 4000) {
          throw new BadRequestException('Anthropic maxTokens must be between 1 and 4000');
        }
      }
    }

    // Validate Gemini settings
    if (aiSettings.gemini) {
      if (aiSettings.gemini.temperature !== undefined) {
        if (aiSettings.gemini.temperature < 0 || aiSettings.gemini.temperature > 1) {
          throw new BadRequestException('Gemini temperature must be between 0 and 1');
        }
      }

      if (aiSettings.gemini.maxTokens !== undefined) {
        if (aiSettings.gemini.maxTokens < 1 || aiSettings.gemini.maxTokens > 2048) {
          throw new BadRequestException('Gemini maxTokens must be between 1 and 2048');
        }
      }
    }
  }

  private validateVisualAiSettings(visualAiSettings: Partial<UserSettings['visualAiSettings']>): void {
    // Validate DALL-E settings
    if (visualAiSettings.dalle) {
      const validQualities = ['standard', 'hd'];
      if (visualAiSettings.dalle.quality && !validQualities.includes(visualAiSettings.dalle.quality)) {
        throw new BadRequestException('Invalid DALL-E quality');
      }

      const validStyles = ['vivid', 'natural'];
      if (visualAiSettings.dalle.style && !validStyles.includes(visualAiSettings.dalle.style)) {
        throw new BadRequestException('Invalid DALL-E style');
      }
    }

    // Validate Flux settings
    if (visualAiSettings.flux) {
      const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
      if (visualAiSettings.flux.aspectRatio && !validAspectRatios.includes(visualAiSettings.flux.aspectRatio)) {
        throw new BadRequestException('Invalid Flux aspect ratio');
      }

      const validFormats = ['png', 'jpg', 'webp'];
      if (visualAiSettings.flux.outputFormat && !validFormats.includes(visualAiSettings.flux.outputFormat)) {
        throw new BadRequestException('Invalid Flux output format');
      }
    }

    // Validate Leonardo settings
    if (visualAiSettings.leonardo) {
      if (visualAiSettings.leonardo.photoReal !== undefined && typeof visualAiSettings.leonardo.photoReal !== 'boolean') {
        throw new BadRequestException('Leonardo photoReal must be a boolean');
      }

      if (visualAiSettings.leonardo.alchemy !== undefined && typeof visualAiSettings.leonardo.alchemy !== 'boolean') {
        throw new BadRequestException('Leonardo alchemy must be a boolean');
      }
    }
  }

  private validateBrandSettings(brandSettings: Partial<UserSettings['brandSettings']>): void {
    if (brandSettings.logoPosition && !ValidationUtils.isValidLogoPosition(brandSettings.logoPosition)) {
      throw new BadRequestException('Invalid logo position');
    }

    if (brandSettings.textOverlay !== undefined && typeof brandSettings.textOverlay !== 'boolean') {
      throw new BadRequestException('textOverlay must be a boolean');
    }

    // Validate custom colors
    if (brandSettings.customColors) {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      if (brandSettings.customColors.primary && !hexColorRegex.test(brandSettings.customColors.primary)) {
        throw new BadRequestException('Invalid primary color format');
      }

      if (brandSettings.customColors.secondary && !hexColorRegex.test(brandSettings.customColors.secondary)) {
        throw new BadRequestException('Invalid secondary color format');
      }

      if (brandSettings.customColors.accent && !hexColorRegex.test(brandSettings.customColors.accent)) {
        throw new BadRequestException('Invalid accent color format');
      }
    }

    // Validate custom fonts
    if (brandSettings.customFonts) {
      if (brandSettings.customFonts.heading && typeof brandSettings.customFonts.heading !== 'string') {
        throw new BadRequestException('Heading font must be a string');
      }

      if (brandSettings.customFonts.body && typeof brandSettings.customFonts.body !== 'string') {
        throw new BadRequestException('Body font must be a string');
      }
    }
  }

  private validateExportSettings(exportSettings: Partial<UserSettings['exportSettings']>): void {
    if (exportSettings.defaultWidth !== undefined) {
      if (exportSettings.defaultWidth < 100 || exportSettings.defaultWidth > 4096) {
        throw new BadRequestException('Default width must be between 100 and 4096');
      }
    }

    if (exportSettings.defaultHeight !== undefined) {
      if (exportSettings.defaultHeight < 100 || exportSettings.defaultHeight > 4096) {
        throw new BadRequestException('Default height must be between 100 and 4096');
      }
    }

    if (exportSettings.defaultQuality !== undefined) {
      if (exportSettings.defaultQuality < 1 || exportSettings.defaultQuality > 100) {
        throw new BadRequestException('Default quality must be between 1 and 100');
      }
    }

    if (exportSettings.watermark !== undefined && typeof exportSettings.watermark !== 'boolean') {
      throw new BadRequestException('watermark must be a boolean');
    }

    if (exportSettings.metadata !== undefined && typeof exportSettings.metadata !== 'boolean') {
      throw new BadRequestException('metadata must be a boolean');
    }
  }

  private extractUserId(request: Request): string | undefined {
    // Extract user ID from JWT token, session, or API key
    return request.headers['x-user-id'] as string;
  }
}