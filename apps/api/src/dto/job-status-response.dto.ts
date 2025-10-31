import { ApiProperty } from '@nestjs/swagger';
import { AssetsDto } from './history-entry.dto';

export class JobStatusResponseDto {
  @ApiProperty({
    description: 'ID único do job',
    example: '134e5974-7320-40f0-bfa8-5600aa768b4e',
  })
  jobId: string;

  @ApiProperty({
    description: 'Status atual do job',
    example: 'completed',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Tópico original do post',
    example: 'receita de bolo de chocolate',
  })
  topic: string;

  @ApiProperty({
    description: 'Legenda gerada para o post',
    example: '🍫 Bolo de Chocolate Irresistível! 🍰\n\nQuem não ama um bolo de chocolate fofinho e saboroso?',
    required: false,
  })
  caption?: string;

  @ApiProperty({
    description: 'Hashtags geradas para o post',
    example: '#bolodechocolate #receita #doce #sobremesa #chocolate #bolo #cozinha #homemade #delicioso #foodie',
    required: false,
  })
  hashtags?: string;

  @ApiProperty({
    description: 'Caminhos dos arquivos gerados',
    type: AssetsDto,
    required: false,
  })
  assets?: AssetsDto;

  @ApiProperty({
    description: 'Timestamp de criação do job',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Timestamp de conclusão do job',
    example: '2024-01-15T10:35:00.000Z',
    required: false,
  })
  completedAt?: string;

  @ApiProperty({
    description: 'Mensagem de erro se o job falhou',
    example: 'Erro ao gerar imagem',
    required: false,
  })
  error?: string;
}