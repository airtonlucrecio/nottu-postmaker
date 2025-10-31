import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class ColorsDto {
  @ApiProperty({
    description: 'Cor primária',
    example: '#4E3FE2',
  })
  @IsOptional()
  @IsString()
  primary?: string;

  @ApiProperty({
    description: 'Cor secundária',
    example: '#0A0A0F',
  })
  @IsOptional()
  @IsString()
  secondary?: string;

  @ApiProperty({
    description: 'Cor de destaque',
    example: '#8B5CF6',
  })
  @IsOptional()
  @IsString()
  accent?: string;
}

export class FontsDto {
  @ApiProperty({
    description: 'Fonte para títulos',
    example: 'Inter',
  })
  @IsOptional()
  @IsString()
  heading?: string;

  @ApiProperty({
    description: 'Fonte para corpo do texto',
    example: 'Inter',
  })
  @IsOptional()
  @IsString()
  body?: string;
}

export class SettingsDto {
  @ApiProperty({
    description: 'Configurações de cores',
    type: ColorsDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  colors?: ColorsDto;

  @ApiProperty({
    description: 'Configurações de fontes',
    type: FontsDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  fonts?: FontsDto;

  @ApiProperty({
    description: 'Caminho do logo',
    example: '/assets/logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logoPath?: string;

  @ApiProperty({
    description: 'Presets de layout',
    example: ['modern', 'classic', 'minimal'],
    required: false,
    type: [String],
  })
  @IsOptional()
  layoutPresets?: string[];
}

export class SettingsResponseDto {
  @ApiProperty({
    description: 'Mensagem de status',
    example: 'Settings endpoint working!',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp da resposta',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Configurações de cores',
    type: ColorsDto,
  })
  colors: ColorsDto;

  @ApiProperty({
    description: 'Configurações de fontes',
    type: FontsDto,
  })
  fonts: FontsDto;

  @ApiProperty({
    description: 'Caminho do logo',
    example: '',
  })
  logoPath: string;

  @ApiProperty({
    description: 'Presets de layout',
    example: [],
    type: [String],
  })
  layoutPresets: string[];
}