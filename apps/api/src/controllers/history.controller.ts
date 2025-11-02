import { Controller, Get, Delete, Param, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { HistoryService } from '../services/history.service';

@Controller('history')
export class HistoryController {
  constructor(
    @Inject(HistoryService) private readonly historyService: HistoryService,
  ) {}

  @Get()
  async getHistory() {
    try {
      const history = await this.historyService.getHistory();
      return {
        success: true,
        data: history,
        total: history.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteHistoryEntry(@Param('id') id: string) {
    try {
      const success = await this.historyService.deleteEntry(id);
      
      if (!success) {
        throw new HttpException('Entry not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        message: 'Entry deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to delete entry',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
