export interface QueueJob {
  id: string;
  name: string;
  data: any;
  opts?: QueueJobOptions;
  progress?: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  stacktrace?: string[];
  returnvalue?: any;
  attemptsMade?: number;
  delay?: number;
  timestamp?: number;
}

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  repeat?: RepeatOptions;
  backoff?: BackoffOptions;
  lifo?: boolean;
  timeout?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

export interface RepeatOptions {
  cron?: string;
  tz?: string;
  startDate?: Date | string | number;
  endDate?: Date | string | number;
  limit?: number;
  every?: number;
  count?: number;
}

export interface BackoffOptions {
  type: 'fixed' | 'exponential';
  delay?: number;
}

export interface PostGenerationJobData {
  postId: string;
  topic: string;
  provider: string;
  template: string;
  settings?: any;
  userId?: string;
}

export interface AITextJobData {
  postId: string;
  topic: string;
  provider: string;
  settings?: any;
}

export interface AIImageJobData {
  postId: string;
  prompt: string;
  provider: string;
  settings?: any;
}

export interface RenderJobData {
  postId: string;
  content: any;
  template: string;
  settings?: any;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueHealth {
  isHealthy: boolean;
  stats: QueueStats;
  workers: number;
  memory: {
    used: number;
    total: number;
  };
  uptime: number;
}

export type QueueJobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
export type QueueJobType = 'post-generation' | 'ai-text' | 'ai-image' | 'render' | 'cleanup';