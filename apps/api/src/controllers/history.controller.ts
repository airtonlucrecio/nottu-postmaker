import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { PostListDto, PostResponseDto, ValidationUtils, PostStatus } from '@nottu/core';
import { HistoryService } from '../services/history.service';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Controller('api/history')
@UseGuards(ApiKeyGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('aiProvider') aiProvider?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Req() request?: Request,
  ): Promise<PostListDto> {
    try {
      // Extract user info
      const userId = request ? this.extractUserId(request) : undefined;
      const sessionId = request ? this.extractSessionId(request) : undefined;

      // Validate and parse query parameters
      const filters = this.parseHistoryFilters({
        page,
        limit,
        status,
        aiProvider,
        startDate,
        endDate,
        search,
      });

      // Get history from service (adjusted signature)
      const history = await this.historyService.getHistory(
        userId,
        filters.page,
        filters.limit,
        {
          status: filters.status as any,
          aiProvider: undefined as any,
          dateFrom: filters.startDate,
          dateTo: filters.endDate,
          search: filters.search,
        },
      );

      const posts = history.items.map(item => ({
        id: item.id,
        topic: item.content.caption?.slice(0, 60) || '',
        title: undefined,
        caption: item.content.caption || '',
        hashtags: item.content.hashtags || [],
        imageUrl: item.imageUrl,
        status: this.mapStatus(item.status),
        createdAt: item.createdAt,
      }));

      return {
        posts,
        total: history.total,
        page: history.page,
        limit: history.limit,
        hasNext: history.page < history.totalPages,
        hasPrev: history.page > 1,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error getting history:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve history. Please try again.',
      );
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPostById(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<PostResponseDto> {
    try {
      // Validate ID
      if (!id || typeof id !== 'string') {
        throw new BadRequestException('Post ID is required');
      }

      // Extract user info
      const userId = this.extractUserId(request);

      // Get post from service
      const post = await this.historyService.getPostById(id, userId);

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      return {
        id: post.id,
        imageUrl: post.imageUrl || '',
        imagePath: '',
        caption: post.content.caption || '',
        hashtags: post.content.hashtags || [],
        folder: post.settings?.outputPath || '',
        status: this.mapStatus(post.status),
        createdAt: post.createdAt,
        metadata: {
          aiProvider: post.aiProvider as any,
          renderEngine: 'satori',
          imagePrompt: post.content.visualPrompt || '',
          gptResponse: undefined,
          timestamp: new Date().toISOString(),
          template: '',
        },
      } as PostResponseDto;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error getting post by ID:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve post. Please try again.',
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<void> {
    try {
      // Validate ID
      if (!id || typeof id !== 'string') {
        throw new BadRequestException('Post ID is required');
      }

      // Extract user info
      const userId = this.extractUserId(request);

      // Delete post
      await this.historyService.deletePost(id, userId);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error deleting post:', error);
      throw new InternalServerErrorException(
        'Failed to delete post. Please try again.',
      );
    }
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearHistory(
    @Query('olderThan') olderThan?: string,
    @Query('status') status?: string,
    @Req() request?: Request,
  ): Promise<void> {
    try {
      // Extract user info
      const userId = request ? this.extractUserId(request) : undefined;

      // Parse filters
      const filters: {
        olderThan?: Date;
        status?: string;
      } = {};

      if (olderThan) {
        const date = new Date(olderThan);
        if (isNaN(date.getTime())) {
          throw new BadRequestException('Invalid olderThan date format');
        }
        filters.olderThan = date;
      }

      if (status) {
        if (!ValidationUtils.isValidPostStatus(status)) {
          throw new BadRequestException('Invalid status');
        }
        filters.status = status;
      }

      // Clear history
      await this.historyService.clearHistory(userId, {
        status: filters.status,
        dateTo: filters.olderThan,
      } as any);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error clearing history:', error);
      throw new InternalServerErrorException(
        'Failed to clear history. Please try again.',
      );
    }
  }

  @Get('stats/summary')
  @HttpCode(HttpStatus.OK)
  async getHistoryStats(
    @Query('period') period?: string,
    @Req() request?: Request,
  ): Promise<{
    totalPosts: number;
    successfulPosts: number;
    failedPosts: number;
    averageGenerationTime: number;
    mostUsedProvider: string;
    postsThisPeriod: number;
    periodLabel: string;
  }> {
    try {
      // Extract user info
      const userId = request ? this.extractUserId(request) : undefined;

      // Validate period
      const validPeriods = ['day', 'week', 'month', 'year'];
      const selectedPeriod = period && validPeriods.includes(period) ? period : 'month';

      // Get stats from service and adapt to summary
      const stats = await this.historyService.getStats(userId);

      const postsThisPeriod = selectedPeriod === 'day'
        ? stats.postsPerPeriod.today
        : selectedPeriod === 'week'
        ? stats.postsPerPeriod.thisWeek
        : stats.postsPerPeriod.thisMonth;

      return {
        totalPosts: stats.total,
        successfulPosts: stats.successful,
        failedPosts: stats.failed,
        averageGenerationTime: stats.averageGenerationTime,
        mostUsedProvider: String(stats.mostUsedProvider),
        postsThisPeriod,
        periodLabel: selectedPeriod,
      };
    } catch (error) {
      console.error('Error getting history stats:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve history statistics. Please try again.',
      );
    }
  }

  @Get('export/csv')
  @HttpCode(HttpStatus.OK)
  async exportHistoryCSV(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Req() request?: Request,
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      // Extract user info
      const userId = request ? this.extractUserId(request) : undefined;

      // Parse date filters
      const filters: {
        startDate?: Date;
        endDate?: Date;
        status?: string;
      } = {};

      if (startDate) {
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          throw new BadRequestException('Invalid startDate format');
        }
        filters.startDate = date;
      }

      if (endDate) {
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          throw new BadRequestException('Invalid endDate format');
        }
        filters.endDate = date;
      }

      if (status && !ValidationUtils.isValidPostStatus(status)) {
        throw new BadRequestException('Invalid status');
      }

      // Export history
      const exportResult = await this.historyService.exportHistory({
        userId,
        format: 'csv',
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
      });

      return exportResult;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error exporting history:', error);
      throw new InternalServerErrorException(
        'Failed to export history. Please try again.',
      );
    }
  }

  @Get('export/json')
  @HttpCode(HttpStatus.OK)
  async exportHistoryJSON(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Req() request?: Request,
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      // Extract user info
      const userId = request ? this.extractUserId(request) : undefined;

      // Parse date filters (same logic as CSV export)
      const filters: {
        startDate?: Date;
        endDate?: Date;
        status?: string;
      } = {};

      if (startDate) {
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          throw new BadRequestException('Invalid startDate format');
        }
        filters.startDate = date;
      }

      if (endDate) {
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          throw new BadRequestException('Invalid endDate format');
        }
        filters.endDate = date;
      }

      if (status && !ValidationUtils.isValidPostStatus(status)) {
        throw new BadRequestException('Invalid status');
      }

      // Export history
      const exportResult = await this.historyService.exportHistory({
        userId,
        format: 'json',
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
      });

      return exportResult;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error exporting history:', error);
      throw new InternalServerErrorException(
        'Failed to export history. Please try again.',
      );
    }
  }

  private parseHistoryFilters(query: {
    page?: string;
    limit?: string;
    status?: string;
    aiProvider?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): {
    page: number;
    limit: number;
    status?: string;
    aiProvider?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  } {
    const filters: any = {};

    // Parse page
    if (query.page) {
      const page = parseInt(query.page, 10);
      if (isNaN(page) || page < 1) {
        throw new BadRequestException('Page must be a positive integer');
      }
      filters.page = page;
    } else {
      filters.page = 1;
    }

    // Parse limit
    if (query.limit) {
      const limit = parseInt(query.limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }
      filters.limit = limit;
    } else {
      filters.limit = 20;
    }

    // Validate status
    if (query.status) {
      if (!ValidationUtils.isValidPostStatus(query.status)) {
        throw new BadRequestException('Invalid status');
      }
      filters.status = query.status;
    }

    // Validate AI provider
    if (query.aiProvider) {
      if (!ValidationUtils.isValidAIProvider(query.aiProvider)) {
        throw new BadRequestException('Invalid AI provider');
      }
      filters.aiProvider = query.aiProvider;
    }

    // Parse dates
    if (query.startDate) {
      const date = new Date(query.startDate);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid startDate format');
      }
      filters.startDate = date;
    }

    if (query.endDate) {
      const date = new Date(query.endDate);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid endDate format');
      }
      filters.endDate = date;
    }

    // Validate date range
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    // Validate search
    if (query.search) {
      if (query.search.length > 100) {
        throw new BadRequestException('Search query cannot exceed 100 characters');
      }
      filters.search = query.search.trim();
    }

    return filters;
  }

  private mapStatus(status: 'pending' | 'generating' | 'completed' | 'failed'): PostStatus {
    switch (status) {
      case 'pending':
        return PostStatus.PENDING;
      case 'generating':
        return PostStatus.PROCESSING;
      case 'completed':
        return PostStatus.COMPLETED;
      case 'failed':
      default:
        return PostStatus.FAILED;
    }
  }

  private extractUserId(request: Request): string | undefined {
    // Extract user ID from JWT token, session, or API key
    return request.headers['x-user-id'] as string;
  }

  private extractSessionId(request: Request): string {
    // Extract or generate session ID
    return request.headers['x-session-id'] as string || 
           request.ip + '-' + Date.now().toString();
  }
}