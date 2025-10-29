import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { QueueService } from '@nottu/queue';

interface GenerateRequest {
  topic: string;
  includeImage?: boolean;
  imageProvider?: 'dalle' | 'flux' | 'leonardo' | 'sdxl_local';
}

@Controller('generate')
export class GenerateController {
  constructor(
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async enqueue(@Body() body: GenerateRequest) {
    if (!body.topic || body.topic.trim().length === 0) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }

    const jobId = uuid();
    const includeImage = body.includeImage ?? true;
    const envProvider = this.configService.get<string>('IA_IMAGE_PROVIDER') as GenerateRequest['imageProvider'];
    const imageProvider = body.imageProvider || envProvider || 'dalle';

    const job = await this.queueService.addPostGenerationJob({
      jobId,
      topic: body.topic.trim(),
      includeImage,
      imageProvider: imageProvider || 'dalle',
      requestedAt: new Date().toISOString(),
    });

    return { jobId: job.id };
  }

  @Get('status/:jobId')
  async status(@Param('jobId') jobId: string) {
    const status = await this.queueService.getJobStatus(jobId);
    if (!status) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    const progress = typeof status.progress === 'number'
      ? { percentage: status.progress }
      : status.progress ?? undefined;

    return {
      jobId: status.id,
      status: status.status,
      progress,
      result: status.result
        ? {
            caption: status.result.caption,
            hashtags: status.result.hashtags,
            assets: status.result.assets,
            folder: status.result.folder,
          }
        : undefined,
      error: status.error,
      timestamps: status.timestamps,
    };
  }
}
