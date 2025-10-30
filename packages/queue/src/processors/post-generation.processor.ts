import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { JobProgress, PostGenerationHandler, PostGenerationJobData, PostGenerationResult } from '../types';

export class PostGenerationProcessor {
  private readonly logger = new Logger(PostGenerationProcessor.name);

  constructor(private readonly handler: PostGenerationHandler) {}

  async process(job: Job<PostGenerationJobData, PostGenerationResult>): Promise<PostGenerationResult> {
    this.logger.debug(`Starting processing for job ${job.id}`);
    return this.handle({
      job: job.data,
      update: async (progress: JobProgress) => {
        await job.updateProgress(progress);
      },
    });
  }

  async handle(context: { job: PostGenerationJobData; update: (progress: JobProgress) => Promise<void> }): Promise<PostGenerationResult> {
    return this.handler(context);
  }
}
