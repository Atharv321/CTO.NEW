import { describe, it, expect } from 'vitest';
import { WhatsAppMessageTemplates } from '../../templates/whatsapp-messages.js';
import { ReminderJob } from '../../models/booking.js';

describe('WhatsAppMessageTemplates', () => {
  describe('formatReminderMessage', () => {
    it('should format a basic reminder message', () => {
      const reminder: ReminderJob = {
        bookingId: 'booking_123',
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        scheduledTime: new Date('2024-12-31T10:00:00Z'),
        reminderNumber: 1,
      };

      const message = WhatsAppMessageTemplates.formatReminderMessage(reminder);

      expect(message.to).toBe('+1234567890');
      expect(message.body).toContain('Hello John Doe!');
      expect(message.body).toContain('upcoming appointment');
      expect(message.body).toContain('Reply CANCEL to cancel');
    });

    it('should include service name when provided', () => {
      const reminder: ReminderJob = {
        bookingId: 'booking_123',
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        scheduledTime: new Date('2024-12-31T10:00:00Z'),
        serviceName: 'Haircut',
        reminderNumber: 1,
      };

      const message = WhatsAppMessageTemplates.formatReminderMessage(reminder);

      expect(message.body).toContain('Service: Haircut');
    });

    it('should include barber name when provided', () => {
      const reminder: ReminderJob = {
        bookingId: 'booking_123',
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        scheduledTime: new Date('2024-12-31T10:00:00Z'),
        barberName: 'Mike Smith',
        reminderNumber: 1,
      };

      const message = WhatsAppMessageTemplates.formatReminderMessage(reminder);

      expect(message.body).toContain('Barber: Mike Smith');
    });

    it('should include both service and barber when provided', () => {
      const reminder: ReminderJob = {
        bookingId: 'booking_123',
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        scheduledTime: new Date('2024-12-31T10:00:00Z'),
        serviceName: 'Haircut',
        barberName: 'Mike Smith',
        reminderNumber: 1,
      };

      const message = WhatsAppMessageTemplates.formatReminderMessage(reminder);

      expect(message.body).toContain('Service: Haircut');
      expect(message.body).toContain('Barber: Mike Smith');
    });
  });

  describe('formatCancellationMessage', () => {
    it('should format a cancellation message', () => {
      const message = WhatsAppMessageTemplates.formatCancellationMessage(
        'John Doe',
        '+1234567890',
        new Date('2024-12-31T10:00:00Z')
      );

      expect(message.to).toBe('+1234567890');
      expect(message.body).toContain('Hello John Doe');
      expect(message.body).toContain('has been cancelled');
      expect(message.body).toContain('contact us to reschedule');
    });
  });
});
