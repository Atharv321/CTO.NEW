import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  
  // Redis configuration for queue
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10)
  },
  
  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@barberbooking.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Barber Booking System'
  },
  
  // Database configuration (mock for now)
  database: {
    url: process.env.DATABASE_URL || 'sqlite:memory:'
  },
  
  // Queue configuration
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  },
  
  // Worker configuration
  worker: {
    pollInterval: parseInt(process.env.WORKER_POLL_INTERVAL || '5000', 10),
    batchSize: parseInt(process.env.WORKER_BATCH_SIZE || '10', 10)
  }
};