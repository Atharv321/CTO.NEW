export const WORKER_CONFIG = {
  port: parseInt(process.env.WORKER_PORT || '3001', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
} as const