const pool = require('../db/connection');

class StockService {
  async getStockLevel(itemId, locationId) {
    const result = await pool.query(
      'SELECT * FROM stock_levels WHERE item_id = $1 AND location_id = $2',
      [itemId, locationId]
    );
    return result.rows[0] || null;
  }

  async getStockByItem(itemId) {
    const result = await pool.query(
      `SELECT sl.*, l.name as location_name, l.location_code
       FROM stock_levels sl
       JOIN locations l ON sl.location_id = l.id
       WHERE sl.item_id = $1
       ORDER BY l.name ASC`,
      [itemId]
    );
    return result.rows;
  }

  async getStockByLocation(locationId, limit, offset, filters = {}) {
    let query = `SELECT sl.*, i.sku, i.name as item_name, i.barcode
                 FROM stock_levels sl
                 JOIN items i ON sl.item_id = i.id
                 WHERE sl.location_id = $1 AND i.active = true`;
    const params = [locationId];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (i.name ILIKE $${params.length} OR i.sku ILIKE $${params.length} OR i.barcode ILIKE $${params.length})`;
    }

    if (filters.below_reorder && filters.below_reorder === 'true') {
      query += ` AND sl.quantity_available < i.reorder_level`;
    }

    query += ` ORDER BY i.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getStockCountByLocation(locationId, filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM stock_levels sl JOIN items i ON sl.item_id = i.id WHERE sl.location_id = $1 AND i.active = true';
    const params = [locationId];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (i.name ILIKE $${params.length} OR i.sku ILIKE $${params.length} OR i.barcode ILIKE $${params.length})`;
    }

    if (filters.below_reorder && filters.below_reorder === 'true') {
      query += ` AND sl.quantity_available < i.reorder_level`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].total, 10);
  }

  async adjustStock(itemId, locationId, quantity, movementType, userId, notes = null, referenceId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let stockLevel = await client.query(
        'SELECT * FROM stock_levels WHERE item_id = $1 AND location_id = $2',
        [itemId, locationId]
      );

      if (stockLevel.rows.length === 0) {
        await client.query(
          'INSERT INTO stock_levels (item_id, location_id, quantity_on_hand) VALUES ($1, $2, $3)',
          [itemId, locationId, Math.max(0, quantity)]
        );
      } else {
        const currentStock = stockLevel.rows[0].quantity_on_hand;
        const newStock = Math.max(0, currentStock + quantity);

        await client.query(
          'UPDATE stock_levels SET quantity_on_hand = $1, updated_at = CURRENT_TIMESTAMP WHERE item_id = $2 AND location_id = $3',
          [newStock, itemId, locationId]
        );
      }

      const movementResult = await client.query(
        `INSERT INTO stock_movements (item_id, location_id, movement_type, quantity, reference_type, reference_id, notes, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [itemId, locationId, movementType, quantity, 'inventory_adjustment', referenceId, notes, userId]
      );

      await client.query('COMMIT');
      return movementResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createInitialStock(itemId, locationId, quantity, userId) {
    try {
      await pool.query(
        'INSERT INTO stock_levels (item_id, location_id, quantity_on_hand, last_counted_by, last_counted_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
        [itemId, locationId, quantity, userId]
      );

      await pool.query(
        `INSERT INTO stock_movements (item_id, location_id, movement_type, quantity, notes, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, locationId, 'receipt', quantity, 'Initial stock', userId]
      );

      return this.getStockLevel(itemId, locationId);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Stock level already exists for this item and location');
      }
      throw error;
    }
  }

  async getStockMovementHistory(itemId, locationId, limit, offset) {
    const result = await pool.query(
      `SELECT sm.*, u.username
       FROM stock_movements sm
       LEFT JOIN users u ON sm.user_id = u.id
       WHERE sm.item_id = $1 AND sm.location_id = $2
       ORDER BY sm.created_at DESC
       LIMIT $3 OFFSET $4`,
      [itemId, locationId, limit, offset]
    );
    return result.rows;
  }

  async getTotalStockByItem(itemId) {
    const result = await pool.query(
      `SELECT SUM(quantity_on_hand) as total_on_hand, SUM(quantity_reserved) as total_reserved, SUM(quantity_available) as total_available
       FROM stock_levels
       WHERE item_id = $1`,
      [itemId]
    );
    return {
      totalOnHand: parseInt(result.rows[0].total_on_hand || 0, 10),
      totalReserved: parseInt(result.rows[0].total_reserved || 0, 10),
      totalAvailable: parseInt(result.rows[0].total_available || 0, 10),
    };
  }

  async getLocationSummary(locationId) {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT sl.item_id) as total_items,
        SUM(sl.quantity_on_hand) as total_quantity,
        COUNT(CASE WHEN sl.quantity_available < i.reorder_level THEN 1 END) as below_reorder_count
       FROM stock_levels sl
       JOIN items i ON sl.item_id = i.id
       WHERE sl.location_id = $1 AND i.active = true`,
      [locationId]
    );
    return result.rows[0];
  }
}

module.exports = new StockService();
