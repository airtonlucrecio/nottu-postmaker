import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger documentation (setup BEFORE global prefix)
  try {
    const config = new DocumentBuilder()
      .setTitle('Nottu PostMaker API')
      .setDescription('API para geração de criativos com IA - Nottu Tech\n\nEsta API permite gerar posts para Instagram com legendas, hashtags e imagens usando inteligência artificial.')
      .setVersion('1.0')
      .addTag('generate', 'Geração de posts com IA')
      .addTag('history', 'Histórico de posts gerados')
      .addTag('settings', 'Configurações do sistema')
      .addApiKey({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key para autenticação'
      }, 'api-key')
      .addServer('http://localhost:3001', 'Servidor de desenvolvimento')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('', app, document);
  } catch (err) {
    logger.warn(`Swagger setup skipped: ${(err instanceof Error ? err.message : String(err))}`);
  }

  // Global prefix for API routes (AFTER Swagger setup to exclude Swagger from prefix)
  app.setGlobalPrefix('api', {
    exclude: ['/']
  });

  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Nottu PostMaker API running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}`);
  logger.log(`🔗 API endpoints available at: http://localhost:${port}/api/*`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});