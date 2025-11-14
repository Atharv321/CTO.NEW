import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.healthService.isHealthy(),
      () => this.healthService.checkDatabase(),
      () => this.healthService.checkMemory(),
    ]);
  }

  @Get('simple')
  @ApiOperation({ summary: 'Simple health check' })
  @ApiResponse({ 
    status: 200, 
    description: 'Simple health check response',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-11-14T10:30:00.000Z' },
        uptime: { type: 'number', example: 123.456 },
      },
    },
  })
  getSimpleHealth() {
    return this.healthService.getSimpleHealth();
  }
}