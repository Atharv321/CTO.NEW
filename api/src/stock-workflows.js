const { createDefaultDatabase } = require('./data-store');

const db = createDefaultDatabase();

const MOVEMENT_TYPES = {
  RECEIVE: 'receive',
  CONSUME: 'consume',
  ADJUST: 'adjust',
};

const determineLowStockThreshold = (item, location, inventoryLevel) => {
  if (inventoryLevel && typeof inventoryLevel.lowStockThreshold === 'number') {
    return inventoryLevel.lowStockThreshold;
  }

  const reorderPoint = item?.reorderPoint ?? location?.defaultLowStockThreshold ?? 10;
  const multiplier = location?.lowStockMultiplier ?? 1;
  const threshold = Math.max(1, Math.round(reorderPoint * multiplier));

  return threshold;
};

const normalizeItemPayload = (item) => {
  if (!item) {
    return null;
  }

  const { id, name, barcode, unit, category, reorderPoint } = item;
  return {
    id,
    name,
    barcode,
    unit,
    category,
    reorderPoint,
  };
};

const normalizeLocationPayload = (location) => {
  if (!location) {
    return null;
  }

  const { id, name, address, defaultLowStockThreshold, lowStockMultiplier } = location;
  return {
    id,
    name,
    address,
    defaultLowStockThreshold,
    lowStockMultiplier,
  };
};

const processStockMovement = async ({
  barcode,
  itemId,
  movementType,
  quantity,
  reason,
  userId,
  barcodeReference,
  metadata,
  ipAddress,
  userAgent,
  locationId,
}) => {
  if (!Object.values(MOVEMENT_TYPES).includes(movementType)) {
    throw new Error(`Invalid movement type: ${movementType}`);
  }

  if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
    throw new Error('Quantity must be a number');
  }

  if (movementType === MOVEMENT_TYPES.ADJUST) {
    if (quantity < 0) {
      throw new Error('Quantity must be zero or a positive number');
    }
  } else if (quantity <= 0) {
    throw new Error('Quantity must be a positive number');
  }

  if (!itemId && !barcode) {
    throw new Error('Either itemId or barcode must be provided');
  }

  if (!locationId) {
    throw new Error('locationId is required');
  }

  return db.runTransaction(async (tx) => {
    let item = itemId ? tx.getItem(itemId) : null;

    if (!item && barcode) {
      item = tx.findItemByBarcode(barcode);
    }

    if (!item) {
      throw new Error('Item not found');
    }

    const resolvedItemId = item.id;

    const location = tx.getLocation(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    let inventoryLevel = tx.getInventoryLevel(resolvedItemId, locationId);

    if (!inventoryLevel) {
      if (movementType === MOVEMENT_TYPES.CONSUME) {
        throw new Error(`No inventory level found for item ${resolvedItemId} at location ${locationId}`);
      }

      inventoryLevel = {
        itemId: resolvedItemId,
        locationId,
        quantity: 0,
        lowStockThreshold: determineLowStockThreshold(item, location, null),
        createdAt: new Date().toISOString(),
      };
    }

    const previousQuantity = inventoryLevel.quantity;
    let newQuantity;

    switch (movementType) {
      case MOVEMENT_TYPES.RECEIVE:
        newQuantity = previousQuantity + quantity;
        break;
      case MOVEMENT_TYPES.CONSUME:
        newQuantity = previousQuantity - quantity;
        if (newQuantity < 0) {
          throw new Error('Insufficient inventory - cannot consume more than available');
        }
        break;
      case MOVEMENT_TYPES.ADJUST:
        newQuantity = quantity;
        break;
      default:
        throw new Error(`Unsupported movement type: ${movementType}`);
    }

    const timestamp = new Date().toISOString();
    const lowStockThreshold = determineLowStockThreshold(item, location, inventoryLevel);

    const updatedLevel = {
      ...inventoryLevel,
      quantity: newQuantity,
      lowStockThreshold,
      updatedAt: timestamp,
    };
    tx.saveInventoryLevel(updatedLevel);

    const movement = tx.appendStockMovement({
      itemId: resolvedItemId,
      locationId,
      movementType,
      quantity: movementType === MOVEMENT_TYPES.ADJUST ? newQuantity - previousQuantity : quantity,
      previousQuantity,
      newQuantity,
      reason,
      userId,
      barcodeReference,
      metadata,
      timestamp,
    });

    tx.appendAuditLog({
      entityType: 'inventory_item',
      entityId: resolvedItemId,
      action: `stock_${movementType}`,
      userId,
      changes: {
        locationId,
        movementType,
        previousQuantity,
        newQuantity,
        difference: newQuantity - previousQuantity,
        reason,
        barcodeReference,
        metadata,
      },
      ipAddress,
      userAgent,
      timestamp,
    });

    const isLowStock = newQuantity < lowStockThreshold;

    return {
      item: normalizeItemPayload(item),
      location: normalizeLocationPayload(location),
      movement,
      inventoryLevel: {
        itemId: updatedLevel.itemId,
        locationId: updatedLevel.locationId,
        quantity: updatedLevel.quantity,
        lowStockThreshold: updatedLevel.lowStockThreshold,
        isLowStock,
        updatedAt: updatedLevel.updatedAt,
      },
      previousQuantity,
      newQuantity,
      difference: newQuantity - previousQuantity,
      lowStockThreshold,
      isLowStock,
    };
  });
};

const receiveStock = async (params) =>
  processStockMovement({
    ...params,
    movementType: MOVEMENT_TYPES.RECEIVE,
  });

const consumeStock = async (params) =>
  processStockMovement({
    ...params,
    movementType: MOVEMENT_TYPES.CONSUME,
  });

const adjustStock = async (params) =>
  processStockMovement({
    ...params,
    movementType: MOVEMENT_TYPES.ADJUST,
  });

const getStockMovements = async ({ itemId, locationId, movementType, limit = 100, since } = {}) => {
  const movements = db.listStockMovements({ itemId, locationId, movementType, limit, since });

  return movements.map((movement) => {
    const item = db.getItem(movement.itemId);
    const location = db.getLocation(movement.locationId);

    return {
      ...movement,
      itemName: item?.name,
      itemBarcode: item?.barcode,
      locationName: location?.name,
    };
  });
};

const getAuditLogs = async ({ entityType, entityId, userId, limit = 100, since } = {}) =>
  db.listAuditLogs({ entityType, entityId, userId, limit, since });

const getLowStockItems = async ({ locationId } = {}) => {
  const levels = db.listInventoryLevels({ locationId });

  const lowStockItems = levels
    .filter((level) => level.quantity < level.lowStockThreshold)
    .map((level) => {
      const item = db.getItem(level.itemId);
      const location = db.getLocation(level.locationId);

      return {
        ...level,
        itemName: item?.name,
        itemBarcode: item?.barcode,
        locationName: location?.name,
        isLowStock: true,
        unitsBelowThreshold: level.lowStockThreshold - level.quantity,
      };
    })
    .sort((a, b) => b.unitsBelowThreshold - a.unitsBelowThreshold);

  return lowStockItems;
};

const computeLowStockThreshold = ({ reorderPoint, leadTime, safetyStock }) => {
  const baseThreshold = reorderPoint || 10;
  const leadTimeAdjustment = leadTime ? Math.ceil(leadTime / 7) * 2 : 0;
  const safetyStockAmount = safetyStock || 0;

  return baseThreshold + leadTimeAdjustment + safetyStockAmount;
};

const getInventoryStatus = async ({ locationId } = {}) => {
  const levels = db.listInventoryLevels({ locationId });

  return levels.map((level) => {
    const item = db.getItem(level.itemId);
    const location = db.getLocation(level.locationId);
    const isLowStock = level.quantity < level.lowStockThreshold;

    return {
      ...level,
      itemName: item?.name,
      itemBarcode: item?.barcode,
      locationName: location?.name,
      isLowStock,
      stockStatus: isLowStock ? 'low' : 'adequate',
    };
  });
};

const resetDatabase = () => {
  db.reset();
};

module.exports = {
  MOVEMENT_TYPES,
  receiveStock,
  consumeStock,
  adjustStock,
  getStockMovements,
  getAuditLogs,
  getLowStockItems,
  computeLowStockThreshold,
  getInventoryStatus,
  resetDatabase,
  db,
};
