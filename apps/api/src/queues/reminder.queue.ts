import { Queue, QueueEvents } from 'bullmq';
import { redisConnection, queueConfig } from '../config/redis.js';
import { ReminderJobData, Booking } from '../models/booking.js';

export const REMINDER_QUEUE_NAME = 'booking-reminders';

/**
 * Queue for scheduling WhatsApp reminder jobs
 */
export class ReminderQueue {
  private queue: Queue<ReminderJobData>;
  private queueEvents: QueueEvents;

  constructor() {
    this.queue = new Queue<ReminderJobData>(REMINDER_QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: queueConfig.defaultJobOptions,
    });

    this.queueEvents = new QueueEvents(REMINDER_QUEUE_NAME, {
      connection: redisConnection,
    });

    this.setupEventListeners();
  }

  /**
   * Schedule reminders for a booking (every 2 hours until appointment)
   */
  async scheduleReminders(booking: Booking): Promise<string[]> {
    const jobIds: string[] = [];
    const now = new Date();
    const appointmentTime = new Date(booking.scheduledTime);
    
    // Calculate how many reminders to send (every 2 hours)
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const numReminders = Math.floor(hoursUntilAppointment / 2);

    // Don't schedule reminders if appointment is less than 2 hours away
    if (numReminders <= 0) {
      console.log(`[ReminderQueue] Appointment ${booking.id} is less than 2 hours away, no reminders scheduled`);
      return jobIds;
    }

    // Schedule reminders every 2 hours
    for (let i = 0; i < numReminders; i++) {
      const reminderTime = new Date(now.getTime() + (i + 1) * 2 * 60 * 60 * 1000);
      
      // Don't schedule reminders past the appointment time
      if (reminderTime >= appointmentTime) {
        break;
      }

      const jobId = `${booking.id}-reminder-${i + 1}`;
      const jobData: ReminderJobData = {
        jobId,
        bookingId: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        scheduledTime: appointmentTime,
        reminderNumber: i + 1,
      };

      try {
        await this.queue.add(
          'send-reminder',
          jobData,
          {
            jobId, // Use jobId for idempotency
            delay: reminderTime.getTime() - now.getTime(),
            removeOnComplete: true,
          }
        );

        jobIds.push(jobId);
        console.log(`[ReminderQueue] Scheduled reminder ${i + 1} for booking ${booking.id} at ${reminderTime.toISOString()}`);
      } catch (error) {
        console.error(`[ReminderQueue] Failed to schedule reminder ${i + 1} for booking ${booking.id}:`, error);
      }
    }

    return jobIds;
  }

  /**
   * Cancel all reminders for a booking
   */
  async cancelReminders(bookingId: string): Promise<number> {
    let cancelledCount = 0;

    try {
      // Get all jobs for this booking
      const jobs = await this.queue.getJobs(['waiting', 'delayed', 'active']);
      
      for (const job of jobs) {
        if (job.data.bookingId === bookingId) {
          await job.remove();
          cancelledCount++;
          console.log(`[ReminderQueue] Cancelled reminder job ${job.id} for booking ${bookingId}`);
        }
      }

      console.log(`[ReminderQueue] Cancelled ${cancelledCount} reminder(s) for booking ${bookingId}`);
    } catch (error) {
      console.error(`[ReminderQueue] Failed to cancel reminders for booking ${bookingId}:`, error);
      throw error;
    }

    return cancelledCount;
  }

  /**
   * Get the status of reminders for a booking
   */
  async getReminderStatus(bookingId: string): Promise<Array<{ jobId: string; state: string; scheduledFor: Date }>> {
    const reminders: Array<{ jobId: string; state: string; scheduledFor: Date }> = [];

    try {
      const jobs = await this.queue.getJobs(['waiting', 'delayed', 'active', 'completed', 'failed']);
      
      for (const job of jobs) {
        if (job.data.bookingId === bookingId) {
          reminders.push({
            jobId: job.id!,
            state: await job.getState(),
            scheduledFor: new Date(job.timestamp + (job.opts.delay || 0)),
          });
        }
      }
    } catch (error) {
      console.error(`[ReminderQueue] Failed to get reminder status for booking ${bookingId}:`, error);
    }

    return reminders;
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`[ReminderQueue] Job ${jobId} completed successfully`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`[ReminderQueue] Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`[ReminderQueue] Job ${jobId} progress:`, data);
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const counts = await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    return counts;
  }

  /**
   * Clean up old jobs
   */
  async cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.queue.clean(olderThanMs, 100, 'completed');
    await this.queue.clean(7 * 24 * 60 * 60 * 1000, 100, 'failed'); // Keep failed jobs for 7 days
    console.log(`[ReminderQueue] Cleaned up jobs older than ${olderThanMs}ms`);
  }

  /**
   * Close the queue connections
   */
  async close(): Promise<void> {
    await this.queueEvents.close();
    await this.queue.close();
  }

  /**
   * Get the underlying queue instance
   */
  getQueue(): Queue<ReminderJobData> {
    return this.queue;
  }
}

// Singleton instance
export const reminderQueue = new ReminderQueue();
