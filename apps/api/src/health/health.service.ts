import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private configService: ConfigService) {}

  isHealthy(): HealthIndicatorResult {
    return {
      app: {
        status: 'up',
        environment: this.configService.get('NODE_ENV', 'development'),
        version: '1.0.0',
      },
    };
  }

  async checkDatabase(): Promise<HealthIndicatorResult> {
    // Placeholder for database health check
    // Will be implemented with Prisma in a later ticket
    return {
      database: {
        status: 'up',
        message: 'Database connection not yet configured',
      },
    };
  }

  checkMemory(): HealthIndicatorResult {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memoryUsagePercent = (usedMem / totalMem) * 100;

    return {
      memory: {
        status: memoryUsagePercent > 80 ? 'down' : 'up',
        usage: {
          total: `${Math.round(totalMem / 1024 / 1024)}MB`,
          used: `${Math.round(usedMem / 1024 / 1024)}MB`,
          percentage: `${Math.round(memoryUsagePercent)}%`,
        },
      },
    };
  }

  getSimpleHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }
}