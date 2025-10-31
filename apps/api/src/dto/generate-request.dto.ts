import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class GenerateRequestDto {
  @ApiProperty({
    description: 'Tópico ou tema para gerar o post',
    example: 'receita de bolo de chocolate',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: 'Se deve incluir imagem no post',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeImage?: boolean;

  @ApiProperty({
    description: 'Provedor de IA para geração de imagem',
    example: 'dalle',
    enum: ['dalle', 'flux', 'leonardo', 'sdxl_local'],
    default: 'dalle',
    required: false,
  })
  @IsOptional()
  @IsIn(['dalle', 'flux', 'leonardo', 'sdxl_local'])
  imageProvider?: 'dalle' | 'flux' | 'leonardo' | 'sdxl_local';
}