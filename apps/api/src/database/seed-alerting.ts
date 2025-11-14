import db from './connection.js';
import { v4 as uuidv4 } from 'uuid';
import { AlertEventType, AlertSeverity, NotificationChannelType } from '@shared/types';

export async function seedAlertingData() {
  console.log('🌱 Seeding alerting data...');

  try {
    // Get existing users, locations, and products
    const usersResult = await db.query('SELECT id, name, email FROM users LIMIT 5');
    const locationsResult = await db.query('SELECT id, name FROM locations LIMIT 3');
    const productsResult = await db.query('SELECT id, name, sku FROM products LIMIT 10');

    if (usersResult.rows.length === 0 || locationsResult.rows.length === 0 || productsResult.rows.length === 0) {
      console.log('⚠️  Required base data not found. Please run main seed script first.');
      return;
    }

    const users = usersResult.rows;
    const locations = locationsResult.rows;
    const products = productsResult.rows;

    // Create alert thresholds
    console.log('Creating alert thresholds...');
    
    for (let i = 0; i < Math.min(products.length, 5); i++) {
      for (let j = 0; j < Math.min(locations.length, 2); j++) {
        const threshold = {
          id: uuidv4(),
          locationId: locations[j].id,
          productId: products[i].id,
          type: AlertEventType.LOW_STOCK,
          threshold: Math.floor(Math.random() * 20) + 5, // 5-25 units
          unit: 'units',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.query(
          `INSERT INTO alert_thresholds (id, location_id, product_id, type, threshold, unit, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (location_id, product_id, type) DO NOTHING`,
          [
            threshold.id,
            threshold.locationId,
            threshold.productId,
            threshold.type,
            threshold.threshold,
            threshold.unit,
            threshold.isActive,
            threshold.createdAt,
            threshold.updatedAt
          ]
        );
      }
    }

    // Create user notification preferences
    console.log('Creating user notification preferences...');
    
    for (const user of users) {
      const preferences = {
        id: uuidv4(),
        userId: user.id,
        alertTypes: [AlertEventType.LOW_STOCK, AlertEventType.IMPENDING_EXPIRATION],
        channels: [
          { type: NotificationChannelType.EMAIL, enabled: true, config: {} },
          { type: NotificationChannelType.IN_APP, enabled: true, config: {} }
        ],
        minSeverity: AlertSeverity.MEDIUM,
        quietHours: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Admin users get all alert types and all channels
      if (user.name.toLowerCase().includes('admin')) {
        preferences.alertTypes = Object.values(AlertEventType);
        preferences.channels.push(
          { type: NotificationChannelType.SMS, enabled: false, config: {} },
          { type: NotificationChannelType.PUSH, enabled: false, config: {} }
        );
        preferences.minSeverity = AlertSeverity.LOW;
      }

      await db.query(
        `INSERT INTO user_notification_preferences 
         (id, user_id, alert_types, channels, min_severity, quiet_hours, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO NOTHING`,
        [
          preferences.id,
          preferences.userId,
          preferences.alertTypes,
          JSON.stringify(preferences.channels),
          preferences.minSeverity,
          preferences.quietHours,
          preferences.isActive,
          preferences.createdAt,
          preferences.updatedAt
        ]
      );
    }

    // Create sample alert events
    console.log('Creating sample alert events...');
    
    const alertTypes = [
      { type: AlertEventType.LOW_STOCK, severity: AlertSeverity.MEDIUM, title: 'Low Stock Alert' },
      { type: AlertEventType.IMPENDING_EXPIRATION, severity: AlertSeverity.HIGH, title: 'Impending Expiration' },
      { type: AlertEventType.SUPPLIER_ORDER_UPDATE, severity: AlertSeverity.MEDIUM, title: 'Supplier Order Update' }
    ];

    for (let i = 0; i < 10; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const product = products[Math.floor(Math.random() * products.length)];

      const alertEvent = {
        id: uuidv4(),
        type: alertType.type,
        severity: alertType.severity,
        title: `${alertType.title}: ${product.name}`,
        message: `Alert regarding ${product.name} at ${location.name}`,
        data: {
          productId: product.id,
          productName: product.name,
          locationId: location.id,
          locationName: location.name,
          currentQuantity: Math.floor(Math.random() * 10),
          threshold: 15
        },
        userId: users[Math.floor(Math.random() * users.length)].id,
        locationId: location.id,
        productId: product.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Last 7 days
        processedAt: new Date()
      };

      await db.query(
        `INSERT INTO alert_events 
         (id, type, severity, title, message, data, user_id, location_id, product_id, created_at, processed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          alertEvent.id,
          alertEvent.type,
          alertEvent.severity,
          alertEvent.title,
          alertEvent.message,
          JSON.stringify(alertEvent.data),
          alertEvent.userId,
          alertEvent.locationId,
          alertEvent.productId,
          alertEvent.createdAt,
          alertEvent.processedAt
        ]
      );

      // Create notifications for this alert
      for (const user of users.slice(0, 3)) { // Create notifications for first 3 users
        const channels = [NotificationChannelType.EMAIL, NotificationChannelType.IN_APP];
        
        for (const channelType of channels) {
          const notification = {
            id: uuidv4(),
            userId: user.id,
            alertEventId: alertEvent.id,
            channelType,
            status: Math.random() > 0.2 ? 'sent' : 'pending',
            sentAt: Math.random() > 0.2 ? new Date() : null,
            error: null,
            retryCount: 0,
            createdAt: alertEvent.createdAt
          };

          await db.query(
            `INSERT INTO notifications 
             (id, user_id, alert_event_id, channel_type, status, sent_at, error, retry_count, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              notification.id,
              notification.userId,
              notification.alertEventId,
              notification.channelType,
              notification.status,
              notification.sentAt,
              notification.error,
              notification.retryCount,
              notification.createdAt
            ]
          );
        }
      }

      // Create in-app notifications
      for (const user of users.slice(0, 2)) { // Create in-app notifications for first 2 users
        const inAppNotification = {
          id: uuidv4(),
          userId: user.id,
          title: alertEvent.title,
          message: alertEvent.message,
          severity: alertEvent.severity,
          read: Math.random() > 0.6, // 40% unread
          createdAt: alertEvent.createdAt,
          readAt: Math.random() > 0.6 ? new Date() : null
        };

        await db.query(
          `INSERT INTO in_app_notifications 
           (id, user_id, title, message, severity, read, created_at, read_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            inAppNotification.id,
            inAppNotification.userId,
            inAppNotification.title,
            inAppNotification.message,
            inAppNotification.severity,
            inAppNotification.read,
            inAppNotification.createdAt,
            inAppNotification.readAt
          ]
        );
      }
    }

    console.log('✅ Alerting data seeded successfully!');
    console.log(`   - Created ${products.length * locations.length} alert thresholds`);
    console.log(`   - Created ${users.length} user notification preferences`);
    console.log(`   - Created 10 sample alert events with notifications`);

  } catch (error) {
    console.error('❌ Error seeding alerting data:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAlertingData()
    .then(() => {
      console.log('🎉 Alerting seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Alerting seeding failed:', error);
      process.exit(1);
    });
}