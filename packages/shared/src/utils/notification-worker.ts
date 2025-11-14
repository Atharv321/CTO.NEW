import { NotificationService, NotificationEvent } from '@shared/utils';
import { SendGridAdapter, MockSMSAdapter, MockPushAdapter, InAppAdapter } from '@shared/utils';

export class NotificationWorker {
  private notificationService: NotificationService;
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    this.notificationService = new NotificationService();
    this.setupAdapters();
  }

  private setupAdapters(): void {
    // Initialize adapters with mock configurations
    const sendGridAdapter = new SendGridAdapter(
      process.env.SENDGRID_API_KEY || 'mock-api-key',
      process.env.FROM_EMAIL || 'noreply@example.com'
    );
    
    const smsAdapter = new MockSMSAdapter();
    const pushAdapter = new MockPushAdapter();
    const inAppAdapter = new InAppAdapter();

    this.notificationService.registerAdapter('email', sendGridAdapter);
    this.notificationService.registerAdapter('sms', smsAdapter);
    this.notificationService.registerAdapter('push', pushAdapter);
    this.notificationService.registerAdapter('in_app', inAppAdapter);
  }

  start(): void {
    if (this.isRunning) {
      console.log('Notification worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting notification worker...');

    // Process queue every 5 seconds
    this.interval = setInterval(async () => {
      try {
        await this.notificationService.processQueue();
      } catch (error) {
        console.error('Error processing notification queue:', error);
      }
    }, 5000);

    console.log('Notification worker started');
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Notification worker is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('Notification worker stopped');
  }

  async addEvent(event: NotificationEvent): Promise<void> {
    try {
      await this.notificationService.processEvent(event);
      console.log(`Event ${event.id} added to processing queue`);
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
    }
  }

  getNotificationService(): NotificationService {
    return this.notificationService;
  }
}

// Singleton instance for the application
let workerInstance: NotificationWorker | null = null;

export function getNotificationWorker(): NotificationWorker {
  if (!workerInstance) {
    workerInstance = new NotificationWorker();
  }
  return workerInstance;
}