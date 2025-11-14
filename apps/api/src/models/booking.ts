export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  barberId: string;
  scheduledTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderJob {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  scheduledTime: Date;
  serviceName?: string;
  barberName?: string;
  reminderNumber: number; // 1st, 2nd, 3rd reminder
}

export interface ReminderJobData extends ReminderJob {
  jobId: string; // For idempotency
}
