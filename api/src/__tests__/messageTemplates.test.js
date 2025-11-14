const { generateMessage, getTemplateNames } = require('../utils/messageTemplates');

describe('Message Templates', () => {
  describe('generateMessage', () => {
    it('should generate booking confirmation message', () => {
      const data = {
        customerName: 'John Doe',
        phone: '+1234567890',
        appointmentTime: '2024-01-15 10:00 AM',
        barberName: 'Jane Smith',
      };

      const message = generateMessage('booking_confirmation', data);

      expect(message).toContain('New Booking Alert');
      expect(message).toContain('John Doe');
      expect(message).toContain('+1234567890');
      expect(message).toContain('2024-01-15 10:00 AM');
      expect(message).toContain('Jane Smith');
    });

    it('should generate booking reminder message', () => {
      const data = {
        customerName: 'John Doe',
        appointmentTime: '2024-01-15 10:00 AM',
      };

      const message = generateMessage('booking_reminder', data);

      expect(message).toContain('Reminder');
      expect(message).toContain('John Doe');
      expect(message).toContain('2024-01-15 10:00 AM');
    });

    it('should generate booking cancellation message', () => {
      const data = {
        customerName: 'John Doe',
        appointmentTime: '2024-01-15 10:00 AM',
      };

      const message = generateMessage('booking_cancellation', data);

      expect(message).toContain('Cancelled');
      expect(message).toContain('John Doe');
      expect(message).toContain('2024-01-15 10:00 AM');
    });

    it('should throw error for invalid template', () => {
      expect(() => {
        generateMessage('invalid_template', {});
      }).toThrow("Template 'invalid_template' not found");
    });
  });

  describe('getTemplateNames', () => {
    it('should return all available template names', () => {
      const names = getTemplateNames();

      expect(names).toContain('booking_confirmation');
      expect(names).toContain('booking_reminder');
      expect(names).toContain('booking_cancellation');
      expect(names.length).toBeGreaterThan(0);
    });
  });
});
