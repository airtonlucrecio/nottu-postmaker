import axios, { AxiosInstance, AxiosError } from 'axios';

export interface GeneratePostRequest {
  topic: string;
  includeImage?: boolean;
  imageProvider?: 'dalle';
}

export interface JobStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: {
    percentage: number;
    step: string;
    message: string;
  };
  data?: any;
  result?: {
    caption: string;
    hashtags: string[];
    assets?: {
      finalPath?: string;
      captionPath?: string;
      hashtagsPath?: string;
      metadataPath?: string;
    };
    folder: string;
    folderFs: string;
    fsAssets?: {
      finalPath: string;
      captionPath: string;
      hashtagsPath: string;
      metadataPath: string;
    };
    metadata: any;
  };
  timestamps: {
    created: string;
    started?: string;
    completed?: string;
  };
  error?: string;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3001';
    const apiKey = import.meta.env.VITE_API_KEY || 'dev-api-key-nottu-2024';
    
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );
  }

  // History endpoints
  async getHistory() {
    const response = await this.client.get('/api/history');
    return response.data;
  }

  // Settings endpoints
  async getSettings() {
    const response = await this.client.get('/api/settings');
    return response.data;
  }

  async updateSettings(settings: any) {
    const response = await this.client.post('/api/settings', settings);
    return response.data;
  }

  // Generate endpoints
  async generatePost(request: GeneratePostRequest) {
    const response = await this.client.post('/api/generate', request);
    return response.data;
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await this.client.get(`/api/generate/status/${jobId}`);
    return response.data;
  }

  // Polling method for job status
  async pollJobStatus(
    jobId: string, 
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (status: JobStatus) => void;
    } = {}
  ): Promise<JobStatus> {
    const { maxAttempts = 60, intervalMs = 2000, onProgress } = options;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getJobStatus(jobId);
        
        if (onProgress) {
          onProgress(status);
        }
        
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    throw new Error(`Job ${jobId} did not complete within ${maxAttempts} attempts`);
  }
}

export const apiService = new ApiService();