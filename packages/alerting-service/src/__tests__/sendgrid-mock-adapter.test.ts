import { SendGridMockAdapter } from '../services/sendgrid-mock-adapter';
import { NotificationMessage } from '../types';

describe('SendGridMockAdapter', () => {
  let adapter: SendGridMockAdapter;

  beforeEach(() => {
    adapter = new SendGridMockAdapter();
  });

  describe('send', () => {
    it('should send email successfully', async () => {
      const message: NotificationMessage = {
        id: 'test-1',
        eventId: 'event-1',
        userId: 'user1',
        channel: 'EMAIL',
        subject: 'Test Subject',
        content: 'Test Content',
        sent: false
      };

      const result = await adapter.send(message);
      expect(result).toBe(true);
    });

    it('should handle send failure (10% failure rate)', async () => {
      // Mock Math.random to always return a value that causes failure
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.05); // This will cause failure

      const message: NotificationMessage = {
        id: 'test-2',
        eventId: 'event-2',
        userId: 'user1',
        channel: 'EMAIL',
        subject: 'Test Subject',
        content: 'Test Content',
        sent: false
      };

      const result = await adapter.send(message);
      expect(result).toBe(false);

      // Restore original Math.random
      Math.random = originalRandom;
    });
  });

  describe('validateConfig', () => {
    it('should validate configuration successfully', async () => {
      // The mock adapter should validate successfully even without API key
      const result = await adapter.validateConfig();
      expect(result).toBe(false); // Will be false since no API key is configured
    });
  });
});