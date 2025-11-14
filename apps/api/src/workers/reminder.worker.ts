import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { ReminderJobData } from '../models/booking.js';
import { WhatsAppMessageTemplates } from '../templates/whatsapp-messages.js';
import { whatsappService } from '../services/whatsapp.service.js';
import { REMINDER_QUEUE_NAME } from '../queues/reminder.queue.js';

/**
 * Worker for processing reminder jobs
 */
export class ReminderWorker {
  private worker: Worker<ReminderJobData>;
  private processedJobs: Set<string> = new Set(); // For idempotency tracking

  constructor() {
    this.worker = new Worker<ReminderJobData>(
      REMINDER_QUEUE_NAME,
      async (job: Job<ReminderJobData>) => this.processReminderJob(job),
      {
        connection: redisConnection,
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 10, // Maximum 10 jobs
          duration: 1000, // per second
        },
      }
    );

    this.setupEventListeners();
  }

  /**
   * Process a single reminder job
   */
  private async processReminderJob(job: Job<ReminderJobData>): Promise<void> {
    const { jobId, bookingId, customerName, customerPhone, scheduledTime, reminderNumber } = job.data;

    console.log(`[ReminderWorker] Processing job ${job.id} for booking ${bookingId} (reminder #${reminderNumber})`);

    // Idempotency check - don't process the same job twice
    if (this.processedJobs.has(jobId)) {
      console.log(`[ReminderWorker] Job ${jobId} already processed, skipping (idempotency)`);
      return;
    }

    try {
      // Check if appointment is still in the future
      const now = new Date();
      const appointmentTime = new Date(scheduledTime);
      
      if (appointmentTime <= now) {
        console.log(`[ReminderWorker] Appointment ${bookingId} is in the past, skipping reminder`);
        return;
      }

      // Update job progress
      await job.updateProgress(25);

      // Format the WhatsApp message
      const message = WhatsAppMessageTemplates.formatReminderMessage(job.data);

      await job.updateProgress(50);

      // Send the message
      const result = await whatsappService.sendMessage(message);

      await job.updateProgress(75);

      if (!result.success) {
        throw new Error(`Failed to send WhatsApp message: ${result.error}`);
      }

      console.log(`[ReminderWorker] Successfully sent reminder for booking ${bookingId} (Message ID: ${result.messageId})`);

      // Mark job as processed for idempotency
      this.processedJobs.add(jobId);
      
      // Clean up old processed jobs to prevent memory leak
      if (this.processedJobs.size > 10000) {
        const firstHalf = Array.from(this.processedJobs).slice(0, 5000);
        firstHalf.forEach(id => this.processedJobs.delete(id));
      }

      await job.updateProgress(100);
    } catch (error) {
      console.error(`[ReminderWorker] Failed to process job ${job.id}:`, error);
      
      // Log failure but let BullMQ handle retries
      throw error;
    }
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    this.worker.on('completed', (job) => {
      console.log(`[ReminderWorker] Job ${job.id} completed for booking ${job.data.bookingId}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[ReminderWorker] Job ${job?.id} failed for booking ${job?.data.bookingId}:`, err.message);
      
      if (job && job.attemptsMade < (job.opts.attempts || 5)) {
        console.log(`[ReminderWorker] Job ${job.id} will be retried (attempt ${job.attemptsMade + 1})`);
      } else {
        console.error(`[ReminderWorker] Job ${job?.id} exhausted all retry attempts`);
      }
    });

    this.worker.on('active', (job) => {
      console.log(`[ReminderWorker] Job ${job.id} is now active`);
    });

    this.worker.on('progress', (job, progress) => {
      console.log(`[ReminderWorker] Job ${job.id} progress: ${progress}%`);
    });

    this.worker.on('error', (err) => {
      console.error('[ReminderWorker] Worker error:', err);
    });
  }

  /**
   * Gracefully close the worker
   */
  async close(): Promise<void> {
    console.log('[ReminderWorker] Closing worker...');
    await this.worker.close();
    console.log('[ReminderWorker] Worker closed');
  }

  /**
   * Get worker statistics
   */
  async getStats(): Promise<{
    isRunning: boolean;
    isPaused: boolean;
    processedCount: number;
  }> {
    return {
      isRunning: this.worker.isRunning(),
      isPaused: this.worker.isPaused(),
      processedCount: this.processedJobs.size,
    };
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    await this.worker.pause();
    console.log('[ReminderWorker] Worker paused');
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    await this.worker.resume();
    console.log('[ReminderWorker] Worker resumed');
  }
}

// Export singleton instance
export const reminderWorker = new ReminderWorker();
