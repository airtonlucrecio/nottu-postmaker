// Mock types for now
interface PostContent {
  title?: string;
  caption: string;
  hashtags: string[];
}

interface PostSettings {
  logoPosition?: string;
  textOverlay?: boolean;
}

interface PostAssets {
  images: string[];
  videos?: string[];
}

// Mock ValidationUtils
const ValidationUtils = {
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};
import { PuppeteerEngine, RenderOptions } from '../engines/puppeteer-engine';
import { SatoriEngine, SatoriRenderOptions } from '../engines/satori-engine';

export interface ComposerOptions {
  engine: 'puppeteer' | 'satori';
  width: number;
  height: number;
  quality: number;
  format: 'png' | 'jpeg' | 'webp';
  deviceScaleFactor?: number;
  debug?: boolean;
}

export interface CompositionResult {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    engine: string;
    renderTime: number;
  };
}

export class PostComposer {
  private puppeteerEngine: PuppeteerEngine;
  private satoriEngine: SatoriEngine;

  constructor() {
    this.puppeteerEngine = new PuppeteerEngine();
    this.satoriEngine = new SatoriEngine();
  }

  async initialize(): Promise<void> {
    await this.puppeteerEngine.initialize();
    await this.satoriEngine.initialize();
  }

  async compose(
    content: PostContent,
    imageUrl: string,
    settings: PostSettings,
    options: ComposerOptions
  ): Promise<CompositionResult> {
    const startTime = Date.now();

    // Validate inputs
    this.validateInputs(content, imageUrl, settings, options);

    let buffer: Buffer;

    try {
      if (options.engine === 'puppeteer') {
        buffer = await this.renderWithPuppeteer(content, imageUrl, settings, options);
      } else {
        buffer = await this.renderWithSatori(content, imageUrl, settings, options);
      }

      const renderTime = Date.now() - startTime;

      return {
        buffer,
        metadata: {
          width: options.width,
          height: options.height,
          format: options.format,
          size: buffer.length,
          engine: options.engine,
          renderTime,
        },
      };
    } catch (error) {
      throw new Error(`Post composition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async renderWithPuppeteer(
    content: PostContent,
    imageUrl: string,
    settings: PostSettings,
    options: ComposerOptions
  ): Promise<Buffer> {
    const renderOptions: RenderOptions = {
      width: options.width,
      height: options.height,
      quality: options.quality,
      format: options.format,
      deviceScaleFactor: options.deviceScaleFactor,
    };

    return await this.puppeteerEngine.renderPost(content, imageUrl, settings, renderOptions);
  }

  private async renderWithSatori(
    content: PostContent,
    imageUrl: string,
    settings: PostSettings,
    options: ComposerOptions
  ): Promise<Buffer> {
    const renderOptions: Omit<SatoriRenderOptions, 'fonts'> = {
      width: options.width,
      height: options.height,
      debug: options.debug,
    };

    return await this.satoriEngine.renderPost(content, imageUrl, settings, renderOptions);
  }

  async composeFromTemplate(
    templateName: string,
    data: Record<string, any>,
    options: ComposerOptions
  ): Promise<CompositionResult> {
    const startTime = Date.now();

    // Validate template name
    if (!templateName || typeof templateName !== 'string') {
      throw new Error('Template name is required and must be a string');
    }

    let buffer: Buffer;

    try {
      if (options.engine === 'puppeteer') {
        const renderOptions: RenderOptions = {
          width: options.width,
          height: options.height,
          quality: options.quality,
          format: options.format,
          deviceScaleFactor: options.deviceScaleFactor,
        };
        buffer = await this.puppeteerEngine.renderTemplate(templateName, data, renderOptions);
      } else {
        const renderOptions: Omit<SatoriRenderOptions, 'fonts'> = {
          width: options.width,
          height: options.height,
          debug: options.debug,
        };
        buffer = await this.satoriEngine.renderTemplate(templateName, data, renderOptions);
      }

      const renderTime = Date.now() - startTime;

      return {
        buffer,
        metadata: {
          width: options.width,
          height: options.height,
          format: options.format,
          size: buffer.length,
          engine: options.engine,
          renderTime,
        },
      };
    } catch (error) {
      throw new Error(`Template composition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async composeMultiple(
    posts: Array<{
      content: PostContent;
      imageUrl: string;
      settings: PostSettings;
    }>,
    options: ComposerOptions
  ): Promise<CompositionResult[]> {
    const results: CompositionResult[] = [];

    for (const post of posts) {
      try {
        const result = await this.compose(
          post.content,
          post.imageUrl,
          post.settings,
          options
        );
        results.push(result);
      } catch (error) {
        // Log error but continue with other posts
        console.error(`Failed to compose post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // You might want to include failed results with error information
      }
    }

    return results;
  }

  async composeWithVariations(
    content: PostContent,
    imageUrl: string,
    settings: PostSettings,
    baseOptions: ComposerOptions,
    variations: Partial<ComposerOptions>[]
  ): Promise<CompositionResult[]> {
    const results: CompositionResult[] = [];

    for (const variation of variations) {
      const options = { ...baseOptions, ...variation };
      
      try {
        const result = await this.compose(content, imageUrl, settings, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to compose variation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  private validateInputs(
    content: PostContent,
    imageUrl: string,
    settings: PostSettings,
    options: ComposerOptions
  ): void {
    // Validate content
    if (!content) {
      throw new Error('Content is required');
    }

    if (!content.caption || typeof content.caption !== 'string') {
      throw new Error('Content caption is required and must be a string');
    }

    if (!Array.isArray(content.hashtags)) {
      throw new Error('Content hashtags must be an array');
    }

    // Validate image URL
    if (!ValidationUtils.isValidUrl(imageUrl)) {
      throw new Error('Invalid image URL');
    }

    // Validate settings
    if (!settings) {
      throw new Error('Settings are required');
    }

    // Validate options
    if (!options.engine || !['puppeteer', 'satori'].includes(options.engine)) {
      throw new Error('Engine must be either "puppeteer" or "satori"');
    }

    if (!options.width || options.width <= 0) {
      throw new Error('Width must be a positive number');
    }

    if (!options.height || options.height <= 0) {
      throw new Error('Height must be a positive number');
    }

    if (!options.format || !['png', 'jpg', 'webp'].includes(options.format)) {
      throw new Error('Format must be one of: png, jpg, webp');
    }

    if (options.quality !== undefined && (options.quality < 0 || options.quality > 100)) {
      throw new Error('Quality must be between 0 and 100');
    }

    if (options.deviceScaleFactor !== undefined && options.deviceScaleFactor <= 0) {
      throw new Error('Device scale factor must be a positive number');
    }
  }

  async getEngineCapabilities(): Promise<{
    puppeteer: {
      formats: string[];
      maxWidth: number;
      maxHeight: number;
      features: string[];
    };
    satori: {
      formats: string[];
      maxWidth: number;
      maxHeight: number;
      features: string[];
    };
  }> {
    return {
      puppeteer: {
        formats: ['png', 'jpg', 'webp'],
        maxWidth: 4096,
        maxHeight: 4096,
        features: [
          'CSS animations',
          'Web fonts',
          'Complex layouts',
          'Background images',
          'Filters and effects',
          'Custom HTML/CSS',
        ],
      },
      satori: {
        formats: ['png'],
        maxWidth: 2048,
        maxHeight: 2048,
        features: [
          'React JSX',
          'Fast rendering',
          'Flexbox layouts',
          'Custom fonts',
          'Gradients',
          'Templates',
        ],
      },
    };
  }

  async cleanup(): Promise<void> {
    await this.puppeteerEngine.close();
    // Satori engine doesn't need cleanup
  }

  // Utility methods for common post sizes
  static getInstagramSizes(): Record<string, { width: number; height: number }> {
    return {
      square: { width: 1080, height: 1080 },
      portrait: { width: 1080, height: 1350 },
      landscape: { width: 1080, height: 566 },
      story: { width: 1080, height: 1920 },
      reel: { width: 1080, height: 1920 },
    };
  }

  static getTwitterSizes(): Record<string, { width: number; height: number }> {
    return {
      post: { width: 1200, height: 675 },
      header: { width: 1500, height: 500 },
      card: { width: 800, height: 418 },
    };
  }

  static getLinkedInSizes(): Record<string, { width: number; height: number }> {
    return {
      post: { width: 1200, height: 627 },
      article: { width: 1200, height: 627 },
      company: { width: 1536, height: 768 },
    };
  }

  static getOptimalFormat(hasTransparency: boolean, isPhotographic: boolean): 'png' | 'jpeg' | 'webp' {
    if (hasTransparency) return 'png';
    if (isPhotographic) return 'jpeg';
    return 'webp'; // Best compression for most cases
  }

  static getOptimalQuality(format: string, purpose: 'web' | 'print' | 'social'): number {
    const qualityMap = {
      web: { jpeg: 85, webp: 80 },
      print: { jpeg: 95, webp: 90 },
      social: { jpeg: 90, webp: 85 },
    };

    return qualityMap[purpose]?.[format as keyof typeof qualityMap[typeof purpose]] || 85;
  }
}