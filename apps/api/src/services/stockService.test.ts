import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { stockService } from './stockService';
import * as db from '../db';

vi.mock('../db', () => ({
  query: vi.fn(),
}));

describe('StockService', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('getStockLevel', () => {
    it('should retrieve stock level for item at location', async () => {
      const mockStock = {
        id: 'stock-1',
        item_id: 'item-1',
        location_id: 'loc-1',
        quantity: 100,
        reorder_level: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockStock] });

      const result = await stockService.getStockLevel('item-1', 'loc-1');

      expect(result).toMatchObject({
        id: 'stock-1',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 100,
      });
    });

    it('should return null if stock level not found', async () => {
      (db.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await stockService.getStockLevel('item-1', 'loc-1');

      expect(result).toBeNull();
    });
  });

  describe('getItemStockByLocation', () => {
    it('should retrieve all stock levels for an item', async () => {
      const mockStocks = [
        {
          id: 'stock-1',
          item_id: 'item-1',
          location_id: 'loc-1',
          quantity: 100,
          reorder_level: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'stock-2',
          item_id: 'item-1',
          location_id: 'loc-2',
          quantity: 50,
          reorder_level: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (db.query as any).mockResolvedValueOnce({ rows: mockStocks });

      const result = await stockService.getItemStockByLocation('item-1');

      expect(result).toHaveLength(2);
      expect(result[0].itemId).toBe('item-1');
    });
  });

  describe('createOrUpdateStockLevel', () => {
    it('should create or update stock level', async () => {
      const mockStock = {
        id: 'stock-1',
        item_id: 'item-1',
        location_id: 'loc-1',
        quantity: 100,
        reorder_level: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockStock] });

      const result = await stockService.createOrUpdateStockLevel({
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 100,
        reorderLevel: 10,
      });

      expect(result).toMatchObject({
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 100,
      });
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock and create adjustment record', async () => {
      const mockAdjustment = {
        id: 'adj-1',
        item_id: 'item-1',
        location_id: 'loc-1',
        adjustment: 5,
        reason: 'scanned_entry',
        notes: 'Manual count',
        adjusted_by: 'user-123',
        created_at: new Date(),
      };

      const mockStock = {
        id: 'stock-1',
        item_id: 'item-1',
        location_id: 'loc-1',
        quantity: 105,
        reorder_level: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any)
        .mockResolvedValueOnce({ rows: [mockAdjustment] })
        .mockResolvedValueOnce({ rows: [mockStock] });

      const result = await stockService.adjustStock({
        itemId: 'item-1',
        locationId: 'loc-1',
        adjustment: 5,
        reason: 'scanned_entry',
        notes: 'Manual count',
        adjustedBy: 'user-123',
      });

      expect(result.adjustment.adjustment).toBe(5);
      expect(result.stockLevel.quantity).toBe(105);
    });
  });

  describe('getAdjustmentHistory', () => {
    it('should retrieve adjustment history', async () => {
      const mockAdjustments = [
        {
          id: 'adj-1',
          item_id: 'item-1',
          location_id: 'loc-1',
          adjustment: 5,
          reason: 'scanned_entry',
          notes: null,
          adjusted_by: 'user-123',
          created_at: new Date(),
        },
      ];

      (db.query as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockAdjustments });

      const result = await stockService.getAdjustmentHistory('item-1', 'loc-1', {
        page: 1,
        limit: 10,
        offset: 0,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].adjustment).toBe(5);
    });
  });

  describe('getLowStockItems', () => {
    it('should retrieve low stock items at location', async () => {
      const mockStocks = [
        {
          id: 'stock-1',
          item_id: 'item-1',
          location_id: 'loc-1',
          quantity: 5,
          reorder_level: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (db.query as any).mockResolvedValueOnce({ rows: mockStocks });

      const result = await stockService.getLowStockItems('loc-1');

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBeLessThanOrEqual(result[0].reorderLevel);
    });
  });
});
