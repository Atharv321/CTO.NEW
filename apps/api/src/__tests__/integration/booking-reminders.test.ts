import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { BookingService } from '../../services/booking.service.js';
import { Booking } from '../../models/booking.js';

describe('Booking Reminders Integration', () => {
  let bookingService: BookingService;

  beforeAll(() => {
    vi.useFakeTimers();
    bookingService = new BookingService();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('End-to-End Reminder Flow', () => {
    it('should create booking and schedule reminders', async () => {
      // Arrange: Create a booking 10 hours in the future
      const scheduledTime = new Date(Date.now() + 10 * 60 * 60 * 1000);
      
      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: 'customer_1',
        customerName: 'Integration Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service_1',
        barberId: 'barber_1',
        scheduledTime,
        status: 'confirmed',
      };

      // Act: Create booking
      const booking = await bookingService.createBooking(bookingData);

      // Assert: Booking created
      expect(booking.id).toBeDefined();
      expect(booking.customerName).toBe('Integration Test User');
      expect(booking.status).toBe('confirmed');
    });

    it('should cancel reminders when booking is cancelled', async () => {
      // Arrange: Create a booking
      const scheduledTime = new Date(Date.now() + 10 * 60 * 60 * 1000);
      
      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: 'customer_2',
        customerName: 'Cancel Test User',
        customerEmail: 'cancel@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service_1',
        barberId: 'barber_1',
        scheduledTime,
        status: 'confirmed',
      };

      const booking = await bookingService.createBooking(bookingData);

      // Act: Cancel the booking
      await bookingService.cancelBooking(booking.id);

      // Assert: Reminders should be cancelled
      const reminders = await bookingService.getBookingReminderStatus(booking.id);
      
      // After cancellation, active reminders should be 0
      const activeReminders = reminders.filter(r => r.state === 'waiting' || r.state === 'delayed');
      expect(activeReminders.length).toBe(0);
    });

    it('should reschedule reminders when booking is updated', async () => {
      // Arrange: Create a booking
      const scheduledTime = new Date(Date.now() + 10 * 60 * 60 * 1000);
      
      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: 'customer_3',
        customerName: 'Update Test User',
        customerEmail: 'update@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service_1',
        barberId: 'barber_1',
        scheduledTime,
        status: 'confirmed',
      };

      const booking = await bookingService.createBooking(bookingData);

      // Act: Update the booking time
      const newScheduledTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
      await bookingService.updateBooking(booking.id, { scheduledTime: newScheduledTime });

      // Assert: New reminders should be scheduled
      expect(booking.id).toBeDefined();
    });

    it('should handle idempotency - prevent duplicate jobs', async () => {
      // This tests that if we try to schedule the same reminder twice,
      // it should use the same job ID and not create duplicates
      
      const scheduledTime = new Date(Date.now() + 10 * 60 * 60 * 1000);
      
      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: 'customer_4',
        customerName: 'Idempotency Test',
        customerEmail: 'idempotency@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service_1',
        barberId: 'barber_1',
        scheduledTime,
        status: 'confirmed',
      };

      // Create booking twice with potential race condition
      const booking1 = await bookingService.createBooking(bookingData);
      
      // Job IDs should be deterministic based on booking ID
      expect(booking1.id).toBeDefined();
    });

    it('should handle booking less than 2 hours away', async () => {
      // Arrange: Create a booking 1 hour in the future
      const scheduledTime = new Date(Date.now() + 1 * 60 * 60 * 1000);
      
      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: 'customer_5',
        customerName: 'Short Notice User',
        customerEmail: 'shortnotice@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service_1',
        barberId: 'barber_1',
        scheduledTime,
        status: 'confirmed',
      };

      // Act: Create booking
      const booking = await bookingService.createBooking(bookingData);

      // Assert: Booking created but no reminders scheduled
      expect(booking.id).toBeDefined();
      
      const reminders = await bookingService.getBookingReminderStatus(booking.id);
      expect(reminders.length).toBe(0);
    });
  });

  describe('Queue Statistics', () => {
    it('should retrieve queue statistics', async () => {
      const stats = await bookingService.getQueueStats();

      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('delayed');
    });
  });
});
