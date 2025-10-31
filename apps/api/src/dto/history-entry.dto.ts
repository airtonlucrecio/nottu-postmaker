import { ApiProperty } from '@nestjs/swagger';

export class AssetsDto {
  @ApiProperty({
    description: 'Caminho do arquivo final',
    example: 'jobs/134e5974-7320-40f0-bfa8-5600aa768b4e/final.jpg',
    required: false,
  })
  final?: string;

  @ApiProperty({
    description: 'Caminho do arquivo de legenda',
    example: 'jobs/134e5974-7320-40f0-bfa8-5600aa768b4e/caption.txt',
    required: false,
  })
  caption?: string;

  @ApiProperty({
    description: 'Caminho do arquivo de hashtags',
    example: 'jobs/134e5974-7320-40f0-bfa8-5600aa768b4e/hashtags.txt',
    required: false,
  })
  hashtags?: string;

  @ApiProperty({
    description: 'Caminho do arquivo de metadados',
    example: 'jobs/134e5974-7320-40f0-bfa8-5600aa768b4e/metadata.json',
    required: false,
  })
  metadata?: string;
}

export class HistoryEntryDto {
  @ApiProperty({
    description: 'ID único da entrada do histórico',
    example: '134e5974-7320-40f0-bfa8-5600aa768b4e',
  })
  id: string;

  @ApiProperty({
    description: 'Tópico original do post',
    example: 'receita de bolo de chocolate',
  })
  topic: string;

  @ApiProperty({
    description: 'Legenda gerada para o post',
    example: '🍫 Bolo de Chocolate Irresistível! 🍰\n\nQuem não ama um bolo de chocolate fofinho e saboroso?',
  })
  caption: string;

  @ApiProperty({
    description: 'Hashtags geradas para o post',
    example: '#bolodechocolate #receita #doce #sobremesa #chocolate #bolo #cozinha #homemade #delicioso #foodie',
  })
  hashtags: string;

  @ApiProperty({
    description: 'Caminhos dos arquivos gerados',
    type: AssetsDto,
  })
  assets: AssetsDto;

  @ApiProperty({
    description: 'Timestamp de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Timestamp de conclusão',
    example: '2024-01-15T10:35:00.000Z',
  })
  completedAt: string;
}