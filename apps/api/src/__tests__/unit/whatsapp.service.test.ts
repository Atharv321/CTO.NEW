import { describe, it, expect, beforeEach } from 'vitest';
import { WhatsAppService } from '../../services/whatsapp.service.js';

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    service = new WhatsAppService();
  });

  describe('sendMessage', () => {
    it('should successfully send a message with valid phone number', async () => {
      const message = {
        to: '+1234567890',
        body: 'Test message',
      };

      const result = await service.sendMessage(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should reject invalid phone number format', async () => {
      const message = {
        to: '1234567890', // Missing +
        body: 'Test message',
      };

      const result = await service.sendMessage(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should reject phone number without country code', async () => {
      const message = {
        to: '+0123456789', // Invalid country code starting with 0
        body: 'Test message',
      };

      const result = await service.sendMessage(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should accept valid international phone numbers', async () => {
      const validNumbers = [
        '+1234567890',
        '+447911123456', // UK
        '+91987654321', // India
        '+61412345678', // Australia
      ];

      for (const number of validNumbers) {
        const result = await service.sendMessage({
          to: number,
          body: 'Test',
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('healthCheck', () => {
    it('should return unhealthy when not configured', async () => {
      const service = new WhatsAppService({});
      const health = await service.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.message).toContain('not configured');
    });

    it('should return healthy when configured', async () => {
      const service = new WhatsAppService({
        accountSid: 'test_sid',
        authToken: 'test_token',
        fromNumber: '+1234567890',
      });

      const health = await service.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.message).toContain('ready');
    });
  });
});
