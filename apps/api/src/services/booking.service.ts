import { Booking } from '../models/booking.js';
import { reminderQueue } from '../queues/reminder.queue.js';
import { WhatsAppMessageTemplates } from '../templates/whatsapp-messages.js';
import { whatsappService } from './whatsapp.service.js';

/**
 * Service for managing bookings and their reminders
 */
export class BookingService {
  /**
   * Create a new booking and schedule reminders
   */
  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    // Generate booking ID
    const bookingId = this.generateBookingId();

    const booking: Booking = {
      ...bookingData,
      id: bookingId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production, save to database
    console.log(`[BookingService] Created booking ${booking.id}`);

    // Schedule reminders
    try {
      const jobIds = await reminderQueue.scheduleReminders(booking);
      console.log(`[BookingService] Scheduled ${jobIds.length} reminder(s) for booking ${booking.id}`);
    } catch (error) {
      console.error(`[BookingService] Failed to schedule reminders for booking ${booking.id}:`, error);
      // Don't fail the booking creation if reminder scheduling fails
    }

    return booking;
  }

  /**
   * Update a booking and reschedule reminders
   */
  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    // In production, fetch from database and update
    console.log(`[BookingService] Updating booking ${bookingId}`);

    // Cancel existing reminders
    await this.cancelBookingReminders(bookingId);

    // Create updated booking object
    const updatedBooking: Booking = {
      id: bookingId,
      customerId: updates.customerId || '',
      customerName: updates.customerName || '',
      customerEmail: updates.customerEmail || '',
      customerPhone: updates.customerPhone || '',
      serviceId: updates.serviceId || '',
      barberId: updates.barberId || '',
      scheduledTime: updates.scheduledTime || new Date(),
      status: updates.status || 'confirmed',
      createdAt: updates.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // If still confirmed, reschedule reminders
    if (updatedBooking.status === 'confirmed') {
      try {
        const jobIds = await reminderQueue.scheduleReminders(updatedBooking);
        console.log(`[BookingService] Rescheduled ${jobIds.length} reminder(s) for booking ${bookingId}`);
      } catch (error) {
        console.error(`[BookingService] Failed to reschedule reminders for booking ${bookingId}:`, error);
      }
    }

    return updatedBooking;
  }

  /**
   * Cancel a booking and its reminders
   */
  async cancelBooking(bookingId: string): Promise<void> {
    console.log(`[BookingService] Cancelling booking ${bookingId}`);

    // In production, update database status
    // const booking = await db.bookings.update(bookingId, { status: 'cancelled' });

    // Cancel all reminders
    await this.cancelBookingReminders(bookingId);

    // Optionally send cancellation confirmation
    // const message = WhatsAppMessageTemplates.formatCancellationMessage(
    //   booking.customerName,
    //   booking.customerPhone,
    //   booking.scheduledTime
    // );
    // await whatsappService.sendMessage(message);
  }

  /**
   * Cancel all reminders for a booking
   */
  async cancelBookingReminders(bookingId: string): Promise<number> {
    try {
      const cancelledCount = await reminderQueue.cancelReminders(bookingId);
      console.log(`[BookingService] Cancelled ${cancelledCount} reminder(s) for booking ${bookingId}`);
      return cancelledCount;
    } catch (error) {
      console.error(`[BookingService] Failed to cancel reminders for booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Get reminder status for a booking
   */
  async getBookingReminderStatus(bookingId: string): Promise<Array<{ jobId: string; state: string; scheduledFor: Date }>> {
    return reminderQueue.getReminderStatus(bookingId);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return reminderQueue.getStats();
  }

  /**
   * Generate a unique booking ID
   */
  private generateBookingId(): string {
    return `booking_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Singleton instance
export const bookingService = new BookingService();
