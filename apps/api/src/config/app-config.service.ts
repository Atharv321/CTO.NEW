import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get corsOrigin(): string | string[] {
    const origin = process.env.CORS_ORIGIN;
    if (!origin) return '*';
    try {
      return JSON.parse(origin);
    } catch {
      return origin;
    }
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL || 'postgresql://localhost:5432/mydb';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'default-secret-change-in-production';
  }

  get jwtExpirationTime(): string {
    return process.env.JWT_EXPIRATION_TIME || '1h';
  }

  get redisUrl(): string {
    return process.env.REDIS_URL || 'redis://localhost:6379';
  }

  get logLevel(): string {
    return process.env.LOG_LEVEL || 'info';
  }
}