const {
  receiveStock,
  consumeStock,
  adjustStock,
  getStockMovements,
  getAuditLogs,
  getLowStockItems,
  computeLowStockThreshold,
  getInventoryStatus,
  MOVEMENT_TYPES,
  db,
} = require('./stock-workflows');

describe('Stock Workflows - ACID Transactions', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('receiveStock', () => {
    it('should atomically receive stock and create audit log', async () => {
      const result = await receiveStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 10,
        reason: 'New shipment from supplier',
        userId: 'user-123',
        barcodeReference: 'SHIP-001',
      });

      expect(result.success).not.toBe(false);
      expect(result.previousQuantity).toBe(20);
      expect(result.newQuantity).toBe(30);
      expect(result.difference).toBe(10);
      expect(result.movement).toMatchObject({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        movementType: 'receive',
        quantity: 10,
      });

      const movements = await getStockMovements({ itemId: 'item-olive-oil' });
      expect(movements).toHaveLength(1);
      expect(movements[0].movementType).toBe('receive');

      const auditLogs = await getAuditLogs({ entityId: 'item-olive-oil' });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('stock_receive');
      expect(auditLogs[0].userId).toBe('user-123');
    });

    it('should correctly track low stock status after receiving', async () => {
      const result = await receiveStock({
        itemId: 'item-flour',
        locationId: 'loc-pantry-central',
        quantity: 10,
        reason: 'Restock',
        userId: 'user-456',
      });

      expect(result.isLowStock).toBe(false);
      expect(result.newQuantity).toBe(15);
      expect(result.lowStockThreshold).toBe(10);
    });
  });

  describe('consumeStock', () => {
    it('should atomically consume stock and create audit log', async () => {
      const result = await consumeStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 5,
        reason: 'Used in kitchen prep',
        userId: 'user-789',
        barcodeReference: 'CONS-001',
      });

      expect(result.previousQuantity).toBe(20);
      expect(result.newQuantity).toBe(15);
      expect(result.difference).toBe(-5);
      expect(result.isLowStock).toBe(false);

      const movements = await getStockMovements({ itemId: 'item-olive-oil' });
      expect(movements).toHaveLength(1);
      expect(movements[0].movementType).toBe('consume');
    });

    it('should prevent consuming more than available (transaction rollback)', async () => {
      await expect(
        consumeStock({
          itemId: 'item-flour',
          locationId: 'loc-pantry-central',
          quantity: 100,
          reason: 'Attempted overconsumption',
          userId: 'user-999',
        })
      ).rejects.toThrow('Insufficient inventory');

      const inventory = await getInventoryStatus({ locationId: 'loc-pantry-central' });
      const flourLevel = inventory.find(
        (item) => item.itemId === 'item-flour' && item.locationId === 'loc-pantry-central'
      );
      expect(flourLevel.quantity).toBe(5);

      const movements = await getStockMovements({ itemId: 'item-flour' });
      expect(movements).toHaveLength(0);

      const auditLogs = await getAuditLogs({ entityId: 'item-flour' });
      expect(auditLogs).toHaveLength(0);
    });

    it('should detect low stock after consumption', async () => {
      const result = await consumeStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 15,
        reason: 'Large batch cooking',
        userId: 'user-chef',
      });

      expect(result.newQuantity).toBe(5);
      expect(result.isLowStock).toBe(true);
      expect(result.lowStockThreshold).toBe(10);

      const lowStockItems = await getLowStockItems({ locationId: 'loc-kitchen-east' });
      expect(lowStockItems.length).toBeGreaterThan(0);
      expect(lowStockItems.some((item) => item.itemId === 'item-olive-oil')).toBe(true);
    });
  });

  describe('adjustStock', () => {
    it('should atomically adjust stock to exact quantity', async () => {
      const result = await adjustStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-west',
        quantity: 25,
        reason: 'Inventory count correction',
        userId: 'user-manager',
        barcodeReference: 'ADJ-001',
      });

      expect(result.previousQuantity).toBe(12);
      expect(result.newQuantity).toBe(25);
      expect(result.difference).toBe(13);

      const movements = await getStockMovements({ itemId: 'item-olive-oil', locationId: 'loc-kitchen-west' });
      expect(movements).toHaveLength(1);
      expect(movements[0].movementType).toBe('adjust');
      expect(movements[0].quantity).toBe(13);
    });

    it('should handle downward adjustment and audit it', async () => {
      const result = await adjustStock({
        itemId: 'item-flour',
        locationId: 'loc-kitchen-east',
        quantity: 5,
        reason: 'Damaged goods removed',
        userId: 'user-supervisor',
      });

      expect(result.previousQuantity).toBe(11);
      expect(result.newQuantity).toBe(5);
      expect(result.difference).toBe(-6);

      const auditLogs = await getAuditLogs({ entityId: 'item-flour' });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].changes.difference).toBe(-6);
    });
  });

  describe('Transaction isolation and atomicity', () => {
    it('should process multiple operations sequentially with correct audit trail', async () => {
      await receiveStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 10,
        reason: 'Shipment 1',
        userId: 'user-1',
      });

      await consumeStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 5,
        reason: 'Usage 1',
        userId: 'user-2',
      });

      await adjustStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 22,
        reason: 'Inventory audit',
        userId: 'user-3',
      });

      const inventory = await getInventoryStatus({ locationId: 'loc-kitchen-east' });
      const oliveOilLevel = inventory.find((item) => item.itemId === 'item-olive-oil');
      expect(oliveOilLevel.quantity).toBe(22);

      const movements = await getStockMovements({ itemId: 'item-olive-oil', locationId: 'loc-kitchen-east' });
      expect(movements).toHaveLength(3);
      expect(movements[0].movementType).toBe('adjust');
      expect(movements[1].movementType).toBe('consume');
      expect(movements[2].movementType).toBe('receive');

      const auditLogs = await getAuditLogs({ entityId: 'item-olive-oil' });
      expect(auditLogs).toHaveLength(3);
    });

    it('should rollback transaction on error without persisting any changes', async () => {
      const initialInventory = await getInventoryStatus({ locationId: 'loc-kitchen-east' });
      const initialFlour = initialInventory.find((item) => item.itemId === 'item-flour');
      const initialQuantity = initialFlour.quantity;

      await expect(
        consumeStock({
          itemId: 'item-flour',
          locationId: 'loc-kitchen-east',
          quantity: 999,
          reason: 'Should fail',
          userId: 'user-fail',
        })
      ).rejects.toThrow();

      const finalInventory = await getInventoryStatus({ locationId: 'loc-kitchen-east' });
      const finalFlour = finalInventory.find((item) => item.itemId === 'item-flour');
      expect(finalFlour.quantity).toBe(initialQuantity);

      const movements = await getStockMovements({ itemId: 'item-flour' });
      expect(movements).toHaveLength(0);

      const auditLogs = await getAuditLogs({ entityId: 'item-flour' });
      expect(auditLogs).toHaveLength(0);
    });
  });

  describe('getLowStockItems', () => {
    it('should return items below threshold with correct calculations', async () => {
      const lowStockItems = await getLowStockItems();

      expect(lowStockItems.length).toBeGreaterThan(0);
      lowStockItems.forEach((item) => {
        expect(item.quantity).toBeLessThan(item.lowStockThreshold);
        expect(item.isLowStock).toBe(true);
        expect(item.unitsBelowThreshold).toBe(item.lowStockThreshold - item.quantity);
      });
    });

    it('should filter low stock items by location', async () => {
      const pantryLowStock = await getLowStockItems({ locationId: 'loc-pantry-central' });

      pantryLowStock.forEach((item) => {
        expect(item.locationId).toBe('loc-pantry-central');
      });
    });

    it('should sort items by urgency (units below threshold)', async () => {
      const lowStockItems = await getLowStockItems();

      for (let i = 1; i < lowStockItems.length; i++) {
        expect(lowStockItems[i - 1].unitsBelowThreshold).toBeGreaterThanOrEqual(
          lowStockItems[i].unitsBelowThreshold
        );
      }
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filters', async () => {
      await receiveStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 10,
        userId: 'user-alice',
      });

      await consumeStock({
        itemId: 'item-flour',
        locationId: 'loc-kitchen-east',
        quantity: 2,
        userId: 'user-bob',
      });

      const allLogs = await getAuditLogs({});
      expect(allLogs.length).toBeGreaterThanOrEqual(2);

      const aliceLogs = await getAuditLogs({ userId: 'user-alice' });
      expect(aliceLogs).toHaveLength(1);
      expect(aliceLogs[0].userId).toBe('user-alice');

      const oilLogs = await getAuditLogs({ entityId: 'item-olive-oil' });
      expect(oilLogs).toHaveLength(1);
      expect(oilLogs[0].entityId).toBe('item-olive-oil');
    });

    it('should include complete change details in audit logs', async () => {
      await adjustStock({
        itemId: 'item-tomato-sauce',
        locationId: 'loc-pantry-central',
        quantity: 15,
        reason: 'Manual count',
        userId: 'user-audit',
        barcodeReference: 'AUDIT-123',
      });

      const logs = await getAuditLogs({ entityId: 'item-tomato-sauce' });
      expect(logs).toHaveLength(1);

      const log = logs[0];
      expect(log.action).toBe('stock_adjust');
      expect(log.changes).toHaveProperty('previousQuantity', 8);
      expect(log.changes).toHaveProperty('newQuantity', 15);
      expect(log.changes).toHaveProperty('difference', 7);
      expect(log.changes).toHaveProperty('reason', 'Manual count');
      expect(log.changes).toHaveProperty('barcodeReference', 'AUDIT-123');
    });
  });

  describe('computeLowStockThreshold', () => {
    it('should compute threshold with default values', () => {
      const threshold = computeLowStockThreshold({});
      expect(threshold).toBe(10);
    });

    it('should compute threshold with reorder point', () => {
      const threshold = computeLowStockThreshold({ reorderPoint: 15 });
      expect(threshold).toBe(15);
    });

    it('should compute threshold with lead time adjustment', () => {
      const threshold = computeLowStockThreshold({
        reorderPoint: 10,
        leadTime: 14,
      });
      expect(threshold).toBe(10 + 4);
    });

    it('should compute threshold with all parameters', () => {
      const threshold = computeLowStockThreshold({
        reorderPoint: 20,
        leadTime: 21,
        safetyStock: 5,
      });
      expect(threshold).toBe(20 + 6 + 5);
    });
  });

  describe('getStockMovements', () => {
    it('should retrieve stock movements with enriched data', async () => {
      await receiveStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 10,
        userId: 'user-123',
      });

      const movements = await getStockMovements({ itemId: 'item-olive-oil' });
      expect(movements).toHaveLength(1);
      expect(movements[0]).toHaveProperty('itemName', 'Extra Virgin Olive Oil (1L)');
      expect(movements[0]).toHaveProperty('itemBarcode', 'OLV-001');
      expect(movements[0]).toHaveProperty('locationName', 'East Kitchen');
    });

    it('should filter movements by type', async () => {
      await receiveStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 10,
        userId: 'user-1',
      });

      await consumeStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 3,
        userId: 'user-2',
      });

      const receiveMovements = await getStockMovements({
        itemId: 'item-olive-oil',
        movementType: 'receive',
      });
      expect(receiveMovements).toHaveLength(1);
      expect(receiveMovements[0].movementType).toBe('receive');

      const consumeMovements = await getStockMovements({
        itemId: 'item-olive-oil',
        movementType: 'consume',
      });
      expect(consumeMovements).toHaveLength(1);
      expect(consumeMovements[0].movementType).toBe('consume');
    });
  });

  describe('User attribution and metadata', () => {
    it('should track user attribution in movements and audit logs', async () => {
      await receiveStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 5,
        reason: 'Delivery',
        userId: 'user-warehouse-001',
        barcodeReference: 'DEL-456',
        metadata: { deliveryNote: 'DN-789', supplier: 'Acme Foods' },
      });

      const movements = await getStockMovements({ itemId: 'item-olive-oil' });
      expect(movements[0].userId).toBe('user-warehouse-001');
      expect(movements[0].barcodeReference).toBe('DEL-456');
      expect(movements[0].metadata).toEqual({
        deliveryNote: 'DN-789',
        supplier: 'Acme Foods',
      });

      const auditLogs = await getAuditLogs({ userId: 'user-warehouse-001' });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].userId).toBe('user-warehouse-001');
    });

    it('should capture IP address and user agent in audit logs', async () => {
      await receiveStock({
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 5,
        userId: 'user-web',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      });

      const auditLogs = await getAuditLogs({ userId: 'user-web' });
      expect(auditLogs[0].ipAddress).toBe('192.168.1.100');
      expect(auditLogs[0].userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('Error handling', () => {
    it('should reject invalid movement type', async () => {
      await expect(
        receiveStock({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 0,
          userId: 'user-1',
        })
      ).rejects.toThrow('Quantity must be a positive number');
    });

    it('should reject missing required fields', async () => {
      await expect(
        receiveStock({
          locationId: 'loc-kitchen-east',
          quantity: 10,
          userId: 'user-1',
        })
      ).rejects.toThrow('Either itemId or barcode must be provided');

      await expect(
        receiveStock({
          itemId: 'item-olive-oil',
          quantity: 10,
          userId: 'user-1',
        })
      ).rejects.toThrow('locationId is required');
    });

    it('should reject non-existent item', async () => {
      await expect(
        receiveStock({
          itemId: 'non-existent-item',
          locationId: 'loc-kitchen-east',
          quantity: 10,
          userId: 'user-1',
        })
      ).rejects.toThrow('Item not found');
    });

    it('should reject non-existent location', async () => {
      await expect(
        receiveStock({
          itemId: 'item-olive-oil',
          locationId: 'non-existent-location',
          quantity: 10,
          userId: 'user-1',
        })
      ).rejects.toThrow('Location not found');
    });
  });
});
