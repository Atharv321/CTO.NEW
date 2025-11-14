const pool = require('../connection');

const supplierQueries = {
  // Create a new supplier
  async create(supplierData) {
    const { name, contact_name, contact_email, contact_phone, address, lead_time_days, notes } = supplierData;
    const query = `
      INSERT INTO suppliers (name, contact_name, contact_email, contact_phone, address, lead_time_days, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [name, contact_name, contact_email, contact_phone, address, lead_time_days || 0, notes];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get all suppliers with pagination
  async findAll(options = {}) {
    const { page = 1, limit = 50, active = null, search = null } = options;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM suppliers WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (active !== null) {
      query += ` AND active = $${paramCount}`;
      values.push(active);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR contact_name ILIKE $${paramCount} OR contact_email ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM suppliers WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;

    if (active !== null) {
      countQuery += ` AND active = $${countParamCount}`;
      countValues.push(active);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamCount} OR contact_name ILIKE $${countParamCount} OR contact_email ILIKE $${countParamCount})`;
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

  // Get supplier by ID
  async findById(id) {
    const query = 'SELECT * FROM suppliers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Get supplier with preferred items
  async findByIdWithItems(id) {
    const supplier = await this.findById(id);
    if (!supplier) return null;

    const itemsQuery = `
      SELECT spi.*, i.sku, i.name, i.barcode, i.category
      FROM supplier_preferred_items spi
      JOIN items i ON spi.item_id = i.id
      WHERE spi.supplier_id = $1
      ORDER BY i.name
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);
    supplier.preferred_items = itemsResult.rows;

    const locationsQuery = `
      SELECT l.*
      FROM supplier_locations sl
      JOIN locations l ON sl.location_id = l.id
      WHERE sl.supplier_id = $1
      ORDER BY l.name
    `;
    const locationsResult = await pool.query(locationsQuery, [id]);
    supplier.locations = locationsResult.rows;

    return supplier;
  },

  // Update supplier
  async update(id, supplierData) {
    const { name, contact_name, contact_email, contact_phone, address, lead_time_days, notes, active } = supplierData;
    const query = `
      UPDATE suppliers
      SET name = COALESCE($1, name),
          contact_name = COALESCE($2, contact_name),
          contact_email = COALESCE($3, contact_email),
          contact_phone = COALESCE($4, contact_phone),
          address = COALESCE($5, address),
          lead_time_days = COALESCE($6, lead_time_days),
          notes = COALESCE($7, notes),
          active = COALESCE($8, active)
      WHERE id = $9
      RETURNING *
    `;
    const values = [name, contact_name, contact_email, contact_phone, address, lead_time_days, notes, active, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Delete supplier (soft delete)
  async delete(id) {
    const query = 'UPDATE suppliers SET active = false WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Hard delete supplier
  async hardDelete(id) {
    const query = 'DELETE FROM suppliers WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Add preferred item to supplier
  async addPreferredItem(supplierId, itemData) {
    const { item_id, supplier_sku, unit_price, minimum_order_quantity } = itemData;
    const query = `
      INSERT INTO supplier_preferred_items (supplier_id, item_id, supplier_sku, unit_price, minimum_order_quantity)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (supplier_id, item_id) 
      DO UPDATE SET 
        supplier_sku = EXCLUDED.supplier_sku,
        unit_price = EXCLUDED.unit_price,
        minimum_order_quantity = EXCLUDED.minimum_order_quantity
      RETURNING *
    `;
    const values = [supplierId, item_id, supplier_sku, unit_price, minimum_order_quantity || 1];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Remove preferred item from supplier
  async removePreferredItem(supplierId, itemId) {
    const query = 'DELETE FROM supplier_preferred_items WHERE supplier_id = $1 AND item_id = $2 RETURNING *';
    const result = await pool.query(query, [supplierId, itemId]);
    return result.rows[0];
  },

  // Link supplier to location
  async addLocation(supplierId, locationId) {
    const query = `
      INSERT INTO supplier_locations (supplier_id, location_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [supplierId, locationId]);
    return result.rows[0] || { supplier_id: supplierId, location_id: locationId };
  },

  // Unlink supplier from location
  async removeLocation(supplierId, locationId) {
    const query = 'DELETE FROM supplier_locations WHERE supplier_id = $1 AND location_id = $2 RETURNING *';
    const result = await pool.query(query, [supplierId, locationId]);
    return result.rows[0];
  }
};

module.exports = supplierQueries;
