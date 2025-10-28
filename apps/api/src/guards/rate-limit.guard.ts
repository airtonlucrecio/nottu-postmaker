import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message: string; // Error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const config = this.getRateLimitConfig(request);
    
    if (!config) {
      return true; // No rate limiting configured
    }

    const key = this.generateKey(request);
    const now = Date.now();
    
    let entry = this.rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      this.rateLimitStore.set(key, entry);
      return true;
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: config.message,
          error: 'Too Many Requests',
          retryAfter: resetTimeSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;
    this.rateLimitStore.set(key, entry);
    
    return true;
  }

  private getRateLimitConfig(request: Request): RateLimitConfig | null {
    const path = request.route?.path || request.path;
    const method = request.method;

    // Different rate limits for different endpoints
    if (path.includes('/api/generate')) {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: parseInt(this.configService.get('RATE_LIMIT_GENERATE_MAX', '10')),
        message: 'Too many generation requests. Please try again later.',
      };
    }

    if (path.includes('/api/history')) {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: parseInt(this.configService.get('RATE_LIMIT_HISTORY_MAX', '30')),
        message: 'Too many history requests. Please try again later.',
      };
    }

    if (path.includes('/api/settings')) {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: parseInt(this.configService.get('RATE_LIMIT_SETTINGS_MAX', '20')),
        message: 'Too many settings requests. Please try again later.',
      };
    }

    // Default rate limit for all other endpoints
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: parseInt(this.configService.get('RATE_LIMIT_DEFAULT_MAX', '60')),
      message: 'Too many requests. Please try again later.',
    };
  }

  private generateKey(request: Request): string {
    // Use API key if available, otherwise fall back to IP
    const apiKey = this.extractApiKey(request);
    if (apiKey) {
      return `api_key:${apiKey}`;
    }

    // Use IP address
    const ip = this.getClientIp(request);
    return `ip:${ip}`;
  }

  private extractApiKey(request: Request): string | undefined {
    // Check Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
      return apiKeyHeader;
    }

    // Check query parameter
    const apiKeyQuery = request.query.apiKey;
    if (apiKeyQuery && typeof apiKeyQuery === 'string') {
      return apiKeyQuery;
    }

    return undefined;
  }

  private getClientIp(request: Request): string {
    // Check various headers for the real IP
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') {
      return realIp;
    }

    const clientIp = request.headers['x-client-ip'];
    if (clientIp && typeof clientIp === 'string') {
      return clientIp;
    }

    // Fallback to connection remote address
    return request.connection.remoteAddress || request.ip || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.rateLimitStore.delete(key);
    }
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}