import puppeteer, { Browser, Page } from 'puppeteer';

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

// Mock theme and logo
const NottuTheme = {
  fonts: {
    families: {
      ui: 'Inter, sans-serif',
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    },
    sizes: {
      'sm': '14px',
      'base': '16px',
      'lg': '18px',
      'xl': '20px',
      '2xl': '24px',
      '3xl': '30px'
    },
    weights: {
      regular: '400',
      medium: '500',
      bold: '700'
    }
  },
  colors: {
    dark: {
      950: '#0A0A0F'
    },
    primary: {
      400: '#4E3FE2'
    }
  }
};

const NottuLogo = {
  svg: {
    main: '<svg width="120" height="40" viewBox="0 0 120 40" fill="none"><rect width="120" height="40" rx="8" fill="#4E3FE2"/><text x="60" y="25" text-anchor="middle" fill="white" font-family="Inter" font-size="14" font-weight="600">NOTTU</text></svg>'
  }
};

export interface RenderOptions {
  width: number;
  height: number;
  quality: number;
  format: 'png' | 'jpeg' | 'webp';
  deviceScaleFactor?: number;
}

export class PuppeteerEngine {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async renderPost(
    content: PostContent,
    imageUrl: string,
    settings: PostSettings,
    options: RenderOptions
  ): Promise<Buffer> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set viewport
      await page.setViewport({
        width: options.width,
        height: options.height,
        deviceScaleFactor: options.deviceScaleFactor || 1,
      });

      // Generate HTML content
      const html = this.generateHTML(content, imageUrl, settings, options);
      
      // Set content
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // Take screenshot
      const screenshot = await page.screenshot({
        type: options.format,
        quality: options.format === 'jpeg' ? options.quality : undefined,
        fullPage: false,
        omitBackground: options.format === 'png',
      });

      return screenshot as Buffer;
    } finally {
      await page.close();
    }
  }

  private generateHTML(
    content: PostContent,
    imageUrl: string,
    settings: PostSettings,
    options: RenderOptions
  ): string {
    const { width, height } = options;
    const logoPosition = settings.logoPosition || 'bottom-right';
    const logoSize = 'md';
    
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nottu Post</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;800&family=JetBrains+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          ${this.generateCSS(settings, options)}
        </style>
      </head>
      <body>
        <div class="post-container">
          <!-- Background Image -->
          <div class="background-image">
            <img src="${imageUrl}" alt="Post Background" />
          </div>
          
          <!-- Content Overlay -->
          <div class="content-overlay">
            ${content.title ? `<h1 class="post-title">${content.title}</h1>` : ''}
            
            ${settings.textOverlay ? `
              <div class="text-content">
                <p class="post-caption">${content.caption}</p>
                ${content.hashtags.length > 0 ? `
                  <div class="hashtags">
                    ${content.hashtags.map(tag => `<span class="hashtag">#${tag}</span>`).join(' ')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          <!-- Logo -->
          <div class="logo-container logo-${logoPosition}">
            ${NottuLogo.svg.main}
          </div>
          
          <!-- Brand Gradient Overlay -->
          <div class="brand-overlay"></div>
        </div>
      </body>
      </html>
    `;
  }

  private generateCSS(settings: PostSettings, options: RenderOptions): string {
    const { width, height } = options;
    
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: ${NottuTheme.fonts.families.ui};
        width: ${width}px;
        height: ${height}px;
        overflow: hidden;
        background: ${NottuTheme.colors.dark[950]};
      }
      
      .post-container {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      .background-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
      }
      
      .background-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }
      
      .content-overlay {
        position: relative;
        z-index: 3;
        padding: 40px;
        text-align: center;
        max-width: 80%;
        background: rgba(10, 10, 15, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        border: 1px solid rgba(78, 63, 226, 0.3);
      }
      
      .post-title {
        font-family: ${NottuTheme.fonts.families.heading};
        font-size: ${NottuTheme.fonts.sizes['3xl']};
        font-weight: ${NottuTheme.fonts.weights.bold};
        color: #FFFFFF;
        margin-bottom: 20px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        line-height: 1.2;
      }
      
      .text-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .post-caption {
        font-family: ${NottuTheme.fonts.families.ui};
        font-size: ${NottuTheme.fonts.sizes.lg};
        font-weight: ${NottuTheme.fonts.weights.regular};
        color: #FFFFFF;
        line-height: 1.6;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
      
      .hashtags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-top: 16px;
      }
      
      .hashtag {
        font-family: ${NottuTheme.fonts.families.body};
        font-size: ${NottuTheme.fonts.sizes.sm};
        font-weight: ${NottuTheme.fonts.weights.medium};
        color: ${NottuTheme.colors.primary[400]};
        background: rgba(78, 63, 226, 0.2);
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid rgba(78, 63, 226, 0.3);
      }
      
      .logo-container {
        position: absolute;
        z-index: 4;
        width: 120px;
        height: 40px;
      }
      
      .logo-container svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }
      
      .logo-top-left {
        top: 20px;
        left: 20px;
      }
      
      .logo-top-right {
        top: 20px;
        right: 20px;
      }
      
      .logo-bottom-left {
        bottom: 20px;
        left: 20px;
      }
      
      .logo-bottom-right {
        bottom: 20px;
        right: 20px;
      }
      
      .logo-center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      
      .brand-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          rgba(78, 63, 226, 0.1) 0%,
          rgba(124, 110, 255, 0.05) 50%,
          rgba(78, 63, 226, 0.1) 100%
        );
        z-index: 2;
        pointer-events: none;
      }
      
      /* Responsive adjustments */
      @media (max-width: 600px) {
        .content-overlay {
          padding: 24px;
          max-width: 90%;
        }
        
        .post-title {
          font-size: ${NottuTheme.fonts.sizes['2xl']};
        }
        
        .post-caption {
          font-size: ${NottuTheme.fonts.sizes.base};
        }
        
        .logo-container {
          width: 90px;
          height: 30px;
        }
      }
    `;
  }

  async renderTemplate(
    templateName: string,
    data: Record<string, any>,
    options: RenderOptions
  ): Promise<Buffer> {
    // Implementation for custom templates
    // This would load predefined templates and render with data
    throw new Error('Template rendering not implemented yet');
  }

  async renderCustomHTML(
    html: string,
    options: RenderOptions
  ): Promise<Buffer> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      await page.setViewport({
        width: options.width,
        height: options.height,
        deviceScaleFactor: options.deviceScaleFactor || 2,
      });

      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');

      const screenshot = await page.screenshot({
        type: options.format,
        quality: options.format === 'jpeg' ? options.quality : undefined,
        fullPage: false,
        omitBackground: options.format === 'png',
      });

      return screenshot as Buffer;
    } finally {
      await page.close();
    }
  }
}