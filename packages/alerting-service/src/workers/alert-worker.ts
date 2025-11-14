import { QueueService } from '@/services/queue-service';
import { NotificationService } from '@/services/notification-service';
import { AlertProcessor } from '@/services/alert-processor';
import { AlertEvent, QueueJob } from '@/types';
import { config } from '@/config';
import Queue from 'bull';

export class AlertWorker {
  private queueService: QueueService;
  private notificationService: NotificationService;
  private alertProcessor: AlertProcessor;
  private isRunning: boolean = false;

  constructor() {
    this.queueService = new QueueService();
    this.notificationService = new NotificationService();
    this.alertProcessor = new AlertProcessor();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting alert worker...');

    // Process event queue
    this.queueService.getEventQueue().process('process-event', config.queue.concurrency, async (job) => {
      return this.processEventJob(job);
    });

    // Process notification queue
    this.queueService.getNotificationQueue().process('send-notification', config.queue.concurrency, async (job) => {
      return this.processNotificationJob(job);
    });

    // Handle queue events
    this.setupQueueEventHandlers();

    console.log('Alert worker started successfully');
  }

  private async processEventJob(job: Queue.Job<QueueJob>): Promise<void> {
    const { eventId } = job.data;
    console.log(`Processing event job for eventId: ${eventId}`);

    try {
      // In a real implementation, this would fetch the event from a database
      // For now, we'll create a mock event
      const event = this.getMockEvent(eventId);
      if (!event) {
        console.error(`Event not found: ${eventId}`);
        return;
      }

      // Store the event
      this.alertProcessor.storeEvent(event);

      // Process the event to determine if alert should be sent
      const result = this.alertProcessor.processEvent(event);
      
      if (result.shouldAlert) {
        console.log(`Alert triggered for event ${eventId} with severity ${result.severity}`);
        
        // Generate alert message
        const { subject, content } = this.alertProcessor.generateAlertMessage(
          event, 
          result.severity || 'MEDIUM'
        );

        // Send notifications for each channel
        if (result.channels) {
          for (const channel of result.channels) {
            await this.queueService.addNotificationJob(eventId, event.userId);
          }
        }
      } else {
        console.log(`No alert needed for event ${eventId}`);
      }

      // Mark event as processed
      event.processed = true;
      this.alertProcessor.storeEvent(event);

    } catch (error) {
      console.error(`Error processing event job for ${eventId}:`, error);
      throw error;
    }
  }

  private async processNotificationJob(job: Queue.Job<QueueJob>): Promise<void> {
    const { eventId, userId } = job.data;
    console.log(`Processing notification job for eventId: ${eventId}, userId: ${userId}`);

    if (!userId) {
      console.error(`User ID not provided for notification job: ${eventId}`);
      return;
    }

    try {
      const event = this.alertProcessor.getEvent(eventId);
      if (!event) {
        console.error(`Event not found for notification: ${eventId}`);
        return;
      }

      const result = this.alertProcessor.processEvent(event);
      if (!result.shouldAlert) {
        console.log(`No alert needed for notification job: ${eventId}`);
        return;
      }

      const { subject, content } = this.alertProcessor.generateAlertMessage(
        event, 
        result.severity || 'MEDIUM'
      );

      // Send notifications based on user preferences
      const messages = await this.notificationService.sendNotificationsForEvent(
        eventId,
        event.type,
        userId,
        subject,
        content
      );

      console.log(`Sent ${messages.length} notifications for event ${eventId}`);

    } catch (error) {
      console.error(`Error processing notification job for ${eventId}:`, error);
      throw error;
    }
  }

  private setupQueueEventHandlers(): void {
    this.queueService.getEventQueue().on('completed', (job) => {
      console.log(`Event job completed: ${job.id}`);
    });

    this.queueService.getEventQueue().on('failed', (job, err) => {
      console.error(`Event job failed: ${job.id}`, err);
    });

    this.queueService.getNotificationQueue().on('completed', (job) => {
      console.log(`Notification job completed: ${job.id}`);
    });

    this.queueService.getNotificationQueue().on('failed', (job, err) => {
      console.error(`Notification job failed: ${job.id}`, err);
    });
  }

  private getMockEvent(eventId: string): AlertEvent | null {
    // Mock events for testing
    const mockEvents: AlertEvent[] = [
      {
        id: 'event-1',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: {
          productName: 'Shampoo',
          stock: 3
        },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      },
      {
        id: 'event-2',
        type: 'IMMINENT_EXPIRATION',
        userId: 'user1',
        data: {
          productName: 'Hair Gel',
          daysUntilExpiration: 2
        },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      },
      {
        id: 'event-3',
        type: 'SUPPLIER_ORDER_UPDATE',
        userId: 'user2',
        data: {
          orderId: 'ORD-123',
          status: 'DELAYED',
          additionalInfo: 'Expected delay of 2 days due to weather conditions.'
        },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      }
    ];

    return mockEvents.find(event => event.id === eventId) || null;
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Worker is not running');
      return;
    }

    console.log('Stopping alert worker...');
    this.isRunning = false;
    await this.queueService.close();
    console.log('Alert worker stopped');
  }

  async getStats(): Promise<any> {
    return this.queueService.getQueueStats();
  }
}