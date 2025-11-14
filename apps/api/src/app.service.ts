import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'Backend API Service',
      version: '1.0.0',
      description: 'NestJS-based backend API with TypeScript, class-validator, and Swagger',
      endpoints: {
        health: '/api/health',
        docs: '/docs',
        api: '/api',
      },
      timestamp: new Date().toISOString(),
    };
  }
}