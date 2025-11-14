import { AlertProcessor } from '../services/alert-processor';
import { AlertEvent, EventType } from '../types';

describe('AlertProcessor', () => {
  let processor: AlertProcessor;

  beforeEach(() => {
    processor = new AlertProcessor();
  });

  describe('processEvent', () => {
    it('should trigger alert for low stock below critical threshold', () => {
      const event: AlertEvent = {
        id: 'test-1',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: { productName: 'Shampoo', stock: 3 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const result = processor.processEvent(event);
      
      expect(result.shouldAlert).toBe(true);
      expect(result.severity).toBe('CRITICAL');
      expect(result.channels).toContain('EMAIL');
      expect(result.channels).toContain('SMS');
      expect(result.channels).toContain('IN_APP');
    });

    it('should trigger alert for low stock below high threshold', () => {
      const event: AlertEvent = {
        id: 'test-2',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: { productName: 'Shampoo', stock: 7 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const result = processor.processEvent(event);
      
      expect(result.shouldAlert).toBe(true);
      expect(result.severity).toBe('HIGH');
      expect(result.channels).toContain('EMAIL');
      expect(result.channels).toContain('IN_APP');
      expect(result.channels).not.toContain('SMS');
    });

    it('should trigger alert for imminent expiration', () => {
      const event: AlertEvent = {
        id: 'test-3',
        type: 'IMMINENT_EXPIRATION',
        userId: 'user1',
        data: { productName: 'Hair Gel', daysUntilExpiration: 2 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const result = processor.processEvent(event);
      
      expect(result.shouldAlert).toBe(true);
      expect(result.severity).toBe('HIGH');
      expect(result.channels).toContain('EMAIL');
      expect(result.channels).toContain('IN_APP');
    });

    it('should trigger alert for delayed supplier order', () => {
      const event: AlertEvent = {
        id: 'test-4',
        type: 'SUPPLIER_ORDER_UPDATE',
        userId: 'user2',
        data: { orderId: 'ORD-123', status: 'DELAYED' },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const result = processor.processEvent(event);
      
      expect(result.shouldAlert).toBe(true);
      expect(result.severity).toBe('HIGH');
      expect(result.channels).toContain('EMAIL');
      expect(result.channels).toContain('IN_APP');
    });

    it('should not trigger alert for conditions not meeting thresholds', () => {
      const event: AlertEvent = {
        id: 'test-5',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: { productName: 'Shampoo', stock: 25 },
        severity: 'LOW',
        timestamp: new Date(),
        processed: false
      };

      const result = processor.processEvent(event);
      
      expect(result.shouldAlert).toBe(false);
    });
  });

  describe('generateAlertMessage', () => {
    it('should generate appropriate message for low stock', () => {
      const event: AlertEvent = {
        id: 'test-6',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: { productName: 'Shampoo', stock: 3 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const message = processor.generateAlertMessage(event, 'CRITICAL');
      
      expect(message.subject).toContain('Low Stock Alert');
      expect(message.content).toContain('Shampoo');
      expect(message.content).toContain('3');
    });

    it('should generate appropriate message for expiration', () => {
      const event: AlertEvent = {
        id: 'test-7',
        type: 'IMMINENT_EXPIRATION',
        userId: 'user1',
        data: { productName: 'Hair Gel', daysUntilExpiration: 2 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const message = processor.generateAlertMessage(event, 'HIGH');
      
      expect(message.subject).toContain('Product Expiration Alert');
      expect(message.content).toContain('Hair Gel');
      expect(message.content).toContain('2');
    });

    it('should generate appropriate message for supplier order', () => {
      const event: AlertEvent = {
        id: 'test-8',
        type: 'SUPPLIER_ORDER_UPDATE',
        userId: 'user2',
        data: { orderId: 'ORD-123', status: 'DELAYED' },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const message = processor.generateAlertMessage(event, 'HIGH');
      
      expect(message.subject).toContain('Supplier Order Update');
      expect(message.content).toContain('ORD-123');
      expect(message.content).toContain('DELAYED');
    });
  });

  describe('event storage', () => {
    it('should store and retrieve events', () => {
      const event: AlertEvent = {
        id: 'test-9',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: { productName: 'Shampoo', stock: 3 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      processor.storeEvent(event);
      const retrieved = processor.getEvent('test-9');
      
      expect(retrieved).toEqual(event);
    });

    it('should retrieve events by type', () => {
      const event1: AlertEvent = {
        id: 'test-10',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: { productName: 'Shampoo', stock: 3 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const event2: AlertEvent = {
        id: 'test-11',
        type: 'LOW_STOCK',
        userId: 'user2',
        data: { productName: 'Conditioner', stock: 5 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const event3: AlertEvent = {
        id: 'test-12',
        type: 'IMMINENT_EXPIRATION',
        userId: 'user1',
        data: { productName: 'Hair Gel', daysUntilExpiration: 2 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      processor.storeEvent(event1);
      processor.storeEvent(event2);
      processor.storeEvent(event3);

      const lowStockEvents = processor.getEventsByType('LOW_STOCK');
      const expirationEvents = processor.getEventsByType('IMMINENT_EXPIRATION');
      
      expect(lowStockEvents).toHaveLength(2);
      expect(expirationEvents).toHaveLength(1);
      expect(lowStockEvents.every(e => e.type === 'LOW_STOCK')).toBe(true);
    });

    it('should retrieve events by user', () => {
      const event1: AlertEvent = {
        id: 'test-13',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: { productName: 'Shampoo', stock: 3 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const event2: AlertEvent = {
        id: 'test-14',
        type: 'IMMINENT_EXPIRATION',
        userId: 'user1',
        data: { productName: 'Hair Gel', daysUntilExpiration: 2 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      const event3: AlertEvent = {
        id: 'test-15',
        type: 'LOW_STOCK',
        userId: 'user2',
        data: { productName: 'Conditioner', stock: 5 },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      processor.storeEvent(event1);
      processor.storeEvent(event2);
      processor.storeEvent(event3);

      const user1Events = processor.getEventsByUser('user1');
      const user2Events = processor.getEventsByUser('user2');
      
      expect(user1Events).toHaveLength(2);
      expect(user2Events).toHaveLength(1);
      expect(user1Events.every(e => e.userId === 'user1')).toBe(true);
    });
  });
});