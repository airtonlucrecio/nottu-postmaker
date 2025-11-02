import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001); // coloque 3001 se é o que você usa
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.enableCors({
    origin: [corsOrigin, 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: true,
  });

  // Prefixo global para as rotas da API
  app.setGlobalPrefix('api');

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API rodando: http://localhost:${port}`);
}
bootstrap();