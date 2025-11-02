import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { promises as fs } from 'fs';
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
        jobId: result.id,
        data: {
          id: result.id,
          jobId: result.id,
          status: 'completed',
          topic: result.topic,
          caption: result.caption,
          hashtags: result.hashtags,
          imagePrompt: result.imagePrompt,
          provider: result.provider,
          image: result.imageUrl
            ? {
                url: result.imageUrl,
                revisedPrompt: result.imageRevisedPrompt,
                model: result.imageModel,
                metadata: result.imageMetadata,
              }
            : undefined,
          folder: result.folder,
          folderFs: result.folderFs,
          assets: result.assets,
          fsAssets: result.fsAssets,
          publicAssets: result.publicAssets,
          textMetadata: result.textMetadata,
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

  @Get('status/:id')
  async getStatus(@Param('id') id: string) {
    const entry = await this.historyService.findById(id);
    if (!entry) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    let metadata = entry.metadata;
    if (!metadata && entry.fsAssets?.metadataPath) {
      try {
        const raw = await fs.readFile(entry.fsAssets.metadataPath, 'utf-8');
        metadata = JSON.parse(raw);
      } catch (error) {
        metadata = undefined;
      }
    }

    const publicAssets = entry.publicAssets || metadata?.output?.public;

    return {
      id,
      status: 'completed',
      progress: {
        percentage: 100,
        step: 'completed',
        message: 'Generation finished',
      },
      result: {
        caption: entry.caption,
        hashtags: entry.hashtags,
        assets: entry.assets,
        folder: entry.folder,
        folderFs: entry.folderFs,
        fsAssets: entry.fsAssets,
        publicAssets,
        metadata,
      },
      timestamps: {
        created: metadata?.requestedAt || entry.createdAt,
        started: metadata?.startedAt || metadata?.timings?.startedAt,
        completed:
          metadata?.completedAt || metadata?.timings?.completedAt || entry.createdAt,
      },
    };
  }
}

