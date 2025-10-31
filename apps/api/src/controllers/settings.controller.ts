import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('settings')
export class SettingsController {
  @Get()
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
  async update(@Body() payload: any) {
    return { 
      message: 'Settings update endpoint working!',
      receivedData: payload,
      timestamp: new Date().toISOString() 
    };
  }
}
