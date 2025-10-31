import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  getTest() {
    return { message: 'API is working!', timestamp: new Date().toISOString() };
  }

  @Post()
  postTest(@Body() body: any) {
    return { 
      message: 'POST endpoint is working!', 
      receivedData: body,
      timestamp: new Date().toISOString() 
    };
  }
}