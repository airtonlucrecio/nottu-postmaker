import { useState } from 'react';
import axios from 'axios';

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
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress?: {
    step: string;
    message: string;
    percentage: number;
  };
  result?: {
    id: string;
    content: {
      caption: string;
      hashtags: string[];
    };
    imageUrl?: string;
    renderUrl?: string;
    metadata: any;
  };
  error?: string;
}

export function usePostGeneration() {
  const [isLoading, setIsLoading] = useState(false);

  const generatePost = async (request: GeneratePostRequest): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/generate', request, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY || 'dev-key-123'}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        return response.data.jobId;
      } else {
        throw new Error(response.data.error || 'Erro ao gerar post');
      }
    } catch (error: any) {
      console.error('Erro ao gerar post:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateBatch = async (requests: GeneratePostRequest[]): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/generate/batch', { requests }, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY || 'dev-key-123'}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        return response.data.jobId;
      } else {
        throw new Error(response.data.error || 'Erro ao gerar posts em lote');
      }
    } catch (error: any) {
      console.error('Erro ao gerar posts em lote:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkJobStatus = async (jobId: string): Promise<JobStatus | null> => {
    try {
      const response = await axios.get(`/api/generate/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY || 'dev-key-123'}`
        }
      });

      return response.data;
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
  ): Promise<JobStatus | null> => {
    let attempts = 0;

    const poll = async (): Promise<JobStatus | null> => {
      if (attempts >= maxAttempts) {
        console.error('Timeout ao aguardar geração do post');
        return null;
      }

      const status = await checkJobStatus(jobId);
      if (!status) {
        attempts++;
        setTimeout(poll, interval);
        return null;
      }

      onUpdate(status);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      attempts++;
      setTimeout(poll, interval);
      return null;
    };

    return poll();
  };

  return {
    generatePost,
    generateBatch,
    checkJobStatus,
    pollJobStatus,
    isLoading
  };
}