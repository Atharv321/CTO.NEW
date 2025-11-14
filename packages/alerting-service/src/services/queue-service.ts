import Queue from 'bull';
import { config } from '@/config';
import { QueueJob, AlertEvent } from '@/types';

export class QueueService {
  private eventQueue: Queue.Queue;
  private notificationQueue: Queue.Queue;

  constructor() {
    this.eventQueue = new Queue('alert events', {
      redis: config.redis,
      defaultJobOptions: config.queue.defaultJobOptions
    });

    this.notificationQueue = new Queue('notifications', {
      redis: config.redis,
      defaultJobOptions: config.queue.defaultJobOptions
    });
  }

  async addEventJob(event: AlertEvent): Promise<void> {
    await this.eventQueue.add('process-event', {
      eventId: event.id,
      retryCount: 0,
      maxRetries: 3
    });
  }

  async addNotificationJob(eventId: string, userId: string): Promise<void> {
    await this.notificationQueue.add('send-notification', {
      eventId,
      userId,
      retryCount: 0,
      maxRetries: 3
    });
  }

  getEventQueue(): Queue.Queue {
    return this.eventQueue;
  }

  getNotificationQueue(): Queue.Queue {
    return this.notificationQueue;
  }

  async getQueueStats(): Promise<{
    eventQueue: { waiting: number; active: number; completed: number; failed: number };
    notificationQueue: { waiting: number; active: number; completed: number; failed: number };
  }> {
    const [eventWaiting, eventActive, eventCompleted, eventFailed] = await Promise.all([
      this.eventQueue.getWaiting(),
      this.eventQueue.getActive(),
      this.eventQueue.getCompleted(),
      this.eventQueue.getFailed()
    ]);

    const [notificationWaiting, notificationActive, notificationCompleted, notificationFailed] = await Promise.all([
      this.notificationQueue.getWaiting(),
      this.notificationQueue.getActive(),
      this.notificationQueue.getCompleted(),
      this.notificationQueue.getFailed()
    ]);

    return {
      eventQueue: {
        waiting: eventWaiting.length,
        active: eventActive.length,
        completed: eventCompleted.length,
        failed: eventFailed.length
      },
      notificationQueue: {
        waiting: notificationWaiting.length,
        active: notificationActive.length,
        completed: notificationCompleted.length,
        failed: notificationFailed.length
      }
    };
  }

  async close(): Promise<void> {
    await this.eventQueue.close();
    await this.notificationQueue.close();
  }
}