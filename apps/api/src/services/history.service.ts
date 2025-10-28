import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PostContent, PostSettings, AIProvider } from '@nottu/core';

export interface PostHistoryItem {
  id: string;
  userId?: string;
  content: PostContent;
  settings: PostSettings;
  imageUrl?: string;
  imageData?: Buffer;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  aiProvider: AIProvider;
  visualAiProvider?: 'dalle' | 'flux' | 'leonardo';
  generationTime?: number;
  error?: string;
  metadata: {
    platform: string;
    tone: string;
    contentType?: string;
    language?: string;
    targetAudience?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryFilters {
  status?: 'pending' | 'generating' | 'completed' | 'failed';
  aiProvider?: AIProvider;
  visualAiProvider?: 'dalle' | 'flux' | 'leonardo';
  platform?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface HistoryStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  averageGenerationTime: number;
  mostUsedProvider: AIProvider;
  postsPerPeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  providerStats: Array<{
    provider: AIProvider;
    count: number;
    successRate: number;
  }>;
}

@Injectable()
export class HistoryService {
  private historyStore: Map<string, PostHistoryItem> = new Map();
  private userHistoryIndex: Map<string, Set<string>> = new Map();

  async getHistory(
    userId?: string,
    page: number = 1,
    limit: number = 20,
    filters?: HistoryFilters,
  ): Promise<{
    items: PostHistoryItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const userKey = userId || 'default';
      const userPostIds = this.userHistoryIndex.get(userKey) || new Set();
      
      let posts = Array.from(userPostIds)
        .map(id => this.historyStore.get(id))
        .filter((post): post is PostHistoryItem => post !== undefined);

      // Apply filters
      if (filters) {
        posts = this.applyFilters(posts, filters);
      }

      // Sort by creation date (newest first)
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Pagination
      const total = posts.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const items = posts.slice(startIndex, endIndex);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting history:', error);
      throw new InternalServerErrorException('Failed to retrieve history');
    }
  }

  async getPostById(id: string, userId?: string): Promise<PostHistoryItem> {
    try {
      const post = this.historyStore.get(id);
      
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if user has access to this post
      const userKey = userId || 'default';
      const userPostIds = this.userHistoryIndex.get(userKey) || new Set();
      
      if (!userPostIds.has(id)) {
        throw new NotFoundException('Post not found');
      }

      return post;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting post by ID:', error);
      throw new InternalServerErrorException('Failed to retrieve post');
    }
  }

  async addPost(post: Omit<PostHistoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<PostHistoryItem> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const newPost: PostHistoryItem = {
        ...post,
        id,
        createdAt: now,
        updatedAt: now,
      };

      this.historyStore.set(id, newPost);

      // Update user index
      const userKey = post.userId || 'default';
      if (!this.userHistoryIndex.has(userKey)) {
        this.userHistoryIndex.set(userKey, new Set());
      }
      this.userHistoryIndex.get(userKey)!.add(id);

      return newPost;
    } catch (error) {
      console.error('Error adding post:', error);
      throw new InternalServerErrorException('Failed to add post to history');
    }
  }

  async updatePost(id: string, updates: Partial<PostHistoryItem>, userId?: string): Promise<PostHistoryItem> {
    try {
      const existingPost = await this.getPostById(id, userId);
      
      const updatedPost: PostHistoryItem = {
        ...existingPost,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      this.historyStore.set(id, updatedPost);
      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating post:', error);
      throw new InternalServerErrorException('Failed to update post');
    }
  }

  async deletePost(id: string, userId?: string): Promise<void> {
    try {
      // Verify post exists and user has access
      await this.getPostById(id, userId);

      // Remove from store
      this.historyStore.delete(id);

      // Remove from user index
      const userKey = userId || 'default';
      const userPostIds = this.userHistoryIndex.get(userKey);
      if (userPostIds) {
        userPostIds.delete(id);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting post:', error);
      throw new InternalServerErrorException('Failed to delete post');
    }
  }

  async clearHistory(userId?: string, filters?: { status?: string; dateFrom?: Date; dateTo?: Date }): Promise<number> {
    try {
      const userKey = userId || 'default';
      const userPostIds = this.userHistoryIndex.get(userKey) || new Set();
      
      let postsToDelete = Array.from(userPostIds)
        .map(id => this.historyStore.get(id))
        .filter((post): post is PostHistoryItem => post !== undefined);

      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          postsToDelete = postsToDelete.filter(post => post.status === filters.status);
        }
        if (filters.dateFrom) {
          postsToDelete = postsToDelete.filter(post => post.createdAt >= filters.dateFrom!);
        }
        if (filters.dateTo) {
          postsToDelete = postsToDelete.filter(post => post.createdAt <= filters.dateTo!);
        }
      }

      // Delete posts
      let deletedCount = 0;
      for (const post of postsToDelete) {
        this.historyStore.delete(post.id);
        userPostIds.delete(post.id);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Error clearing history:', error);
      throw new InternalServerErrorException('Failed to clear history');
    }
  }

  async getStats(userId?: string): Promise<HistoryStats> {
    try {
      const userKey = userId || 'default';
      const userPostIds = this.userHistoryIndex.get(userKey) || new Set();
      
      const posts = Array.from(userPostIds)
        .map(id => this.historyStore.get(id))
        .filter((post): post is PostHistoryItem => post !== undefined);

      const total = posts.length;
      const successful = posts.filter(p => p.status === 'completed').length;
      const failed = posts.filter(p => p.status === 'failed').length;
      const pending = posts.filter(p => p.status === 'pending' || p.status === 'generating').length;

      // Calculate average generation time
      const completedPosts = posts.filter(p => p.status === 'completed' && p.generationTime);
      const averageGenerationTime = completedPosts.length > 0
        ? completedPosts.reduce((sum, p) => sum + (p.generationTime || 0), 0) / completedPosts.length
        : 0;

      // Find most used provider
      const providerCounts = posts.reduce((acc, post) => {
        acc[post.aiProvider] = (acc[post.aiProvider] || 0) + 1;
        return acc;
      }, {} as Record<AIProvider, number>);

      const mostUsedProvider = (Object.entries(providerCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] as AIProvider) || AIProvider.OPENAI;

      // Calculate posts per period
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const postsPerPeriod = {
        today: posts.filter(p => p.createdAt >= today).length,
        thisWeek: posts.filter(p => p.createdAt >= thisWeek).length,
        thisMonth: posts.filter(p => p.createdAt >= thisMonth).length,
      };

      // Calculate provider stats
      const providerStats = Object.entries(providerCounts).map(([provider, count]) => {
        const providerPosts = posts.filter(p => p.aiProvider === provider);
        const successfulCount = providerPosts.filter(p => p.status === 'completed').length;
        const successRate = count > 0 ? (successfulCount / count) * 100 : 0;

        return {
          provider: provider as AIProvider,
          count,
          successRate,
        };
      });

      return {
        total,
        successful,
        failed,
        pending,
        averageGenerationTime,
        mostUsedProvider,
        postsPerPeriod,
        providerStats,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw new InternalServerErrorException('Failed to retrieve statistics');
    }
  }

  async exportHistory(options: {
    userId?: string;
    format: 'csv' | 'json';
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const { userId, format } = options;
      const { items } = await this.getHistory(userId, 1, 1000);

      // Apply optional filters
      const filtered = this.applyFilters(items, {
        status: options.status as any,
        dateFrom: options.startDate,
        dateTo: options.endDate,
      });

      let content: string;
      let mime: string;
      let filename: string;

      if (format === 'csv') {
        content = this.exportToCsv(filtered);
        mime = 'text/csv';
        filename = `history-${new Date().toISOString().slice(0,10)}.csv`;
      } else {
        content = JSON.stringify(filtered, null, 2);
        mime = 'application/json';
        filename = `history-${new Date().toISOString().slice(0,10)}.json`;
      }

      const base64 = Buffer.from(content, 'utf-8').toString('base64');
      const downloadUrl = `data:${mime};base64,${base64}`;

      return { downloadUrl, filename };
    } catch (error) {
      console.error('Error exporting history:', error);
      throw new InternalServerErrorException('Failed to export history');
    }
  }

  private applyFilters(posts: PostHistoryItem[], filters: HistoryFilters): PostHistoryItem[] {
    let filtered = posts;

    if (filters.status) {
      filtered = filtered.filter(post => post.status === filters.status);
    }

    if (filters.aiProvider) {
      filtered = filtered.filter(post => post.aiProvider === filters.aiProvider);
    }

    if (filters.visualAiProvider) {
      filtered = filtered.filter(post => post.visualAiProvider === filters.visualAiProvider);
    }

    if (filters.platform) {
      filtered = filtered.filter(post => post.metadata.platform === filters.platform);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(post => post.createdAt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(post => post.createdAt <= filters.dateTo!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post =>
        (post.content.caption || '').toLowerCase().includes(searchLower) ||
        post.content.hashtags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (post.metadata.platform || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  private exportToCsv(posts: PostHistoryItem[]): string {
    const headers = [
      'ID',
      'Status',
      'AI Provider',
      'Visual AI Provider',
      'Platform',
      'Tone',
      'Caption',
      'Hashtags',
      'Generation Time',
      'Created At',
      'Updated At',
    ];

    const rows = posts.map(post => [
      post.id,
      post.status,
      post.aiProvider,
      post.visualAiProvider || '',
      post.metadata.platform,
      post.metadata.tone,
      `"${(post.content.caption || '').replace(/"/g, '""')}"`, // Escape quotes
      `"${post.content.hashtags.join(', ')}"`,
      post.generationTime || '',
      post.createdAt.toISOString(),
      post.updatedAt.toISOString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generateId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}