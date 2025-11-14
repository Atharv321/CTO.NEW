export interface NotificationEvent {
  id: string;
  type: 'low_stock' | 'impending_expiration' | 'supplier_order_update';
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
}

export interface UserNotificationPreferences {
  userId: string;
  channels: NotificationChannel[];
  eventTypes: NotificationEvent['type'][];
  quietHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  minPriority: NotificationEvent['priority'];
}

export interface NotificationMessage {
  id: string;
  eventId: string;
  userId: string;
  channel: NotificationChannel['type'];
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  createdAt: Date;
  sentAt?: Date;
}

export interface NotificationAdapter {
  send(message: NotificationMessage): Promise<boolean>;
}

export interface AlertThreshold {
  type: 'low_stock' | 'impending_expiration';
  value: number;
  unit: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationEvent['type'];
  priority: NotificationEvent['priority'];
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}