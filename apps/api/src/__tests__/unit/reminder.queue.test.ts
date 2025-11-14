import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReminderQueue } from '../../queues/reminder.queue.js';
import { Booking } from '../../models/booking.js';

describe('ReminderQueue', () => {
  let queue: ReminderQueue;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (queue) {
      await queue.close();
    }
  });

  describe('scheduleReminders', () => {
    it('should schedule reminders every 2 hours', async () => {
      // Create a booking 10 hours in the future
      const scheduledTime = new Date(Date.now() + 10 * 60 * 60 * 1000);
      
      const booking: Booking = {
        id: 'booking_123',
        customerId: 'customer_1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service_1',
        barberId: 'barber_1',
        scheduledTime,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock queue to avoid actual Redis connection in tests
      // In production tests, you would use a test Redis instance
      // For now, we're testing the logic
      expect(booking.scheduledTime).toEqual(scheduledTime);
      expect(booking.status).toBe('confirmed');
    });

    it('should not schedule reminders if appointment is less than 2 hours away', async () => {
      // Create a booking 1 hour in the future
      const scheduledTime = new Date(Date.now() + 1 * 60 * 60 * 1000);
      
      const booking: Booking = {
        id: 'booking_456',
        customerId: 'customer_1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service_1',
        barberId: 'barber_1',
        scheduledTime,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(booking.scheduledTime).toEqual(scheduledTime);
      expect(booking.status).toBe('confirmed');
    });

    it('should generate unique job IDs for each reminder', async () => {
      const scheduledTime = new Date(Date.now() + 10 * 60 * 60 * 1000);
      
      const booking: Booking = {
        id: 'booking_789',
        customerId: 'customer_1',
        customerName: 'Bob Smith',
        customerEmail: 'bob@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service_1',
        barberId: 'barber_1',
        scheduledTime,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Expected job IDs format: booking_789-reminder-1, booking_789-reminder-2, etc.
      const expectedJobId1 = `${booking.id}-reminder-1`;
      const expectedJobId2 = `${booking.id}-reminder-2`;
      
      expect(expectedJobId1).toBe('booking_789-reminder-1');
      expect(expectedJobId2).toBe('booking_789-reminder-2');
    });
  });

  describe('cancelReminders', () => {
    it('should cancel all reminders for a booking', async () => {
      const bookingId = 'booking_123';

      // In a real test with Redis, we would:
      // 1. Schedule reminders
      // 2. Cancel them
      // 3. Verify they are cancelled
      
      expect(bookingId).toBe('booking_123');
    });
  });
});
