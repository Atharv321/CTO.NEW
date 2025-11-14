const pool = require('../db/connection');

class ItemService {
  async createItem(itemData, userId) {
    const { sku, barcode, name, description, category_id, supplier_id, unit_cost, unit_price, reorder_level, lead_time_days } = itemData;

    try {
      const result = await pool.query(
        `INSERT INTO items (sku, barcode, name, description, category_id, supplier_id, unit_cost, unit_price, reorder_level, lead_time_days, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [sku, barcode, name, description, category_id, supplier_id, unit_cost, unit_price, reorder_level, lead_time_days, userId]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'items_sku_key') {
          throw new Error(`SKU '${sku}' already exists`);
        }
        if (error.constraint === 'items_barcode_key') {
          throw new Error(`Barcode '${barcode}' already exists`);
        }
      }
      if (error.code === '23503') {
        throw new Error('Invalid category_id or supplier_id');
      }
      throw error;
    }
  }

  async getItems(limit, offset, filters = {}, locationId = null) {
    let query = `SELECT i.* FROM items i WHERE i.active = true`;
    const params = [];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (i.name ILIKE $${params.length} OR i.sku ILIKE $${params.length} OR i.barcode ILIKE $${params.length})`;
    }

    if (filters.category_id) {
      params.push(filters.category_id);
      query += ` AND i.category_id = $${params.length}`;
    }

    if (filters.supplier_id) {
      params.push(filters.supplier_id);
      query += ` AND i.supplier_id = $${params.length}`;
    }

    if (locationId) {
      query += ` AND EXISTS (SELECT 1 FROM stock_levels WHERE item_id = i.id AND location_id = $${params.length + 1} AND quantity_available > 0)`;
      params.push(locationId);
    }

    query += ` ORDER BY i.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getItemCount(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM items WHERE active = true';
    const params = [];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length} OR barcode ILIKE $${params.length})`;
    }

    if (filters.category_id) {
      params.push(filters.category_id);
      query += ` AND category_id = $${params.length}`;
    }

    if (filters.supplier_id) {
      params.push(filters.supplier_id);
      query += ` AND supplier_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].total, 10);
  }

  async getItemById(id) {
    const result = await pool.query(
      `SELECT i.*, c.name as category_name, s.name as supplier_name
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.id = $1 AND i.active = true`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getItemBySku(sku) {
    const result = await pool.query(
      `SELECT i.*, c.name as category_name, s.name as supplier_name
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.sku = $1 AND i.active = true`,
      [sku]
    );
    return result.rows[0] || null;
  }

  async getItemByBarcode(barcode) {
    const result = await pool.query(
      `SELECT i.*, c.name as category_name, s.name as supplier_name
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.barcode = $1 AND i.active = true`,
      [barcode]
    );
    return result.rows[0] || null;
  }

  async updateItem(id, updates) {
    const allowedFields = ['name', 'description', 'category_id', 'supplier_id', 'unit_cost', 'unit_price', 'reorder_level', 'lead_time_days', 'active'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount += 1;
      }
    }

    if (fields.length === 0) {
      return this.getItemById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    try {
      const query = `UPDATE items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23503') {
        throw new Error('Invalid category_id or supplier_id');
      }
      throw error;
    }
  }

  async deleteItem(id) {
    const result = await pool.query('UPDATE items SET active = false WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }

  async searchItems(query, limit = 20) {
    const result = await pool.query(
      `SELECT id, sku, barcode, name FROM items
       WHERE active = true AND (name ILIKE $1 OR sku ILIKE $1 OR barcode ILIKE $1)
       ORDER BY name ASC
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }
}

module.exports = new ItemService();
