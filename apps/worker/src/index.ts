import dotenv from 'dotenv'
import { logger } from './services/logger.js'
import { startScheduler } from './services/scheduler.js'

// Load environment variables
dotenv.config()

async function main() {
  try {
    logger.info('Starting worker service...')

    // Start the job scheduler
    await startScheduler()

    logger.info('Worker service started successfully')
  } catch (error) {
    logger.error('Failed to start worker service:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...')
  process.exit(0)
})

main()