const deepClone = (value) => JSON.parse(JSON.stringify(value));

const compositeKey = (itemId, locationId) => `${itemId}::${locationId}`;

const createEmptyState = () => ({
  items: {},
  locations: {},
  inventoryLevels: {},
  stockMovements: [],
  auditLogs: [],
  counters: {
    movement: 0,
    audit: 0,
  },
});

class TransactionContext {
  constructor(state) {
    this.state = state;
  }

  getItem(itemId) {
    const item = this.state.items[itemId];
    return item ? deepClone(item) : null;
  }

  findItemByBarcode(barcode) {
    const item = Object.values(this.state.items).find((entry) => entry.barcode === barcode);
    return item ? deepClone(item) : null;
  }

  setItem(item) {
    this.state.items[item.id] = deepClone(item);
    return deepClone(this.state.items[item.id]);
  }

  getLocation(locationId) {
    const location = this.state.locations[locationId];
    return location ? deepClone(location) : null;
  }

  setLocation(location) {
    this.state.locations[location.id] = deepClone(location);
    return deepClone(this.state.locations[location.id]);
  }

  getInventoryLevel(itemId, locationId) {
    const level = this.state.inventoryLevels[compositeKey(itemId, locationId)];
    return level ? deepClone(level) : null;
  }

  saveInventoryLevel(level) {
    const key = compositeKey(level.itemId, level.locationId);
    this.state.inventoryLevels[key] = deepClone(level);
    return deepClone(this.state.inventoryLevels[key]);
  }

  generateMovementId() {
    this.state.counters.movement += 1;
    return {
      id: `mov-${this.state.counters.movement}`,
      sequence: this.state.counters.movement,
    };
  }

  generateAuditId() {
    this.state.counters.audit += 1;
    return {
      id: `aud-${this.state.counters.audit}`,
      sequence: this.state.counters.audit,
    };
  }

  appendStockMovement(movement) {
    const { id, sequence } = this.generateMovementId();
    const entry = {
      ...movement,
      id: movement.id ?? id,
      sequence,
    };
    this.state.stockMovements.push(entry);
    return deepClone(entry);
  }

  appendAuditLog(log) {
    const { id, sequence } = this.generateAuditId();
    const entry = {
      ...log,
      id: log.id ?? id,
      sequence,
    };
    this.state.auditLogs.push(entry);
    return deepClone(entry);
  }

  listStockMovements() {
    return deepClone(this.state.stockMovements);
  }

  listAuditLogs() {
    return deepClone(this.state.auditLogs);
  }

  listInventoryLevels() {
    return Object.values(this.state.inventoryLevels).map((level) => deepClone(level));
  }
}

class InMemoryDatabase {
  constructor(initialState) {
    this.initialState = initialState ? deepClone(initialState) : createEmptyState();
    this.state = deepClone(this.initialState);
  }

  async runTransaction(callback) {
    const snapshot = deepClone(this.state);
    const tx = new TransactionContext(snapshot);

    try {
      const result = await callback(tx);
      this.state = snapshot;
      return result;
    } catch (error) {
      throw error;
    }
  }

  seed({ items = [], locations = [], inventoryLevels = [], stockMovements = [], auditLogs = [] } = {}) {
    const snapshot = deepClone(this.state);

    items.forEach((item) => {
      snapshot.items[item.id] = deepClone(item);
    });

    locations.forEach((location) => {
      snapshot.locations[location.id] = deepClone(location);
    });

    inventoryLevels.forEach((level) => {
      const key = compositeKey(level.itemId, level.locationId);
      snapshot.inventoryLevels[key] = deepClone(level);
    });

    stockMovements.forEach((movement) => {
      snapshot.stockMovements.push(deepClone(movement));
    });

    auditLogs.forEach((log) => {
      snapshot.auditLogs.push(deepClone(log));
    });

    this.state = snapshot;
  }

  reset() {
    this.state = deepClone(this.initialState);
  }

  getItem(itemId) {
    const item = this.state.items[itemId];
    return item ? deepClone(item) : null;
  }

  findItemByBarcode(barcode) {
    const item = Object.values(this.state.items).find((entry) => entry.barcode === barcode);
    return item ? deepClone(item) : null;
  }

  getLocation(locationId) {
    const location = this.state.locations[locationId];
    return location ? deepClone(location) : null;
  }

  getInventoryLevel(itemId, locationId) {
    const key = compositeKey(itemId, locationId);
    const level = this.state.inventoryLevels[key];
    return level ? deepClone(level) : null;
  }

  listInventoryLevels(filter = {}) {
    const { locationId, itemId } = filter;
    return Object.values(this.state.inventoryLevels)
      .filter((level) => {
        if (locationId && level.locationId !== locationId) {
          return false;
        }
        if (itemId && level.itemId !== itemId) {
          return false;
        }
        return true;
      })
      .map((level) => deepClone(level));
  }

  listStockMovements(filter = {}) {
    const {
      itemId,
      locationId,
      movementType,
      limit,
      since,
    } = filter;

    let movements = [...this.state.stockMovements];

    if (itemId) {
      movements = movements.filter((movement) => movement.itemId === itemId);
    }

    if (locationId) {
      movements = movements.filter((movement) => movement.locationId === locationId);
    }

    if (movementType) {
      movements = movements.filter((movement) => movement.movementType === movementType);
    }

    if (since) {
      const sinceDate = new Date(since);
      movements = movements.filter((movement) => new Date(movement.timestamp) >= sinceDate);
    }

    movements.sort((a, b) => {
      return (b.sequence || 0) - (a.sequence || 0);
    });

    if (limit) {
      movements = movements.slice(0, limit);
    }

    return movements.map((movement) => deepClone(movement));
  }

  listAuditLogs(filter = {}) {
    const { entityType, entityId, userId, limit, since } = filter;

    let logs = [...this.state.auditLogs];

    if (entityType) {
      logs = logs.filter((log) => log.entityType === entityType);
    }

    if (entityId) {
      logs = logs.filter((log) => log.entityId === entityId);
    }

    if (userId) {
      logs = logs.filter((log) => log.userId === userId);
    }

    if (since) {
      const sinceDate = new Date(since);
      logs = logs.filter((log) => new Date(log.timestamp) >= sinceDate);
    }

    logs.sort((a, b) => {
      return (b.sequence || 0) - (a.sequence || 0);
    });

    if (limit) {
      logs = logs.slice(0, limit);
    }

    return logs.map((log) => deepClone(log));
  }
}

const createDefaultDatabase = () => {
  const state = createEmptyState();
  const database = new InMemoryDatabase(state);

  database.seed({
    items: [
      {
        id: 'item-olive-oil',
        name: 'Extra Virgin Olive Oil (1L)',
        barcode: 'OLV-001',
        reorderPoint: 8,
        unit: 'bottle',
        category: 'pantry',
      },
      {
        id: 'item-flour',
        name: 'Flour (25kg bag)',
        barcode: 'FLR-025',
        reorderPoint: 6,
        unit: 'bag',
        category: 'bakery',
      },
      {
        id: 'item-tomato-sauce',
        name: 'Tomato Sauce (5L)',
        barcode: 'TMS-500',
        reorderPoint: 7,
        unit: 'case',
        category: 'pantry',
      },
    ],
    locations: [
      {
        id: 'loc-kitchen-east',
        name: 'East Kitchen',
        defaultLowStockThreshold: 5,
        lowStockMultiplier: 1.25,
        address: '123 East St',
      },
      {
        id: 'loc-kitchen-west',
        name: 'West Kitchen',
        defaultLowStockThreshold: 4,
        lowStockMultiplier: 1.1,
        address: '456 West Ave',
      },
      {
        id: 'loc-pantry-central',
        name: 'Central Pantry',
        defaultLowStockThreshold: 7,
        lowStockMultiplier: 1.5,
        address: '789 Central Blvd',
      },
    ],
    inventoryLevels: [
      {
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-east',
        quantity: 20,
        lowStockThreshold: 10,
      },
      {
        itemId: 'item-olive-oil',
        locationId: 'loc-kitchen-west',
        quantity: 12,
        lowStockThreshold: 7,
      },
      {
        itemId: 'item-flour',
        locationId: 'loc-kitchen-east',
        quantity: 11,
        lowStockThreshold: 9,
      },
      {
        itemId: 'item-flour',
        locationId: 'loc-pantry-central',
        quantity: 5,
        lowStockThreshold: 10,
      },
      {
        itemId: 'item-tomato-sauce',
        locationId: 'loc-pantry-central',
        quantity: 8,
        lowStockThreshold: 12,
      },
    ],
  });

  database.initialState = deepClone(database.state);

  return database;
};

module.exports = {
  InMemoryDatabase,
  TransactionContext,
  createDefaultDatabase,
};
