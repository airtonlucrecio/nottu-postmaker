import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HistoryService } from '../services/history.service';
import { HistoryEntryDto } from '../dto/history-entry.dto';

@ApiTags('history')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('test')
  @ApiOperation({
    summary: 'Testar HistoryController',
    description: 'Endpoint de teste para verificar se o HistoryController está funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do controller retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'HistoryController is working' },
        hasService: { type: 'boolean', example: true }
      }
    }
  })
  async test() {
    return { message: 'HistoryController is working', hasService: !!this.historyService };
  }

  @Get()
  @ApiOperation({
    summary: 'Listar histórico de posts',
    description: 'Retorna todos os posts gerados anteriormente',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts do histórico retornada com sucesso',
    type: [HistoryEntryDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'HistoryService is not injected' },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async list() {
    if (!this.historyService) {
      throw new Error('HistoryService is not injected');
    }
    return this.historyService.list();
  }
}
