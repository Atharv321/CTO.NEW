const pool = require('../connection');

const itemQueries = {
  // Get all items with pagination
  async findAll(options = {}) {
    const { page = 1, limit = 50, category = null, status = 'active', search = null } = options;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM items WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (category) {
      query += ` AND category = $${paramCount}`;
      values.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR sku ILIKE $${paramCount} OR barcode ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM items WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
      countParamCount++;
    }

    if (category) {
      countQuery += ` AND category = $${countParamCount}`;
      countValues.push(category);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamCount} OR sku ILIKE $${countParamCount} OR barcode ILIKE $${countParamCount})`;
      countValues.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Get item by ID
  async findById(id) {
    const query = 'SELECT * FROM items WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Get item by SKU
  async findBySku(sku) {
    const query = 'SELECT * FROM items WHERE sku = $1';
    const result = await pool.query(query, [sku]);
    return result.rows[0];
  },

  // Get item by barcode
  async findByBarcode(barcode) {
    const query = 'SELECT * FROM items WHERE barcode = $1';
    const result = await pool.query(query, [barcode]);
    return result.rows[0];
  },

  // Create item
  async create(itemData) {
    const { sku, barcode, name, description, unit_price, quantity, location, category, status } = itemData;
    const query = `
      INSERT INTO items (sku, barcode, name, description, unit_price, quantity, location, category, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [sku, barcode, name, description, unit_price, quantity || 0, location, category, status || 'active'];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Update item
  async update(id, itemData) {
    const { sku, barcode, name, description, unit_price, quantity, location, category, status } = itemData;
    const query = `
      UPDATE items
      SET sku = COALESCE($1, sku),
          barcode = COALESCE($2, barcode),
          name = COALESCE($3, name),
          description = COALESCE($4, description),
          unit_price = COALESCE($5, unit_price),
          quantity = COALESCE($6, quantity),
          location = COALESCE($7, location),
          category = COALESCE($8, category),
          status = COALESCE($9, status)
      WHERE id = $10
      RETURNING *
    `;
    const values = [sku, barcode, name, description, unit_price, quantity, location, category, status, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Adjust stock quantity
  async adjustStock(id, adjustment, reason = 'manual') {
    const query = `
      UPDATE items
      SET quantity = quantity + $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [adjustment, id]);
    return result.rows[0];
  },

  // Delete item
  async delete(id) {
    const query = 'DELETE FROM items WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Get low stock items
  async findLowStock(threshold = 10) {
    const query = `
      SELECT * FROM items 
      WHERE quantity <= $1 AND status = 'active'
      ORDER BY quantity ASC
    `;
    const result = await pool.query(query, [threshold]);
    return result.rows;
  }
};

module.exports = itemQueries;
