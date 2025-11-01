import { Module } from '@nestjs/common';
import { ImagesController } from '../controllers/images.controller';
import { VisualAIModule } from './visual-ai.module';

@Module({
  imports: [VisualAIModule],
  controllers: [ImagesController],
})
export class ImagesModule {}