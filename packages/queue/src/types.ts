export interface PostGenerationJobData {
  jobId: string;
  topic: string;
  jobId: string;
  topic: string;
  userId?: string;
  includeImage: boolean;
  imageProvider: 'dalle' | 'flux' | 'leonardo' | 'sdxl_local';
  requestedAt: string;
  includeImage: boolean;
  imageProvider: 'dalle' | 'flux' | 'leonardo' | 'sdxl_local';
  requestedAt: string;
}

export interface PostGenerationResult {
  jobId: string;
  status: 'completed' | 'failed';
  caption?: string;
  hashtags?: string[];
  folder?: string;
  folderFs?: string;
  assets?: {
    finalPath: string;
    captionPath: string;
    hashtagsPath: string;
    metadataPath: string;
  };
  fsAssets?: {
    finalPath: string;
    captionPath: string;
    hashtagsPath: string;
    metadataPath: string;
  };
  metadata?: Record<string, any>;
  error?: string;
}

export interface JobProgress {
  step: string;
  percentage: number;
  message?: string;
  details?: Record<string, any>;
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueConfig {
  redis: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    db?: number;
    url?: string;
    tls?: {
      rejectUnauthorized?: boolean;
    };
    maxRetriesPerRequest?: number;
    retryDelayOnFailover?: number;
    retryStrategy?: (times: number) => number | null | undefined;
  };
  concurrency?: {
    postGeneration?: number;
  };
  removeOnComplete?: number | boolean;
  removeOnFail?: number | boolean;
  defaultJobOptions?: {
    removeOnComplete?: number | boolean;
    removeOnFail?: number | boolean;
    attempts?: number;
    backoff?: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
  };
}

export interface PostGenerationHandlerContext {
  job: PostGenerationJobData;
  update(progress: JobProgress): Promise<void>;
}

export type PostGenerationHandler = (
  context: PostGenerationHandlerContext,
) => Promise<PostGenerationResult>;
