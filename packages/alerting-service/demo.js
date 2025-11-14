#!/usr/bin/env node

/**
 * Demo script for the Alerting Service
 * This script demonstrates creating alerts and shows how the system processes them
 */

import { AlertProcessor } from './dist/services/alert-processor.js';
import { NotificationService } from './dist/services/notification-service.js';
import { AlertEvent, EventType } from './dist/types/index.js';
import { randomUUID } from 'crypto';

async function runDemo() {
  console.log('🚀 Starting Alerting Service Demo\n');

  const alertProcessor = new AlertProcessor();
  const notificationService = new NotificationService();

  // Demo events
  const demoEvents = [
    {
      id: randomUUID(),
      type: 'LOW_STOCK',
      userId: 'user1',
      data: {
        productName: 'Premium Shampoo',
        stock: 3,
        location: 'Main Store'
      },
      severity: 'HIGH',
      timestamp: new Date(),
      processed: false
    },
    {
      id: randomUUID(),
      type: 'IMMINENT_EXPIRATION',
      userId: 'user1',
      data: {
        productName: 'Hair Styling Gel',
        daysUntilExpiration: 2,
        batchNumber: 'BATCH-123'
      },
      severity: 'HIGH',
      timestamp: new Date(),
      processed: false
    },
    {
      id: randomUUID(),
      type: 'SUPPLIER_ORDER_UPDATE',
      userId: 'user2',
      data: {
        orderId: 'ORD-2024-001',
        status: 'DELAYED',
        supplierName: 'Beauty Supplies Co.',
        estimatedDelay: '2 days'
      },
      severity: 'HIGH',
      timestamp: new Date(),
      processed: false
    }
  ];

  console.log('📋 Processing demo events...\n');

  for (const event of demoEvents) {
    console.log(`🔔 Processing event: ${event.type}`);
    console.log(`   Event ID: ${event.id}`);
    console.log(`   User: ${event.userId}`);
    console.log(`   Data:`, JSON.stringify(event.data, null, 2));

    // Process the event to determine if alert should be sent
    const result = alertProcessor.processEvent(event);
    
    if (result.shouldAlert) {
      console.log(`   ✅ Alert triggered! Severity: ${result.severity}`);
      console.log(`   📢 Channels: ${result.channels?.join(', ')}`);

      // Generate alert message
      const { subject, content } = alertProcessor.generateAlertMessage(
        event, 
        result.severity || 'MEDIUM'
      );
      
      console.log(`   📧 Subject: ${subject}`);
      console.log(`   📝 Content: ${content}`);

      // Send notifications based on user preferences
      const messages = await notificationService.sendNotificationsForEvent(
        event.id,
        event.type,
        event.userId,
        subject,
        content
      );

      console.log(`   📨 Sent ${messages.length} notifications`);
      messages.forEach(msg => {
        console.log(`      - ${msg.channel}: ${msg.sent ? '✅ Success' : '❌ Failed'}`);
      });

      // Store the processed event
      event.processed = true;
      alertProcessor.storeEvent(event);
    } else {
      console.log(`   ❌ No alert needed (thresholds not met)`);
    }
    
    console.log('');
  }

  console.log('📊 Demo Summary:');
  console.log('   - Low stock alerts processed for critical inventory levels');
  console.log('   - Expiration alerts for products nearing expiry');
  console.log('   - Supplier order updates for delivery status changes');
  console.log('   - Multi-channel notifications (Email, SMS, Push, In-App)');
  console.log('   - User preference enforcement');

  // Show in-app notifications
  const user1Notifications = notificationService.getInAppNotifications('user1');
  const user2Notifications = notificationService.getInAppNotifications('user2');

  console.log('\n📱 In-App Notifications:');
  console.log(`   User1: ${user1Notifications.length} notifications`);
  console.log(`   User2: ${user2Notifications.length} notifications`);

  user1Notifications.forEach((notif, index) => {
    console.log(`     ${index + 1}. ${notif.subject} (${notif.channel})`);
  });

  console.log('\n✨ Demo completed successfully!');
  console.log('\nTo start the full service:');
  console.log('   npm run dev    # Start development server');
  console.log('   npm run build  # Build for production');
  console.log('   npm test      # Run tests');
}

// Run the demo
runDemo().catch(console.error);