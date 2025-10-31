import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SettingsDto, SettingsResponseDto } from '../dto/settings.dto';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  @Get()
  @ApiOperation({
    summary: 'Obter configurações',
    description: 'Retorna as configurações atuais do sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações retornadas com sucesso',
    type: SettingsResponseDto,
  })
  async get() {
    return { 
      message: 'Settings endpoint working!',
      timestamp: new Date().toISOString(),
      colors: {
        primary: '#4E3FE2',
        secondary: '#0A0A0F',
        accent: '#8B5CF6',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      logoPath: '',
      layoutPresets: [],
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Atualizar configurações',
    description: 'Atualiza as configurações do sistema',
  })
  @ApiBody({
    type: SettingsDto,
    description: 'Novas configurações',
    examples: {
      'colors-update': {
        summary: 'Atualizar cores',
        description: 'Exemplo de atualização das cores do sistema',
        value: {
          colors: {
            primary: '#FF6B6B',
            secondary: '#4ECDC4',
            accent: '#45B7D1'
          }
        }
      },
      'fonts-update': {
        summary: 'Atualizar fontes',
        description: 'Exemplo de atualização das fontes do sistema',
        value: {
          fonts: {
            heading: 'Roboto',
            body: 'Open Sans'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações atualizadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Settings update endpoint working!' },
        receivedData: { type: 'object' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' }
      }
    }
  })
  async update(@Body() payload: SettingsDto) {
    return { 
      message: 'Settings update endpoint working!',
      receivedData: payload,
      timestamp: new Date().toISOString() 
    };
  }
}
