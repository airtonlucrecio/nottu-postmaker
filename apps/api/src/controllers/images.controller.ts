import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  ValidationPipe, 
  HttpCode,
  HttpStatus,
  BadRequestException,
  Inject
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VisualAIService } from '../services/visual-ai.service';
import { ConfigService } from '@nestjs/config';

interface GenerateImageDto {
  prompt: string;
  provider?: 'dalle';
  width?: number;
  height?: number;
  quality?: string;
  style?: string;
}

@Controller('images')
export class ImagesController {
  constructor(
    @Inject(VisualAIService) private readonly visualAIService: VisualAIService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateImage(@Body(ValidationPipe) dto: GenerateImageDto) {
    if (!dto.prompt || dto.prompt.trim().length === 0) {
      throw new BadRequestException('Prompt is required');
    }

    const result = await this.visualAIService.generateImage(
      dto.prompt,
      {
        width: dto.width,
        height: dto.height,
        quality: dto.quality,
        style: dto.style,
      }
    );

    return {
      success: true,
      image: {
        url: result.imageUrl,
        prompt: result.prompt,
        revisedPrompt: result.revisedPrompt,
        provider: result.provider,
        model: result.model,
        metadata: result.metadata,
        generationTime: result.generationTime,
      },
    };
  }

  @Get('providers')
  async getProviders() {
    if (!this.visualAIService) {
      // Fallback: create temporary instance
      const tempConfigService = new ConfigService();
      const tempService = new VisualAIService(tempConfigService);
      await tempService.onModuleInit();
      return tempService.getAvailableProviders();
    }

    return this.visualAIService.getAvailableProviders();
  }

  @Get('test')
  test() {
    if (!this.visualAIService) {
      return {
        message: 'ImagesController is working',
        timestamp: new Date().toISOString(),
        serviceInjected: false,
        error: 'VisualAIService not injected',
        availableProviders: 0,
        providers: [],
      };
    }
    
    const providers = this.visualAIService.getAvailableProviders();
    
    return {
      message: 'ImagesController is working',
      timestamp: new Date().toISOString(),
      serviceInjected: !!this.visualAIService,
      availableProviders: providers.length,
      providers: providers,
    };
  }


}