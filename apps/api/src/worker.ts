import dotenv from 'dotenv';
import { reminderWorker } from './workers/reminder.worker.js';

// Load environment variables
dotenv.config();

console.log('=================================================');
console.log('🚀 Starting Reminder Worker');
console.log('=================================================');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Redis Host: ${process.env.REDIS_HOST || 'localhost'}`);
console.log(`Redis Port: ${process.env.REDIS_PORT || '6379'}`);
console.log('=================================================');

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close the worker
    await reminderWorker.close();
    console.log('✅ Worker closed successfully');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

console.log('✅ Reminder Worker is running and processing jobs...');
console.log('Press CTRL+C to stop\n');
