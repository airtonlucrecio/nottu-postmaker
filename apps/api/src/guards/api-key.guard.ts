import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (!this.validateApiKey(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
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

  private validateApiKey(apiKey: string): boolean {
    // Get valid API keys from environment
    const validApiKeys = this.getValidApiKeys();
    
    return validApiKeys.includes(apiKey);
  }

  private getValidApiKeys(): string[] {
    // Get API keys from environment variables
    const apiKeysEnv = this.configService.get<string>('API_KEYS');
    
    if (apiKeysEnv) {
      return apiKeysEnv.split(',').map(key => key.trim());
    }

    // Fallback to single API key
    const singleApiKey = this.configService.get<string>('API_KEY');
    if (singleApiKey) {
      return [singleApiKey];
    }

    // Development fallback
    if (process.env.NODE_ENV === 'development') {
      return ['dev-api-key-nottu-2024'];
    }

    return [];
  }
}