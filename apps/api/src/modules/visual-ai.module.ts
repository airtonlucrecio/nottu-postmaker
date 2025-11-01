import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VisualAIService } from '../services/visual-ai.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: VisualAIService,
      useFactory: async (configService: ConfigService) => {
        const service = new VisualAIService(configService);
        // Manually call onModuleInit since useFactory doesn't trigger lifecycle hooks
        await service.onModuleInit();
        return service;
      },
      inject: [ConfigService],
    },
  ],
  exports: [VisualAIService],
})
export class VisualAIModule {}