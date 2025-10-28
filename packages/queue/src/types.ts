// Remove the import from @nottu/core for now to fix build issues

export interface PostGenerationJobData {
  id: string;
  userId?: string;
  request: any; // GeneratePostDto
  settings: any; // PostSettings
  options?: {
    includeImage?: boolean;
    visualAiProvider?: 'dalle' | 'flux' | 'leonardo';
    renderOptions?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'png' | 'jpg' | 'webp';
    };
    priority?: 'low' | 'normal' | 'high';
    retryAttempts?: number;
  };
}

export interface PostGenerationResult {
  id: string;
  success: boolean;
  content?: any;
  imageUrl?: string;
  metadata?: {
    generatedAt: Date;
    provider: string;
    processingTime: number;
  };
  error?: string;
}

export interface BatchGenerationJobData {
  batchId: string;
  userId?: string;
  requests: any[];
  settings: any;
  options?: {
    maxConcurrent?: number;
    includeImages?: boolean;
    visualAiProvider?: 'dalle' | 'flux' | 'leonardo';
    renderOptions?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'png' | 'jpg' | 'webp';
    };
    priority?: 'low' | 'normal' | 'high';
    retryAttempts?: number;
  };
}

export interface BatchGenerationResult {
  batchId: string;
  success: boolean;
  results: PostGenerationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  metadata: {
    generatedAt: Date;
    processingTime: number;
  };
  error?: string;
}

export interface ImageGenerationJobData {
  id: string;
  userId?: string;
  prompt: string;
  provider: 'dalle' | 'flux' | 'leonardo';
  options?: {
    width?: number;
    height?: number;
    quality?: string;
    style?: string;
  };
}

export interface ImageGenerationResult {
  id: string;
  success: boolean;
  imageUrl?: string;
  imageData?: Buffer;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    provider: string;
    generatedAt: Date;
    processingTime: number;
  };
  error?: string;
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    retryDelayOnFailover?: number;
  };
  concurrency: {
    postGeneration: number;
    imageGeneration: number;
    batchGeneration: number;
  };
  removeOnComplete: number;
  removeOnFail: number;
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: 'exponential';
      delay: number;
    };
  };
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
  STUCK = 'stuck'
}

export interface JobProgress {
  step: string;
  progress: number; // 0-100
  message?: string;
  details?: any;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface JobInfo {
  id: string;
  name: string;
  data: any;
  opts: any;
  progress: JobProgress;
  returnvalue?: any;
  failedReason?: string;
  stacktrace?: string[];
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
  attemptsMade: number;
  delay: number;
}