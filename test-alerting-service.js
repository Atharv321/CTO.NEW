// Standalone test of the alerting service implementation
const express = require('express');

// Notification service implementation
class NotificationService {
  constructor() {
    this.adapters = new Map();
    this.preferences = new Map();
    this.messageQueue = [];
    
    // Register default adapters
    this.registerAdapter('email', new SendGridAdapter());
    this.registerAdapter('in_app', new InAppAdapter());
  }

  registerAdapter(type, adapter) {
    this.adapters.set(type, adapter);
  }

  setUserPreferences(preferences) {
    this.preferences.set(preferences.userId, preferences);
  }

  async processEvent(event) {
    const preferences = this.preferences.get(event.userId);
    
    if (!preferences) {
      console.log(`No preferences found for user ${event.userId}`);
      return;
    }

    const enabledChannels = preferences.channels.filter(c => c.enabled);
    
    for (const channel of enabledChannels) {
      const message = this.createMessage(event, channel.type);
      this.messageQueue.push(message);
    }
  }

  createMessage(event, channel) {
    const { subject, body } = this.generateMessageContent(event);
    
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.id,
      userId: event.userId,
      channel: channel,
      subject,
      body,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    };
  }

  generateMessageContent(event) {
    switch (event.type) {
      case 'low_stock':
        return {
          subject: `Low Stock Alert: ${event.data.itemName}`,
          body: `Item "${event.data.itemName}" is running low with only ${event.data.currentStock} units remaining.`
        };
      
      case 'impending_expiration':
        return {
          subject: `Expiration Alert: ${event.data.itemName}`,
          body: `Item "${event.data.itemName}" will expire in ${event.data.daysUntilExpiration} days.`
        };
      
      case 'supplier_order_update':
        return {
          subject: `Order Update: ${event.data.orderNumber}`,
          body: `Your order ${event.data.orderNumber} has been updated to status: ${event.data.status}.`
        };
      
      default:
        return {
          subject: 'Notification',
          body: 'You have a new notification.'
        };
    }
  }

  async processQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      await this.sendMessage(message);
    }
  }

  async sendMessage(message) {
    const adapter = this.adapters.get(message.channel);
    
    if (!adapter) {
      console.error(`No adapter found for channel: ${message.channel}`);
      return;
    }

    message.attempts++;
    message.lastAttempt = new Date();

    try {
      const success = await adapter.send(message);
      
      if (success) {
        message.status = 'sent';
        message.sentAt = new Date();
        console.log(`Message ${message.id} sent successfully via ${message.channel}`);
      } else {
        message.status = 'failed';
        console.log(`Message ${message.id} failed to send via ${message.channel}`);
      }
    } catch (error) {
      message.status = 'failed';
      console.error(`Error sending message ${message.id}:`, error);
    }
  }

  getAdapter(type) {
    return this.adapters.get(type);
  }
}

// Mock adapters
class SendGridAdapter {
  async send(message) {
    console.log(`[SendGrid] Sending email: ${message.subject}`);
    console.log(`[SendGrid] Body: ${message.body}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock failure for messages containing 'fail'
    return !message.body.includes('fail');
  }
}

class InAppAdapter {
  constructor() {
    this.storage = new Map();
  }

  async send(message) {
    const notification = {
      id: message.id,
      userId: message.userId,
      title: message.subject,
      message: message.body,
      read: false,
      createdAt: new Date()
    };

    const userNotifications = this.storage.get(message.userId) || [];
    userNotifications.push(notification);
    this.storage.set(message.userId, userNotifications);

    console.log(`[InApp] Stored notification for user ${message.userId}`);
    return true;
  }

  getNotifications(userId) {
    return this.storage.get(userId) || [];
  }

  markAsRead(userId, notificationId) {
    const notifications = this.storage.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date();
      return true;
    }
    return false;
  }
}

// Test the implementation
async function testAlertingService() {
  console.log('=== Testing Alerting Service ===');

  const notificationService = new NotificationService();

  // Set up user preferences
  const preferences = {
    userId: 'test-user',
    channels: [
      { type: 'email', enabled: true },
      { type: 'in_app', enabled: true }
    ],
    eventTypes: ['low_stock', 'impending_expiration'],
    minPriority: 'low'
  };
  
  notificationService.setUserPreferences(preferences);

  // Create test events
  const lowStockEvent = {
    id: 'event1',
    type: 'low_stock',
    userId: 'test-user',
    data: {
      itemName: 'Test Product',
      currentStock: 5
    },
    timestamp: new Date(),
    priority: 'high'
  };

  const expirationEvent = {
    id: 'event2',
    type: 'impending_expiration',
    userId: 'test-user',
    data: {
      itemName: 'Perishable Item',
      daysUntilExpiration: 3
    },
    timestamp: new Date(),
    priority: 'medium'
  };

  // Process events
  await notificationService.processEvent(lowStockEvent);
  await notificationService.processEvent(expirationEvent);

  // Process queue
  await notificationService.processQueue();

  // Check in-app notifications
  const inAppAdapter = notificationService.getAdapter('in_app');
  const notifications = inAppAdapter.getNotifications('test-user');

  console.log(`\nGenerated ${notifications.length} in-app notifications:`);
  notifications.forEach((notif, index) => {
    console.log(`${index + 1}. ${notif.title}: ${notif.message}`);
  });

  console.log('\n=== Test Complete ===');
  return notificationService;
}

// Create Express app for API testing
function createTestApp() {
  const app = express();
  app.use(express.json());

  const notificationService = new NotificationService();

  // Set up test user
  notificationService.setUserPreferences({
    userId: 'api-test-user',
    channels: [
      { type: 'email', enabled: true },
      { type: 'in_app', enabled: true }
    ],
    eventTypes: ['low_stock', 'impending_expiration', 'supplier_order_update'],
    minPriority: 'low'
  });

  // API endpoints
  app.post('/api/alerts/events', async (req, res) => {
    try {
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ...req.body
      };

      await notificationService.processEvent(event);
      
      res.json({
        success: true,
        data: { message: 'Event added to queue', eventId: event.id }
      });
    } catch (error) {
      console.error('Error processing event:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  app.get('/api/alerts/notifications/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const inAppAdapter = notificationService.getAdapter('in_app');
      const notifications = inAppAdapter.getNotifications(userId);
      
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  app.put('/api/alerts/notifications/:userId/:notificationId/read', (req, res) => {
    try {
      const { userId, notificationId } = req.params;
      const inAppAdapter = notificationService.getAdapter('in_app');
      const success = inAppAdapter.markAsRead(userId, notificationId);
      
      if (success) {
        res.json({
          success: true,
          data: { message: 'Notification marked as read' }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  app.post('/api/alerts/preferences/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const preferences = {
        userId,
        ...req.body
      };

      notificationService.setUserPreferences(preferences);
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error setting preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Start queue processing
  setInterval(async () => {
    await notificationService.processQueue();
  }, 2000);

  return { app, notificationService };
}

// Run tests
if (require.main === module) {
  testAlertingService().then((notificationService) => {
    console.log('\nStarting API server on port 3000...');
    const { app } = createTestApp();
    
    app.listen(3000, () => {
      console.log('Test server running. Try these commands:');
      console.log('curl -X POST http://localhost:3000/api/alerts/events -H "Content-Type: application/json" -d \'{"type":"low_stock","userId":"api-test-user","data":{"itemName":"Test Item","currentStock":3},"priority":"high"}\'');
      console.log('curl http://localhost:3000/api/alerts/notifications/api-test-user');
      console.log('\nPress Ctrl+C to stop the server');
    });
  });
}

module.exports = { testAlertingService, createTestApp, NotificationService, SendGridAdapter, InAppAdapter };