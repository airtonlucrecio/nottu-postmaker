import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Inject,
} from '@nestjs/common';
import { HistoryService } from '../services/history.service';
import { LocalQueueService } from '../services/local-queue.service';
import { GenerateRequestDto } from '../dto/generate-request.dto';

@Controller('generate')
export class GenerateController {
  constructor(
    @Inject(HistoryService) private readonly historyService: HistoryService,
    @Inject(LocalQueueService) private readonly localQueueService: LocalQueueService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async enqueue(@Body() body: GenerateRequestDto) {
    if (!body.topic || body.topic.trim().length === 0) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }

    const includeImage = body.includeImage ?? true;
    const imageProvider = body.imageProvider;

    // Use LocalQueueService to add job to real queue
    const jobId = await this.localQueueService.addPostGenerationJob({
      topic: body.topic.trim(),
      includeImage,
      imageProvider,
    });

    return { jobId };
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    if (!jobId) {
      throw new HttpException('Job ID is required', HttpStatus.BAD_REQUEST);
    }

    const job = await this.localQueueService.getJobStatus(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    return job;
  }

}

