const itemService = require('../itemService');
const pool = require('../../db/connection');

jest.mock('../../db/connection');

describe('ItemService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createItem', () => {
    test('should create a new item', async () => {
      const itemData = {
        sku: 'SKU-001',
        barcode: 'BAR-001',
        name: 'Widget A',
        description: 'A test widget',
        category_id: 1,
        supplier_id: 1,
        unit_cost: 10.0,
        unit_price: 20.0,
      };

      const mockItem = { id: 1, ...itemData };

      pool.query.mockResolvedValueOnce({ rows: [mockItem] });

      const result = await itemService.createItem(itemData, 1);

      expect(result).toEqual(mockItem);
      expect(pool.query).toHaveBeenCalled();
    });

    test('should throw error if SKU already exists', async () => {
      const error = new Error('Duplicate key');
      error.code = '23505';
      error.constraint = 'items_sku_key';
      pool.query.mockRejectedValueOnce(error);

      const itemData = { sku: 'SKU-001', name: 'Widget', category_id: 1 };

      await expect(itemService.createItem(itemData, 1)).rejects.toThrow('SKU');
    });

    test('should throw error if category is invalid', async () => {
      const error = new Error('Invalid category_id');
      error.code = '23503';
      pool.query.mockRejectedValueOnce(error);

      const itemData = { sku: 'SKU-001', name: 'Widget', category_id: 999 };

      await expect(itemService.createItem(itemData, 1)).rejects.toThrow('Invalid');
    });
  });

  describe('getItems', () => {
    test('should fetch items with pagination', async () => {
      const mockItems = [
        { id: 1, sku: 'SKU-001', name: 'Widget A' },
        { id: 2, sku: 'SKU-002', name: 'Widget B' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockItems });

      const result = await itemService.getItems(20, 0);

      expect(result).toEqual(mockItems);
    });

    test('should filter items by search', async () => {
      const mockItems = [{ id: 1, sku: 'SKU-001', name: 'Widget A' }];

      pool.query.mockResolvedValueOnce({ rows: mockItems });

      const result = await itemService.getItems(20, 0, { search: 'Widget' });

      expect(result).toEqual(mockItems);
    });

    test('should filter items by category', async () => {
      const mockItems = [{ id: 1, sku: 'SKU-001', name: 'Widget', category_id: 1 }];

      pool.query.mockResolvedValueOnce({ rows: mockItems });

      const result = await itemService.getItems(20, 0, { category_id: 1 });

      expect(result).toEqual(mockItems);
    });
  });

  describe('getItemById', () => {
    test('should fetch an item by ID', async () => {
      const mockItem = { id: 1, sku: 'SKU-001', name: 'Widget', category_name: 'Electronics' };

      pool.query.mockResolvedValueOnce({ rows: [mockItem] });

      const result = await itemService.getItemById(1);

      expect(result).toEqual(mockItem);
    });

    test('should return null if item not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await itemService.getItemById(999);

      expect(result).toBeNull();
    });
  });

  describe('getItemBySku', () => {
    test('should fetch an item by SKU', async () => {
      const mockItem = { id: 1, sku: 'SKU-001', name: 'Widget' };

      pool.query.mockResolvedValueOnce({ rows: [mockItem] });

      const result = await itemService.getItemBySku('SKU-001');

      expect(result).toEqual(mockItem);
    });
  });

  describe('getItemByBarcode', () => {
    test('should fetch an item by barcode', async () => {
      const mockItem = { id: 1, barcode: 'BAR-001', name: 'Widget' };

      pool.query.mockResolvedValueOnce({ rows: [mockItem] });

      const result = await itemService.getItemByBarcode('BAR-001');

      expect(result).toEqual(mockItem);
    });
  });

  describe('updateItem', () => {
    test('should update an item', async () => {
      const mockUpdatedItem = {
        id: 1,
        sku: 'SKU-001',
        name: 'Updated Widget',
        category_id: 1,
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedItem] });

      const result = await itemService.updateItem(1, { name: 'Updated Widget' });

      expect(result).toEqual(mockUpdatedItem);
    });
  });

  describe('deleteItem', () => {
    test('should soft delete an item', async () => {
      const mockDeletedItem = { id: 1, sku: 'SKU-001', name: 'Widget', active: false };

      pool.query.mockResolvedValueOnce({ rows: [mockDeletedItem] });

      const result = await itemService.deleteItem(1);

      expect(result).toEqual(mockDeletedItem);
    });
  });

  describe('searchItems', () => {
    test('should search items by query', async () => {
      const mockResults = [
        { id: 1, sku: 'SKU-001', name: 'Widget' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockResults });

      const result = await itemService.searchItems('Widget');

      expect(result).toEqual(mockResults);
    });
  });

  describe('getItemCount', () => {
    test('should return total count of items', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ total: '25' }] });

      const result = await itemService.getItemCount();

      expect(result).toBe(25);
    });
  });
});
