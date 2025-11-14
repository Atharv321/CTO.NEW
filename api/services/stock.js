const DatabaseService = require('./database');

class StockService {
  constructor() {
    this.db = new DatabaseService();
  }

  // Stock movement operations
  async receiveStock(movementData) {
    const {
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName
    } = movementData;

    // Validate required fields
    this.validateMovementData(movementData, 'RECEIVE');

    try {
      const movementId = await this.db.processStockReceive({
        productId,
        locationId,
        quantity: parseFloat(quantity),
        referenceNumber,
        barcode,
        reason,
        userId: userId || 'system',
        userName: userName || 'System',
        metadata: movementData.metadata || {}
      });

      // Get updated inventory
      const inventory = await this.db.getInventory(productId, locationId);
      
      return {
        success: true,
        movementId,
        inventory,
        message: 'Stock received successfully'
      };
    } catch (error) {
      throw new Error(`Failed to receive stock: ${error.message}`);
    }
  }

  async consumeStock(movementData) {
    const {
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName
    } = movementData;

    // Validate required fields
    this.validateMovementData(movementData, 'CONSUME');

    try {
      const movementId = await this.db.processStockConsume({
        productId,
        locationId,
        quantity: parseFloat(quantity),
        referenceNumber,
        barcode,
        reason,
        userId: userId || 'system',
        userName: userName || 'System',
        metadata: movementData.metadata || {}
      });

      // Get updated inventory
      const inventory = await this.db.getInventory(productId, locationId);
      
      return {
        success: true,
        movementId,
        inventory,
        message: 'Stock consumed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to consume stock: ${error.message}`);
    }
  }

  async adjustStock(movementData) {
    const {
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName
    } = movementData;

    // Validate required fields
    this.validateMovementData(movementData, 'ADJUST');

    try {
      const movementId = await this.db.processStockAdjust({
        productId,
        locationId,
        quantity: parseFloat(quantity),
        referenceNumber,
        barcode,
        reason,
        userId: userId || 'system',
        userName: userName || 'System',
        metadata: movementData.metadata || {}
      });

      // Get updated inventory
      const inventory = await this.db.getInventory(productId, locationId);
      
      return {
        success: true,
        movementId,
        inventory,
        message: 'Stock adjusted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to adjust stock: ${error.message}`);
    }
  }

  // Stock query operations
  async getStockHistory(filters = {}) {
    try {
      const history = await this.db.getStockMovementHistory(filters);
      return {
        success: true,
        data: history,
        count: history.length
      };
    } catch (error) {
      throw new Error(`Failed to get stock history: ${error.message}`);
    }
  }

  async getInventory(productId, locationId) {
    try {
      const inventory = await this.db.getInventory(productId, locationId);
      return {
        success: true,
        data: inventory
      };
    } catch (error) {
      throw new Error(`Failed to get inventory: ${error.message}`);
    }
  }

  async getAllInventory(limit = 100, offset = 0) {
    try {
      const inventory = await this.db.getAllInventory(limit, offset);
      return {
        success: true,
        data: inventory,
        count: inventory.length
      };
    } catch (error) {
      throw new Error(`Failed to get all inventory: ${error.message}`);
    }
  }

  // Low stock operations
  async getLowStockAlerts(locationId = null) {
    try {
      const alerts = await this.db.getLowStockAlerts(locationId);
      return {
        success: true,
        data: alerts,
        count: alerts.length
      };
    } catch (error) {
      throw new Error(`Failed to get low stock alerts: ${error.message}`);
    }
  }

  async updateLowStockThreshold(productId, locationId, threshold, userId, userName) {
    try {
      const result = await this.db.updateLowStockThreshold(
        productId, locationId, parseFloat(threshold), userId, userName
      );
      
      return {
        success: true,
        message: 'Low stock threshold updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update low stock threshold: ${error.message}`);
    }
  }

  // Audit log operations
  async getAuditLog(filters = {}) {
    try {
      const auditLog = await this.db.getAuditLog(filters);
      return {
        success: true,
        data: auditLog,
        count: auditLog.length
      };
    } catch (error) {
      throw new Error(`Failed to get audit log: ${error.message}`);
    }
  }

  // Product operations
  async createProduct(productData) {
    const { sku, name, description, barcode } = productData;

    if (!sku || !name) {
      throw new Error('SKU and name are required');
    }

    try {
      const product = await this.db.createProduct({ sku, name, description, barcode });
      return {
        success: true,
        data: product,
        message: 'Product created successfully'
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Product with this SKU already exists');
      }
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async getProduct(id) {
    try {
      const product = await this.db.getProductById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return {
        success: true,
        data: product
      };
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async getProducts(limit = 100, offset = 0) {
    try {
      const products = await this.db.getProducts(limit, offset);
      return {
        success: true,
        data: products,
        count: products.length
      };
    } catch (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  // Location operations
  async createLocation(locationData) {
    const { name, description, address } = locationData;

    if (!name) {
      throw new Error('Location name is required');
    }

    try {
      const location = await this.db.createLocation({ name, description, address });
      return {
        success: true,
        data: location,
        message: 'Location created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }
  }

  async getLocation(id) {
    try {
      const location = await this.db.getLocationById(id);
      if (!location) {
        throw new Error('Location not found');
      }
      return {
        success: true,
        data: location
      };
    } catch (error) {
      throw new Error(`Failed to get location: ${error.message}`);
    }
  }

  async getLocations(limit = 100, offset = 0) {
    try {
      const locations = await this.db.getLocations(limit, offset);
      return {
        success: true,
        data: locations,
        count: locations.length
      };
    } catch (error) {
      throw new Error(`Failed to get locations: ${error.message}`);
    }
  }

  // Helper methods
  validateMovementData(movementData, movementType) {
    const { productId, locationId, quantity, reason } = movementData;

    if (!productId) {
      throw new Error('Product ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }
    if (!reason) {
      throw new Error('Reason is required');
    }

    // Additional validation by movement type
    if (movementType === 'CONSUME') {
      // For consume operations, we'll let the database function handle stock level validation
    } else if (movementType === 'RECEIVE') {
      // For receive operations, quantity must be positive (already validated above)
    } else if (movementType === 'ADJUST') {
      // For adjust operations, quantity can be any number (including negative)
      if (isNaN(quantity)) {
        throw new Error('Quantity must be a valid number for adjustment');
      }
    }
  }

  async close() {
    await this.db.close();
  }
}

module.exports = StockService;