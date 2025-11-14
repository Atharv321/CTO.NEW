const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://devuser:devpassword@localhost:5432/appdb',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query(text, params) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  }

  async getClient() {
    return await this.pool.connect();
  }

  // Product operations
  async createProduct(product) {
    const { sku, name, description, barcode } = product;
    const query = `
      INSERT INTO products (sku, name, description, barcode)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.query(query, [sku, name, description, barcode]);
    return result.rows[0];
  }

  async getProductById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async getProductBySku(sku) {
    const query = 'SELECT * FROM products WHERE sku = $1';
    const result = await this.query(query, [sku]);
    return result.rows[0];
  }

  async getProducts(limit = 100, offset = 0) {
    const query = 'SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await this.query(query, [limit, offset]);
    return result.rows;
  }

  // Location operations
  async createLocation(location) {
    const { name, description, address } = location;
    const query = `
      INSERT INTO locations (name, description, address)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.query(query, [name, description, address]);
    return result.rows[0];
  }

  async getLocationById(id) {
    const query = 'SELECT * FROM locations WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async getLocations(limit = 100, offset = 0) {
    const query = 'SELECT * FROM locations ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await this.query(query, [limit, offset]);
    return result.rows;
  }

  // Inventory operations
  async getInventory(productId, locationId) {
    const query = `
      SELECT i.*, p.sku, p.name as product_name, p.barcode, 
             l.name as location_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE i.product_id = $1 AND i.location_id = $2
    `;
    const result = await this.query(query, [productId, locationId]);
    return result.rows[0];
  }

  async getAllInventory(limit = 100, offset = 0) {
    const query = `
      SELECT i.*, p.sku, p.name as product_name, p.barcode, 
             l.name as location_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      ORDER BY i.updated_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await this.query(query, [limit, offset]);
    return result.rows;
  }

  // Stock movement operations
  async processStockReceive(movementData) {
    const {
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName, metadata
    } = movementData;

    const query = `
      SELECT process_stock_receive(
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) as movement_id
    `;
    const result = await this.query(query, [
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName, metadata
    ]);
    return result.rows[0].movement_id;
  }

  async processStockConsume(movementData) {
    const {
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName, metadata
    } = movementData;

    const query = `
      SELECT process_stock_consume(
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) as movement_id
    `;
    const result = await this.query(query, [
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName, metadata
    ]);
    return result.rows[0].movement_id;
  }

  async processStockAdjust(movementData) {
    const {
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName, metadata
    } = movementData;

    const query = `
      SELECT process_stock_adjust(
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) as movement_id
    `;
    const result = await this.query(query, [
      productId, locationId, quantity, referenceNumber, barcode,
      reason, userId, userName, metadata
    ]);
    return result.rows[0].movement_id;
  }

  async getStockMovementHistory(filters = {}) {
    const {
      productId, locationId, movementType, startDate, endDate,
      limit = 100, offset = 0
    } = filters;

    const query = `
      SELECT * FROM get_stock_movement_history(
        $1, $2, $3, $4, $5, $6, $7
      )
    `;
    const result = await this.query(query, [
      productId, locationId, movementType, startDate, endDate, limit, offset
    ]);
    return result.rows;
  }

  // Low stock operations
  async getLowStockAlerts(locationId = null) {
    const query = 'SELECT * FROM get_low_stock_alerts($1)';
    const result = await this.query(query, [locationId]);
    return result.rows;
  }

  async updateLowStockThreshold(productId, locationId, threshold, userId, userName) {
    const query = 'SELECT update_low_stock_threshold($1, $2, $3, $4, $5) as result';
    const result = await this.query(query, [productId, locationId, threshold, userId, userName]);
    return result.rows[0].result;
  }

  // Audit log operations
  async getAuditLog(filters = {}) {
    const {
      tableName, recordId, action, userId, startDate, endDate,
      limit = 100, offset = 0
    } = filters;

    let query = `
      SELECT al.*, 
             CASE 
               WHEN al.table_name = 'inventory' THEN 
                 (SELECT json_build_object(
                   'sku', p.sku, 
                   'product_name', p.name,
                   'location_name', l.name
                 ) FROM inventory i 
                 JOIN products p ON i.product_id = p.id 
                 JOIN locations l ON i.location_id = l.id 
                 WHERE i.id = al.record_id)
               ELSE NULL
             end as context
      FROM audit_log al
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (tableName) {
      query += ` AND al.table_name = $${paramIndex++}`;
      params.push(tableName);
    }
    if (recordId) {
      query += ` AND al.record_id = $${paramIndex++}`;
      params.push(recordId);
    }
    if (action) {
      query += ` AND al.action = $${paramIndex++}`;
      params.push(action);
    }
    if (userId) {
      query += ` AND al.user_id = $${paramIndex++}`;
      params.push(userId);
    }
    if (startDate) {
      query += ` AND al.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND al.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.query(query, params);
    return result.rows;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = DatabaseService;