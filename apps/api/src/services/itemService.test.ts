import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { itemService } from './itemService';
import * as db from '../db';

vi.mock('../db', () => ({
  query: vi.fn(),
}));

describe('ItemService', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('createItem', () => {
    it('should create an inventory item successfully', async () => {
      const mockItem = {
        id: 'item-1',
        sku: 'SKU-001',
        barcode: '123456789',
        name: 'Widget A',
        description: 'A premium widget',
        category_id: 'cat-1',
        supplier_id: 'sup-1',
        price: 29.99,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockItem] });

      const result = await itemService.createItem({
        sku: 'SKU-001',
        barcode: '123456789',
        name: 'Widget A',
        description: 'A premium widget',
        categoryId: 'cat-1',
        supplierId: 'sup-1',
        price: 29.99,
      });

      expect(result).toMatchObject({
        id: 'item-1',
        sku: 'SKU-001',
        barcode: '123456789',
        name: 'Widget A',
        categoryId: 'cat-1',
      });
    });
  });

  describe('getItems', () => {
    it('should retrieve paginated items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          sku: 'SKU-001',
          barcode: '123456789',
          name: 'Widget A',
          description: 'A premium widget',
          category_id: 'cat-1',
          supplier_id: 'sup-1',
          price: 29.99,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (db.query as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockItems });

      const result = await itemService.getItems({ page: 1, limit: 10, offset: 0 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('getItemByBarcode', () => {
    it('should retrieve an item by barcode', async () => {
      const mockItem = {
        id: 'item-1',
        sku: 'SKU-001',
        barcode: '123456789',
        name: 'Widget A',
        category_id: 'cat-1',
        supplier_id: 'sup-1',
        price: 29.99,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockItem] });

      const result = await itemService.getItemByBarcode('123456789');

      expect(result?.barcode).toBe('123456789');
      expect(result?.name).toBe('Widget A');
    });

    it('should return null if item not found by barcode', async () => {
      (db.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await itemService.getItemByBarcode('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getItemBySku', () => {
    it('should retrieve an item by SKU', async () => {
      const mockItem = {
        id: 'item-1',
        sku: 'SKU-001',
        barcode: '123456789',
        name: 'Widget A',
        category_id: 'cat-1',
        supplier_id: 'sup-1',
        price: 29.99,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockItem] });

      const result = await itemService.getItemBySku('SKU-001');

      expect(result?.sku).toBe('SKU-001');
    });
  });

  describe('searchItems', () => {
    it('should search items by name', async () => {
      const mockItems = [
        {
          id: 'item-1',
          sku: 'SKU-001',
          barcode: '123456789',
          name: 'Widget A',
          category_id: 'cat-1',
          supplier_id: 'sup-1',
          price: 29.99,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (db.query as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockItems });

      const result = await itemService.searchItems('Widget', { page: 1, limit: 10, offset: 0 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toContain('Widget');
    });
  });

  describe('getItemsByCategory', () => {
    it('should retrieve items by category', async () => {
      const mockItems = [
        {
          id: 'item-1',
          sku: 'SKU-001',
          barcode: '123456789',
          name: 'Widget A',
          category_id: 'cat-1',
          supplier_id: 'sup-1',
          price: 29.99,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (db.query as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockItems });

      const result = await itemService.getItemsByCategory('cat-1', { page: 1, limit: 10, offset: 0 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].categoryId).toBe('cat-1');
    });
  });

  describe('updateItem', () => {
    it('should update an item successfully', async () => {
      const mockItem = {
        id: 'item-1',
        sku: 'SKU-001-UPDATED',
        barcode: '123456789',
        name: 'Updated Widget',
        category_id: 'cat-1',
        supplier_id: 'sup-1',
        price: 39.99,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockItem] });

      const result = await itemService.updateItem('item-1', {
        sku: 'SKU-001-UPDATED',
        name: 'Updated Widget',
        price: 39.99,
      });

      expect(result?.name).toBe('Updated Widget');
      expect(result?.price).toBe(39.99);
    });
  });

  describe('deleteItem', () => {
    it('should delete an item successfully', async () => {
      (db.query as any).mockResolvedValueOnce({ rowCount: 1 });

      const result = await itemService.deleteItem('item-1');

      expect(result).toBe(true);
    });

    it('should return false if item not found', async () => {
      (db.query as any).mockResolvedValueOnce({ rowCount: 0 });

      const result = await itemService.deleteItem('non-existent');

      expect(result).toBe(false);
    });
  });
});
