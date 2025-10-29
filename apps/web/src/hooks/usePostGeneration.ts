import { useMemo, useState } from 'react';
import axios, { AxiosInstance } from 'axios';

interface GeneratePostRequest {
  topic: string;
  provider?: string;
  template?: string;
  settings?: {
    includeImage?: boolean;
    imageStyle?: string;
    tone?: string;
    language?: string;
  };
}

interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress?: {
    percentage: number;
    message?: string;
  };
  result?: {
    caption?: string;
    hashtags?: string[];
    assets?: {
      finalPath: string;
      captionPath: string;
      hashtagsPath: string;
      metadataPath: string;
    };
    folder?: string;
    metadata?: Record<string, any>;
  };
  error?: string;
}

interface GenerationResult {
  caption: string;
  hashtags: string[];
  assets: {
    finalPath: string;
    captionPath: string;
    hashtagsPath: string;
    metadataPath: string;
  };
  folder: string;
}

export function usePostGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const client: AxiosInstance = useMemo(() => {
    const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000';
    return axios.create({ baseURL });
  }, []);

  const generatePost = async (request: GeneratePostRequest): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await client.post('/api/generate', request);
      if (response.data?.jobId) {
        return response.data.jobId as string;
      }
      throw new Error('Resposta inválida do servidor');
    } catch (error: any) {
      console.error('Erro ao gerar post:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkJobStatus = async (jobId: string): Promise<JobStatus | null> => {
    try {
      const response = await client.get(`/api/generate/status/${jobId}`);
      const progressData = response.data.progress;
      const progress = typeof progressData === 'object' && progressData !== null
        ? {
            percentage: progressData.percentage ?? 0,
            message: progressData.message,
          }
        : undefined;

      return {
        jobId: response.data.jobId,
        status: response.data.status,
        progress,
        result: response.data.result,
        error: response.data.error,
      };
    } catch (error: any) {
      console.error('Erro ao verificar status do job:', error);
      return null;
    }
  };

  const pollJobStatus = async (
    jobId: string,
    onUpdate: (status: JobStatus) => void,
    maxAttempts: number = 60,
    interval: number = 2000
  ): Promise<GenerationResult | null> => {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await checkJobStatus(jobId);
      if (status) {
        onUpdate(status);
        if (status.status === 'completed' && status.result?.assets && status.result.folder && status.result.caption && status.result.hashtags) {
          return {
            caption: status.result.caption,
            hashtags: status.result.hashtags,
            assets: status.result.assets,
            folder: status.result.folder,
          };
        }

        if (status.status === 'failed') {
          return null;
        }
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    console.error('Timeout ao aguardar geração do post');
    return null;
  };

  return {
    generatePost,
    checkJobStatus,
    pollJobStatus,
    isLoading
  };
}