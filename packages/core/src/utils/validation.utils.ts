import { AIProviderName, ImageSize, ImageQuality } from '../types/ai.types';
import { PostStatus, GenerationStepStatus } from '../enums/post-status.enum';
import { AIProvider } from '../enums/ai-provider.enum';
import { LogoPosition, ImageFormat } from '../enums/render-format.enum';

export class ValidationUtils {
  /**
   * Valida se o provider de IA é válido
   */
  static isValidAIProvider(provider: string): provider is AIProvider {
    return Object.values(AIProvider).includes(provider as AIProvider);
  }

  /**
   * Valida se o tamanho da imagem é válido
   */
  static isValidImageSize(size: string): size is ImageSize {
    return ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'].includes(size);
  }

  /**
   * Valida se a qualidade da imagem é válida
   */
  static isValidImageQuality(quality: string): quality is ImageQuality {
    return ['standard', 'hd'].includes(quality);
  }

  /**
   * Valida se o status do post é válido
   */
  static isValidPostStatus(status: string): status is PostStatus {
    return Object.values(PostStatus).includes(status as PostStatus);
  }

  /**
   * Valida se a posição do logo é válida
   */
  static isValidLogoPosition(position: string): position is LogoPosition {
    return Object.values(LogoPosition).includes(position as LogoPosition);
  }

  /**
   * Valida se o formato da imagem é válido
   */
  static isValidImageFormat(format: string): format is ImageFormat {
    return Object.values(ImageFormat).includes(format as ImageFormat);
  }

  /**
   * Valida se uma string é um tópico válido
   */
  static isValidTopic(topic: string): boolean {
    return typeof topic === 'string' && topic.trim().length >= 3 && topic.trim().length <= 500;
  }

  /**
   * Valida se uma API key é válida para o provider especificado
   */
  static isValidApiKey(apiKey: string, provider: AIProvider): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    switch (provider) {
      case AIProvider.OPENAI:
      case AIProvider.DALLE:
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      default:
        return false;
    }
  }

  /**
   * Valida se um URL é válido
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valida se um caminho de arquivo é válido
   */
  static isValidFilePath(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') return false;
    
    // Verifica caracteres inválidos em caminhos de arquivo
    const invalidChars = /[<>:"|?*]/;
    return !invalidChars.test(filePath);
  }

  /**
   * Valida configurações de IA
   */
  static validateAISettings(settings: any): boolean {
    if (!settings || typeof settings !== 'object') return true; // Opcional

    const { temperature, maxTokens, model } = settings;

    if (temperature !== undefined) {
      if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
        return false;
      }
    }

    if (maxTokens !== undefined) {
      if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 4000) {
        return false;
      }
    }

    if (model !== undefined) {
      if (typeof model !== 'string' || model.trim().length === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Valida configurações de IA visual
   */
  static validateVisualAISettings(settings: any): boolean {
    if (!settings || typeof settings !== 'object') return true; // Opcional

    const { steps, guidance, seed } = settings;

    if (steps !== undefined) {
      if (typeof steps !== 'number' || steps < 1 || steps > 100) {
        return false;
      }
    }

    if (guidance !== undefined) {
      if (typeof guidance !== 'number' || guidance < 1 || guidance > 20) {
        return false;
      }
    }

    if (seed !== undefined) {
      if (typeof seed !== 'number' || seed < 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitiza entrada de texto removendo caracteres perigosos
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/\s+/g, ' ') // Normaliza espaços
      .substring(0, 1000); // Limita tamanho
  }

  /**
   * Valida se um objeto tem as propriedades obrigatórias
   */
  static hasRequiredProperties<T>(obj: any, requiredProps: (keyof T)[]): obj is T {
    if (!obj || typeof obj !== 'object') return false;
    
    return requiredProps.every(prop => prop in obj && obj[prop] !== undefined);
  }
}