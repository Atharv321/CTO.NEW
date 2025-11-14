import { z } from 'zod';

// Event types that can trigger alerts
export const EventType = {
  LOW_STOCK: 'LOW_STOCK',
  IMMINENT_EXPIRATION: 'IMMINENT_EXPIRATION',
  SUPPLIER_ORDER_UPDATE: 'SUPPLIER_ORDER_UPDATE'
} as const;

export const EventTypeSchema = z.enum([
  'LOW_STOCK',
  'IMMINENT_EXPIRATION',
  'SUPPLIER_ORDER_UPDATE'
]);

export type EventType = z.infer<typeof EventTypeSchema>;

// Notification channels
export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP'
} as const;

export const NotificationChannelSchema = z.enum([
  'EMAIL',
  'SMS',
  'PUSH',
  'IN_APP'
]);

export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

// User notification preferences
export const UserNotificationPreferenceSchema = z.object({
  userId: z.string(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  preferences: z.record(EventTypeSchema, z.array(NotificationChannelSchema)),
  isEnabled: z.boolean().default(true)
});

export type UserNotificationPreference = z.infer<typeof UserNotificationPreferenceSchema>;

// Alert event payload
export const AlertEventSchema = z.object({
  id: z.string(),
  type: EventTypeSchema,
  userId: z.string(),
  data: z.record(z.any()),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  timestamp: z.date(),
  processed: z.boolean().default(false)
});

export type AlertEvent = z.infer<typeof AlertEventSchema>;

// Notification message
export const NotificationMessageSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  channel: NotificationChannelSchema,
  subject: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  sent: z.boolean().optional(),
  sentAt: z.date().optional(),
  error: z.string().optional()
});

export type NotificationMessage = z.infer<typeof NotificationMessageSchema>;

// Channel adapter interface
export interface ChannelAdapter {
  send(message: NotificationMessage): Promise<boolean>;
  validateConfig(): Promise<boolean>;
}

// Queue job data
export const QueueJobSchema = z.object({
  eventId: z.string(),
  userId: z.string().optional(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3)
});

export type QueueJob = z.infer<typeof QueueJobSchema>;

// Threshold configuration
export const ThresholdConfigSchema = z.object({
  eventType: EventTypeSchema,
  thresholds: z.array(z.object({
    condition: z.string(), // e.g., "stock < 10"
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    channels: z.array(NotificationChannelSchema)
  }))
});

export type ThresholdConfig = z.infer<typeof ThresholdConfigSchema>;