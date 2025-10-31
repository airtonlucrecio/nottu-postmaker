import { Controller, Get } from '@nestjs/common';
import { HistoryService } from '../services/history.service';

@Controller('history')
export class HistoryController {
  private historyService: HistoryService;

  constructor() {
    this.historyService = new HistoryService();
    console.log('HistoryController initialized with manual HistoryService instance');
  }

  @Get()
  async list() {
    console.log('HistoryController.list called');
    return this.historyService.list();
  }
}
