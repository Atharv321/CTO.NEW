const stockService = require('../stockService');
const pool = require('../../db/connection');

jest.mock('../../db/connection');

describe('StockService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStockLevel', () => {
    test('should fetch stock level for item and location', async () => {
      const mockStock = {
        id: 1,
        item_id: 1,
        location_id: 1,
        quantity_on_hand: 100,
        quantity_reserved: 10,
        quantity_available: 90,
      };

      pool.query.mockResolvedValueOnce({ rows: [mockStock] });

      const result = await stockService.getStockLevel(1, 1);

      expect(result).toEqual(mockStock);
    });

    test('should return null if stock not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await stockService.getStockLevel(999, 999);

      expect(result).toBeNull();
    });
  });

  describe('getStockByItem', () => {
    test('should fetch all stock levels for an item', async () => {
      const mockStock = [
        { item_id: 1, location_id: 1, quantity_on_hand: 50, location_name: 'Warehouse A' },
        { item_id: 1, location_id: 2, quantity_on_hand: 30, location_name: 'Warehouse B' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockStock });

      const result = await stockService.getStockByItem(1);

      expect(result).toEqual(mockStock);
    });
  });

  describe('getStockByLocation', () => {
    test('should fetch stock for a location with pagination', async () => {
      const mockStock = [
        { item_id: 1, location_id: 1, quantity_on_hand: 50, item_name: 'Widget' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockStock });

      const result = await stockService.getStockByLocation(1, 20, 0);

      expect(result).toEqual(mockStock);
    });
  });

  describe('adjustStock', () => {
    test('should adjust stock and create movement record', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      pool.connect.mockResolvedValueOnce(mockClient);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ quantity_on_hand: 100 }] }) // SELECT
        .mockResolvedValueOnce({}) // UPDATE
        .mockResolvedValueOnce({ rows: [{ id: 1, quantity: 5 }] }) // INSERT movement
        .mockResolvedValueOnce({}); // COMMIT

      const result = await stockService.adjustStock(1, 1, 5, 'receipt', 1, 'test', 'ref-123');

      expect(result).toEqual({ id: 1, quantity: 5 });
      expect(mockClient.query).toHaveBeenCalled();
    });

    test('should rollback on error', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      pool.connect.mockResolvedValueOnce(mockClient);

      const error = new Error('Test error');
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(error); // SELECT fails

      await expect(stockService.adjustStock(1, 1, 5, 'receipt', 1)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('createInitialStock', () => {
    test('should create initial stock level', async () => {
      const mockStock = { item_id: 1, location_id: 1, quantity_on_hand: 100 };

      pool.query
        .mockResolvedValueOnce({}) // INSERT stock
        .mockResolvedValueOnce({}) // INSERT movement
        .mockResolvedValueOnce({ rows: [mockStock] }); // SELECT

      const result = await stockService.createInitialStock(1, 1, 100, 1);

      expect(result).toEqual(mockStock);
    });

    test('should throw error if stock already exists', async () => {
      const error = new Error('Duplicate');
      error.code = '23505';
      pool.query.mockRejectedValueOnce(error);

      await expect(stockService.createInitialStock(1, 1, 100, 1)).rejects.toThrow(
        'already exists'
      );
    });
  });

  describe('getTotalStockByItem', () => {
    test('should return total stock summary for item', async () => {
      const mockSummary = {
        total_on_hand: '500',
        total_reserved: '50',
        total_available: '450',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockSummary] });

      const result = await stockService.getTotalStockByItem(1);

      expect(result).toEqual({
        totalOnHand: 500,
        totalReserved: 50,
        totalAvailable: 450,
      });
    });
  });

  describe('getLocationSummary', () => {
    test('should return summary for location', async () => {
      const mockSummary = {
        total_items: 50,
        total_quantity: 5000,
        below_reorder_count: 5,
      };

      pool.query.mockResolvedValueOnce({ rows: [mockSummary] });

      const result = await stockService.getLocationSummary(1);

      expect(result).toEqual(mockSummary);
    });
  });
});
