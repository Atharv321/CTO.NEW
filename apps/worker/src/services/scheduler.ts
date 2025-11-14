import cron from 'node-cron'
import { logger } from './logger.js'
import { cleanupExpiredTokensJob } from '../jobs/cleanup-tokens.js'
import { sendReminderEmailsJob } from '../jobs/send-reminders.js'

const jobs = [
  {
    name: 'cleanup-expired-tokens',
    schedule: '0 2 * * *', // Run daily at 2 AM
    task: cleanupExpiredTokensJob,
  },
  {
    name: 'send-reminder-emails',
    schedule: '0 9 * * *', // Run daily at 9 AM
    task: sendReminderEmailsJob,
  },
]

export async function startScheduler() {
  logger.info('Starting job scheduler...')

  for (const job of jobs) {
    try {
      cron.schedule(job.schedule, async () => {
        logger.info(`Running scheduled job: ${job.name}`)
        try {
          await job.task()
          logger.info(`Completed job: ${job.name}`)
        } catch (error) {
          logger.error(`Job ${job.name} failed:`, error)
        }
      })

      logger.info(`Scheduled job: ${job.name} with cron: ${job.schedule}`)
    } catch (error) {
      logger.error(`Failed to schedule job ${job.name}:`, error)
    }
  }

  logger.info(`Job scheduler started with ${jobs.length} jobs`)
}