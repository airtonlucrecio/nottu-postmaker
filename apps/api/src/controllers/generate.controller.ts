import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';
import { HistoryService } from '../services/history.service';
import { GenerateRequestDto } from '../dto/generate-request.dto';
import { JobStatusResponseDto } from '../dto/job-status-response.dto';



interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    percentage: number;
    step: string;
    message: string;
  };
  data: {
    jobId: string;
    topic: string;
    includeImage: boolean;
    imageProvider?: string;
    requestedAt: string;
  };
  timestamps: {
    created: Date;
    started?: Date;
    completed?: Date;
  };
  result?: any;
  error?: string;
}

@ApiTags('generate')
@Controller('generate')
export class GenerateController {
  private jobs = new Map<string, Job>();

  constructor(
    private readonly historyService: HistoryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo job de geração de post',
    description: 'Envia um tópico para geração assíncrona de post com legenda, hashtags e imagem opcional',
  })
  @ApiBody({
    type: GenerateRequestDto,
    description: 'Dados para geração do post',
    examples: {
      'receita-bolo': {
        summary: 'Receita de bolo',
        description: 'Exemplo de geração de post sobre receita de bolo de chocolate',
        value: {
          topic: 'receita de bolo de chocolate',
          includeImage: true,
          imageProvider: 'dalle'
        }
      },
      'dica-fitness': {
        summary: 'Dica de fitness',
        description: 'Exemplo de post sobre fitness sem imagem',
        value: {
          topic: 'dicas de exercícios em casa',
          includeImage: false
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Job criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          example: '134e5974-7320-40f0-bfa8-5600aa768b4e',
          description: 'ID único do job criado'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['topic should not be empty'] },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async enqueue(@Body() body: GenerateRequestDto) {
    if (!body.topic || body.topic.trim().length === 0) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }

    const jobId = uuid();
    const includeImage = body.includeImage ?? true;
    const imageProvider = body.imageProvider || 'dalle';

    // Create job
    const job: Job = {
      id: jobId,
      status: 'pending',
      progress: {
        percentage: 0,
        step: 'pending',
        message: 'Job criado'
      },
      data: {
        jobId,
        topic: body.topic.trim(),
        includeImage,
        imageProvider,
        requestedAt: new Date().toISOString(),
      },
      timestamps: {
        created: new Date(),
      },
    };

    this.jobs.set(jobId, job);

    // Process job asynchronously
    this.processJob(jobId).catch(error => {
      // Handle job processing error silently
    });

    return { jobId };
  }

  @Get('status/:jobId')
  @ApiOperation({
    summary: 'Consultar status do job',
    description: 'Retorna o status atual e resultados de um job de geração',
  })
  @ApiParam({
    name: 'jobId',
    description: 'ID único do job',
    example: '134e5974-7320-40f0-bfa8-5600aa768b4e',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Status do job retornado com sucesso',
    type: JobStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job não encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Job not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async getStatus(@Param('jobId') jobId: string) {
    if (!jobId) {
      throw new HttpException('Job ID is required', HttpStatus.BAD_REQUEST);
    }

    const job = this.jobs.get(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    return job;
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.timestamps.started = new Date();
      job.progress = { percentage: 5, step: 'initializing', message: 'Iniciando processamento' };

      // Mock processing since we don't have GenerationService injected
      
      await this.delay(1000);
      job.progress = { percentage: 30, step: 'generating_text', message: 'Gerando texto' };

      await this.delay(2000);
      job.progress = { percentage: 60, step: 'generating_image', message: 'Gerando imagem' };

      await this.delay(2000);
      job.progress = { percentage: 90, step: 'finalizing', message: 'Finalizando' };

      // Mock result
      job.result = {
        caption: `Post sobre: ${job.data.topic}`,
        hashtags: ['#nottu', '#tech', '#inovacao'],
        assets: {
          finalPath: `posts/${jobId}/final.jpg`,
          captionPath: `posts/${jobId}/caption.txt`,
          hashtagsPath: `posts/${jobId}/hashtags.txt`,
          metadataPath: `posts/${jobId}/metadata.json`,
        },
        folder: `posts/${jobId}`,
        folderFs: `storage/posts/${jobId}`,
        fsAssets: {
          finalPath: `storage/posts/${jobId}/final.jpg`,
          captionPath: `storage/posts/${jobId}/caption.txt`,
          hashtagsPath: `storage/posts/${jobId}/hashtags.txt`,
          metadataPath: `storage/posts/${jobId}/metadata.json`,
        },
        metadata: {
          topic: job.data.topic,
          generatedAt: new Date().toISOString(),
        },
      };

      job.status = 'completed';
      job.progress = { percentage: 100, step: 'completed', message: 'Concluído' };
      job.timestamps.completed = new Date();

      // Save to history
      try {
        await this.historyService.append({
          id: jobId,
          topic: job.data.topic,
          caption: job.result.caption,
          hashtags: job.result.hashtags,
          folder: job.result.folder,
          folderFs: job.result.folderFs,
          assets: job.result.assets,
          fsAssets: job.result.fsAssets,
          provider: {
            text: 'openai',
            requestedImage: job.data.imageProvider || 'dalle',
            effectiveImage: job.data.imageProvider || 'dalle',
          },
          createdAt: new Date().toISOString(),
        });
      } catch (historyError) {
        // History save failed, but job completed successfully
      }

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      job.timestamps.completed = new Date();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

