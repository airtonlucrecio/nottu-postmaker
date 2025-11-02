import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Inject,
} from '@nestjs/common';
import { HistoryService } from '../services/history.service';
import { GenerationService } from '../services/generation.service';
import { GenerateRequestDto } from '../dto/generate-request.dto';

@Controller('generate')
export class GenerateController {
  constructor(
    @Inject(HistoryService) private readonly historyService: HistoryService,
    @Inject(GenerationService) private readonly generationService: GenerationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async generate(@Body() body: GenerateRequestDto) {
    if (!body.topic || body.topic.trim().length === 0) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }

    const includeImage = body.includeImage ?? true;
    const imageProvider = body.imageProvider;

    try {
      // Chamar o GenerationService diretamente
      const result = await this.generationService.generatePost({
        topic: body.topic.trim(),
        includeImage,
        imageProvider,
      });

      return {
        success: true,
        data: {
          id: result.id,
          topic: result.topic,
          caption: result.caption,
          hashtags: result.hashtags,
          folder: result.folder,
          assets: result.assets,
        },
        metadata: result.metadata,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to generate post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

