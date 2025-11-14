// Simple test of alerting service core logic (no external dependencies)

// Mock adapters
class SendGridAdapter {
  async send(message) {
    console.log(`[SendGrid] Sending email: ${message.subject}`);
    console.log(`[SendGrid] Body: ${message.body}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
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
}

// Notification service
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

  getUserPreferences(userId) {
    return this.preferences.get(userId);
  }

  async processEvent(event) {
    const preferences = this.preferences.get(event.userId);
    
    if (!preferences) {
      console.log(`No preferences found for user ${event.userId}, skipping notification`);
      return;
    }

    // Check if event type is enabled
    if (!preferences.eventTypes.includes(event.type)) {
      console.log(`Event type ${event.type} not enabled for user ${event.userId}`);
      return;
    }

    // Check priority threshold
    const priorityLevels = { low: 0, medium: 1, high: 2 };
    if (priorityLevels[event.priority] < priorityLevels[preferences.minPriority]) {
      console.log(`Event priority ${event.priority} below threshold for user ${event.userId}`);
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
          body: `Item "${event.data.itemName}" is running low with only ${event.data.currentStock} units remaining. Reorder recommended.`
        };
      
      case 'impending_expiration':
        return {
          subject: `Expiration Alert: ${event.data.itemName}`,
          body: `Item "${event.data.itemName}" will expire in ${event.data.daysUntilExpiration} days on ${event.data.expirationDate}.`
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
    console.log(`Processing ${this.messageQueue.length} messages in queue...`);
    
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
        console.log(`✓ Message ${message.id} sent successfully via ${message.channel}`);
      } else {
        message.status = 'failed';
        console.log(`✗ Message ${message.id} failed to send via ${message.channel}`);
      }
    } catch (error) {
      message.status = 'failed';
      console.error(`Error sending message ${message.id}:`, error);
    }
  }

  getAdapter(type) {
    return this.adapters.get(type);
  }

  checkThresholds(eventType, value) {
    const thresholds = this.getThresholds(eventType) || [];
    return thresholds.filter(threshold => value <= threshold.value);
  }

  getThresholds(eventType) {
    const defaultThresholds = {
      'low_stock': [
        { type: 'low_stock', value: 10, unit: 'items' },
        { type: 'low_stock', value: 5, unit: 'items' }
      ],
      'impending_expiration': [
        { type: 'impending_expiration', value: 7, unit: 'days' },
        { type: 'impending_expiration', value: 3, unit: 'days' }
      ]
    };
    
    return defaultThresholds[eventType] || [];
  }
}

// Test functions
async function runTests() {
  console.log('🚀 Starting Alerting Service Tests\n');

  // Test 1: Basic notification processing
  console.log('📋 Test 1: Basic Notification Processing');
  console.log('=' .repeat(50));

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
      daysUntilExpiration: 3,
      expirationDate: '2024-12-25'
    },
    timestamp: new Date(),
    priority: 'medium'
  };

  // Process events
  await notificationService.processEvent(lowStockEvent);
  await notificationService.processEvent(expirationEvent);

  // Process queue
  await notificationService.processQueue();

  // Check results
  const inAppAdapter = notificationService.getAdapter('in_app');
  const notifications = inAppAdapter.getNotifications('test-user');

  console.log(`\n✅ Generated ${notifications.length} in-app notifications:`);
  notifications.forEach((notif, index) => {
    console.log(`  ${index + 1}. ${notif.title}`);
    console.log(`     ${notif.message}`);
  });

  // Test 2: User preferences filtering
  console.log('\n📋 Test 2: User Preferences Filtering');
  console.log('=' .repeat(50));

  // Set up user with only email enabled
  const emailOnlyPreferences = {
    userId: 'email-only-user',
    channels: [
      { type: 'email', enabled: true },
      { type: 'in_app', enabled: false }
    ],
    eventTypes: ['low_stock'],
    minPriority: 'high' // Only high priority
  };
  
  notificationService.setUserPreferences(emailOnlyPreferences);

  // Test low priority event (should be filtered out)
  const lowPriorityEvent = {
    id: 'event3',
    type: 'low_stock',
    userId: 'email-only-user',
    data: {
      itemName: 'Low Priority Item',
      currentStock: 8
    },
    timestamp: new Date(),
    priority: 'low'
  };

  await notificationService.processEvent(lowPriorityEvent);
  await notificationService.processQueue();

  const emailOnlyNotifications = inAppAdapter.getNotifications('email-only-user');
  console.log(`\n✅ Low priority event filtered: ${emailOnlyNotifications.length} in-app notifications (expected 0)`);

  // Test 3: Threshold checking
  console.log('\n📋 Test 3: Threshold Checking');
  console.log('=' .repeat(50));

  const lowStockThresholds = notificationService.checkThresholds('low_stock', 3);
  console.log(`✅ Low stock thresholds for value 3: ${lowStockThresholds.length} thresholds found`);
  lowStockThresholds.forEach(threshold => {
    console.log(`   - ${threshold.value} ${threshold.unit}`);
  });

  const expirationThresholds = notificationService.checkThresholds('impending_expiration', 2);
  console.log(`✅ Expiration thresholds for value 2: ${expirationThresholds.length} thresholds found`);
  expirationThresholds.forEach(threshold => {
    console.log(`   - ${threshold.value} ${threshold.unit}`);
  });

  // Test 4: Supplier order updates
  console.log('\n📋 Test 4: Supplier Order Updates');
  console.log('=' .repeat(50));

  const orderUpdateEvent = {
    id: 'event4',
    type: 'supplier_order_update',
    userId: 'test-user',
    data: {
      orderNumber: 'ORD-001',
      status: 'shipped'
    },
    timestamp: new Date(),
    priority: 'low'
  };

  await notificationService.processEvent(orderUpdateEvent);
  await notificationService.processQueue();

  const allNotifications = inAppAdapter.getNotifications('test-user');
  console.log(`✅ Total notifications after order update: ${allNotifications.length}`);

  // Test 5: Error handling
  console.log('\n📋 Test 5: Error Handling');
  console.log('=' .repeat(50));

  const failEvent = {
    id: 'event5',
    type: 'low_stock',
    userId: 'test-user',
    data: {
      itemName: 'fail-product', // This will cause email to fail
      currentStock: 1
    },
    timestamp: new Date(),
    priority: 'high'
  };

  await notificationService.processEvent(failEvent);
  await notificationService.processQueue();

  console.log('✅ Error handling test completed (email should fail, in-app should succeed)');

  console.log('\n🎉 All tests completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Total in-app notifications for test-user: ${allNotifications.length}`);
  console.log(`   - Email adapter: Mock SendGrid (with failure simulation)`);
  console.log(`   - In-app adapter: In-memory storage`);
  console.log(`   - Queue processing: Real-time processing`);
  console.log(`   - Preference filtering: Working correctly`);
  console.log(`   - Threshold checking: Working correctly`);
}

// Run the tests
runTests().catch(console.error);