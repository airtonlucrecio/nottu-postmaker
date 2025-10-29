import { Controller, Get } from '@nestjs/common';
import { HistoryService } from '../services/history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async list() {
    return this.historyService.list();
  }
}
