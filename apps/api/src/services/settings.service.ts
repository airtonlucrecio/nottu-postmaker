import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserSettings } from '../controllers/settings.controller';

@Injectable()
export class SettingsService {
  private settingsStore: Map<string, UserSettings> = new Map();

  constructor(private configService: ConfigService) {}

  async getSettings(userId?: string): Promise<UserSettings> {
    try {
      const settingsId = userId || 'default';
      
      let settings = this.settingsStore.get(settingsId);
      
      if (!settings) {
        settings = this.createDefaultSettings(settingsId);
        this.settingsStore.set(settingsId, settings);
      }

      return settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw new InternalServerErrorException('Failed to retrieve settings');
    }
  }

  async updateSettings(userId: string | undefined, updateData: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const settingsId = userId || 'default';
      let settings = this.settingsStore.get(settingsId);

      if (!settings) {
        settings = this.createDefaultSettings(settingsId);
      }

      // Deep merge the update data
      const updatedSettings: UserSettings = {
        ...settings,
        ...updateData,
        preferences: {
          ...settings.preferences,
          ...(updateData.preferences || {}),
        },
        aiSettings: {
          ...settings.aiSettings,
          ...(updateData.aiSettings || {}),
          openai: {
            ...settings.aiSettings.openai,
            ...(updateData.aiSettings?.openai || {}),
          },
          anthropic: {
            ...settings.aiSettings.anthropic,
            ...(updateData.aiSettings?.anthropic || {}),
          },
          gemini: {
            ...settings.aiSettings.gemini,
            ...(updateData.aiSettings?.gemini || {}),
          },
        },
        visualAiSettings: {
          ...settings.visualAiSettings,
          ...(updateData.visualAiSettings || {}),
          dalle: {
            ...settings.visualAiSettings.dalle,
            ...(updateData.visualAiSettings?.dalle || {}),
          },
          flux: {
            ...settings.visualAiSettings.flux,
            ...(updateData.visualAiSettings?.flux || {}),
          },
          leonardo: {
            ...settings.visualAiSettings.leonardo,
            ...(updateData.visualAiSettings?.leonardo || {}),
          },
        },
        brandSettings: {
          ...settings.brandSettings,
          ...(updateData.brandSettings || {}),
          customColors: {
            ...settings.brandSettings.customColors,
            ...(updateData.brandSettings?.customColors || {}),
          },
          customFonts: {
            ...settings.brandSettings.customFonts,
            ...(updateData.brandSettings?.customFonts || {}),
          },
        },
        exportSettings: {
          ...settings.exportSettings,
          ...(updateData.exportSettings || {}),
        },
        updatedAt: new Date(),
      };

      this.settingsStore.set(settingsId, updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new InternalServerErrorException('Failed to update settings');
    }
  }

  async getDefaultSettings(): Promise<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {
    return {
      preferences: {
        defaultAiProvider: 'openai',
        defaultImageSize: '1024x1024',
        defaultImageQuality: 'standard',
        defaultFormat: 'png',
        autoSave: true,
        notifications: true,
      },
      aiSettings: {
        openai: {
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 2000,
        },
        anthropic: {
          model: 'claude-3-sonnet-20240229',
          temperature: 0.7,
          maxTokens: 2000,
        },
        gemini: {
          model: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 2048,
        },
      },
      visualAiSettings: {
        dalle: {
          model: 'dall-e-3',
          quality: 'standard',
          style: 'vivid',
        },
        flux: {
          model: 'flux-pro',
          aspectRatio: '1:1',
          outputFormat: 'png',
        },
        leonardo: {
          model: 'leonardo-creative',
          photoReal: false,
          alchemy: true,
        },
      },
      brandSettings: {
        logoPosition: 'bottom-right',
        textOverlay: true,
        customColors: {
          primary: '#4E3FE2',
          secondary: '#0A0A0F',
          accent: '#8B5CF6',
        },
        customFonts: {
          heading: 'Inter',
          body: 'Inter',
        },
      },
      exportSettings: {
        defaultWidth: 1080,
        defaultHeight: 1080,
        defaultQuality: 90,
        watermark: false,
        metadata: true,
      },
    };
  }

  async resetSettings(userId?: string): Promise<UserSettings> {
    try {
      const settingsId = userId || 'default';
      const defaultSettings = await this.getDefaultSettings();
      
      const resetSettings: UserSettings = {
        id: settingsId,
        userId,
        ...defaultSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.settingsStore.set(settingsId, resetSettings);
      return resetSettings;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw new InternalServerErrorException('Failed to reset settings');
    }
  }

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
    return {
      aiProviders: [
        {
          id: 'openai',
          name: 'OpenAI',
          models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
          capabilities: ['text-generation', 'conversation', 'creative-writing'],
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
          capabilities: ['text-generation', 'analysis', 'reasoning'],
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          models: ['gemini-pro', 'gemini-pro-vision'],
          capabilities: ['text-generation', 'multimodal', 'code-generation'],
        },
      ],
      visualAiProviders: [
        {
          id: 'dalle',
          name: 'DALL-E',
          models: ['dall-e-3', 'dall-e-2'],
          capabilities: ['image-generation', 'creative-imagery', 'high-quality'],
        },
        {
          id: 'flux',
          name: 'Flux',
          models: ['flux-pro', 'flux-dev'],
          capabilities: ['photorealistic', 'fast-generation', 'high-resolution'],
        },
        {
          id: 'leonardo',
          name: 'Leonardo AI',
          models: ['leonardo-creative', 'leonardo-select'],
          capabilities: ['artistic-style', 'photo-real', 'alchemy-enhancement'],
        },
      ],
    };
  }

  async updatePreferences(userId: string | undefined, preferences: Partial<UserSettings['preferences']>): Promise<UserSettings['preferences']> {
    const settings = await this.getSettings(userId);
    const updatedPreferences = {
      ...settings.preferences,
      ...preferences,
    };

    await this.updateSettings(userId, { preferences: updatedPreferences });
    return updatedPreferences;
  }

  async updateAiSettings(userId: string | undefined, aiSettings: Partial<UserSettings['aiSettings']>): Promise<UserSettings['aiSettings']> {
    const settings = await this.getSettings(userId);
    const updatedAiSettings = {
      ...settings.aiSettings,
      ...aiSettings,
      openai: {
        ...settings.aiSettings.openai,
        ...(aiSettings.openai || {}),
      },
      anthropic: {
        ...settings.aiSettings.anthropic,
        ...(aiSettings.anthropic || {}),
      },
      gemini: {
        ...settings.aiSettings.gemini,
        ...(aiSettings.gemini || {}),
      },
    };

    await this.updateSettings(userId, { aiSettings: updatedAiSettings });
    return updatedAiSettings;
  }

  async updateVisualAiSettings(userId: string | undefined, visualAiSettings: Partial<UserSettings['visualAiSettings']>): Promise<UserSettings['visualAiSettings']> {
    const settings = await this.getSettings(userId);
    const updatedVisualAiSettings = {
      ...settings.visualAiSettings,
      ...visualAiSettings,
      dalle: {
        ...settings.visualAiSettings.dalle,
        ...(visualAiSettings.dalle || {}),
      },
      flux: {
        ...settings.visualAiSettings.flux,
        ...(visualAiSettings.flux || {}),
      },
      leonardo: {
        ...settings.visualAiSettings.leonardo,
        ...(visualAiSettings.leonardo || {}),
      },
    };

    await this.updateSettings(userId, { visualAiSettings: updatedVisualAiSettings });
    return updatedVisualAiSettings;
  }

  async updateBrandSettings(userId: string | undefined, brandSettings: Partial<UserSettings['brandSettings']>): Promise<UserSettings['brandSettings']> {
    const settings = await this.getSettings(userId);
    const updatedBrandSettings = {
      ...settings.brandSettings,
      ...brandSettings,
      customColors: {
        ...settings.brandSettings.customColors,
        ...(brandSettings.customColors || {}),
      },
      customFonts: {
        ...settings.brandSettings.customFonts,
        ...(brandSettings.customFonts || {}),
      },
    };

    await this.updateSettings(userId, { brandSettings: updatedBrandSettings });
    return updatedBrandSettings;
  }

  async updateExportSettings(userId: string | undefined, exportSettings: Partial<UserSettings['exportSettings']>): Promise<UserSettings['exportSettings']> {
    const settings = await this.getSettings(userId);
    const updatedExportSettings = {
      ...settings.exportSettings,
      ...exportSettings,
    };

    await this.updateSettings(userId, { exportSettings: updatedExportSettings });
    return updatedExportSettings;
  }

  private createDefaultSettings(settingsId: string): UserSettings {
    const defaults = {
      preferences: {
        defaultAiProvider: 'openai',
        defaultImageSize: '1024x1024',
        defaultImageQuality: 'standard',
        defaultFormat: 'png' as const,
        autoSave: true,
        notifications: true,
      },
      aiSettings: {
        openai: {
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 2000,
        },
        anthropic: {
          model: 'claude-3-sonnet-20240229',
          temperature: 0.7,
          maxTokens: 2000,
        },
        gemini: {
          model: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 2048,
        },
      },
      visualAiSettings: {
        dalle: {
          model: 'dall-e-3',
          quality: 'standard',
          style: 'vivid',
        },
        flux: {
          model: 'flux-pro',
          aspectRatio: '1:1',
          outputFormat: 'png',
        },
        leonardo: {
          model: 'leonardo-creative',
          photoReal: false,
          alchemy: true,
        },
      },
      brandSettings: {
        logoPosition: 'bottom-right',
        textOverlay: true,
        customColors: {
          primary: '#4E3FE2',
          secondary: '#0A0A0F',
          accent: '#8B5CF6',
        },
        customFonts: {
          heading: 'Inter',
          body: 'Inter',
        },
      },
      exportSettings: {
        defaultWidth: 1080,
        defaultHeight: 1080,
        defaultQuality: 90,
        watermark: false,
        metadata: true,
      },
    };

    return {
      id: settingsId,
      userId: settingsId !== 'default' ? settingsId : undefined,
      ...defaults,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}