const pool = require('../connection');

const purchaseOrderQueries = {
  // Generate unique PO number
  async generatePoNumber() {
    const prefix = 'PO';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const query = `
      SELECT po_number FROM purchase_orders 
      WHERE po_number LIKE $1 
      ORDER BY po_number DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [`${prefix}-${date}-%`]);
    
    let sequence = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].po_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    return `${prefix}-${date}-${String(sequence).padStart(4, '0')}`;
  },

  // Create a new purchase order
  async create(poData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { supplier_id, location_id, notes, created_by, items } = poData;
      const po_number = await this.generatePoNumber();

      // Create PO
      const poQuery = `
        INSERT INTO purchase_orders (po_number, supplier_id, location_id, notes, created_by, status)
        VALUES ($1, $2, $3, $4, $5, 'draft')
        RETURNING *
      `;
      const poResult = await client.query(poQuery, [po_number, supplier_id, location_id, notes, created_by]);
      const po = poResult.rows[0];

      // Add items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          const itemQuery = `
            INSERT INTO purchase_order_items (po_id, item_id, quantity, unit_price)
            VALUES ($1, $2, $3, $4)
          `;
          await client.query(itemQuery, [po.id, item.item_id, item.quantity, item.unit_price]);
        }
      }

      await client.query('COMMIT');

      // Fetch complete PO with items
      return await this.findById(po.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all purchase orders with pagination and filtering
  async findAll(options = {}) {
    const { page = 1, limit = 50, status = null, supplier_id = null, location_id = null } = options;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT po.*, s.name as supplier_name, l.name as location_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN locations l ON po.location_id = l.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND po.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (supplier_id) {
      query += ` AND po.supplier_id = $${paramCount}`;
      values.push(supplier_id);
      paramCount++;
    }

    if (location_id) {
      query += ` AND po.location_id = $${paramCount}`;
      values.push(location_id);
      paramCount++;
    }

    query += ` ORDER BY po.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM purchase_orders WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
      countParamCount++;
    }

    if (supplier_id) {
      countQuery += ` AND supplier_id = $${countParamCount}`;
      countValues.push(supplier_id);
      countParamCount++;
    }

    if (location_id) {
      countQuery += ` AND location_id = $${countParamCount}`;
      countValues.push(location_id);
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

  // Get purchase order by ID with items
  async findById(id) {
    const poQuery = `
      SELECT po.*, s.name as supplier_name, s.contact_email as supplier_email,
             l.name as location_name, l.address as location_address
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN locations l ON po.location_id = l.id
      WHERE po.id = $1
    `;
    const poResult = await pool.query(poQuery, [id]);
    
    if (poResult.rows.length === 0) return null;

    const po = poResult.rows[0];

    // Get items
    const itemsQuery = `
      SELECT poi.*, i.sku, i.name, i.barcode, i.category
      FROM purchase_order_items poi
      JOIN items i ON poi.item_id = i.id
      WHERE poi.po_id = $1
      ORDER BY i.name
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);
    po.items = itemsResult.rows;

    return po;
  },

  // Update purchase order (only if draft)
  async update(id, poData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if PO is in draft status
      const checkQuery = 'SELECT status FROM purchase_orders WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Purchase order not found');
      }
      
      if (checkResult.rows[0].status !== 'draft') {
        throw new Error('Can only update draft purchase orders');
      }

      const { supplier_id, location_id, notes, items } = poData;

      // Update PO
      const poQuery = `
        UPDATE purchase_orders
        SET supplier_id = COALESCE($1, supplier_id),
            location_id = COALESCE($2, location_id),
            notes = COALESCE($3, notes)
        WHERE id = $4
        RETURNING *
      `;
      await client.query(poQuery, [supplier_id, location_id, notes, id]);

      // Update items if provided
      if (items) {
        // Delete existing items
        await client.query('DELETE FROM purchase_order_items WHERE po_id = $1', [id]);
        
        // Add new items
        for (const item of items) {
          const itemQuery = `
            INSERT INTO purchase_order_items (po_id, item_id, quantity, unit_price)
            VALUES ($1, $2, $3, $4)
          `;
          await client.query(itemQuery, [id, item.item_id, item.quantity, item.unit_price]);
        }
      }

      await client.query('COMMIT');

      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Submit purchase order
  async submit(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if PO is in draft status
      const checkQuery = 'SELECT status FROM purchase_orders WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Purchase order not found');
      }
      
      if (checkResult.rows[0].status !== 'draft') {
        throw new Error('Can only submit draft purchase orders');
      }

      // Check if PO has items
      const itemsCheckQuery = 'SELECT COUNT(*) FROM purchase_order_items WHERE po_id = $1';
      const itemsCheckResult = await client.query(itemsCheckQuery, [id]);
      
      if (parseInt(itemsCheckResult.rows[0].count) === 0) {
        throw new Error('Cannot submit purchase order without items');
      }

      // Update status to submitted
      const updateQuery = `
        UPDATE purchase_orders
        SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      await client.query(updateQuery, [id]);

      await client.query('COMMIT');

      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Receive purchase order items and update stock
  async receive(id, receivedItems) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if PO is in submitted status
      const checkQuery = 'SELECT status FROM purchase_orders WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Purchase order not found');
      }
      
      if (checkResult.rows[0].status !== 'submitted') {
        throw new Error('Can only receive submitted purchase orders');
      }

      // Process received items
      for (const receivedItem of receivedItems) {
        const { item_id, received_quantity } = receivedItem;

        // Validate the item exists in the PO
        const poItemQuery = 'SELECT quantity FROM purchase_order_items WHERE po_id = $1 AND item_id = $2';
        const poItemResult = await client.query(poItemQuery, [id, item_id]);
        
        if (poItemResult.rows.length === 0) {
          throw new Error(`Item ${item_id} not found in purchase order`);
        }

        // Update received quantity
        const updatePoItemQuery = `
          UPDATE purchase_order_items
          SET received_quantity = received_quantity + $1
          WHERE po_id = $2 AND item_id = $3
        `;
        await client.query(updatePoItemQuery, [received_quantity, id, item_id]);

        // Update item stock
        const updateStockQuery = `
          UPDATE items
          SET quantity = quantity + $1
          WHERE id = $2
        `;
        await client.query(updateStockQuery, [received_quantity, item_id]);
      }

      // Check if all items are fully received
      const fullyReceivedQuery = `
        SELECT COUNT(*) 
        FROM purchase_order_items 
        WHERE po_id = $1 AND received_quantity < quantity
      `;
      const fullyReceivedResult = await client.query(fullyReceivedQuery, [id]);
      const pendingItems = parseInt(fullyReceivedResult.rows[0].count);

      // If all items received, update PO status
      if (pendingItems === 0) {
        const updateStatusQuery = `
          UPDATE purchase_orders
          SET status = 'received', received_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `;
        await client.query(updateStatusQuery, [id]);
      }

      await client.query('COMMIT');

      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Cancel purchase order
  async cancel(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if PO can be cancelled (not received)
      const checkQuery = 'SELECT status FROM purchase_orders WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Purchase order not found');
      }
      
      if (checkResult.rows[0].status === 'received') {
        throw new Error('Cannot cancel received purchase orders');
      }

      const updateQuery = `
        UPDATE purchase_orders
        SET status = 'cancelled'
        WHERE id = $1
        RETURNING *
      `;
      await client.query(updateQuery, [id]);

      await client.query('COMMIT');

      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete purchase order (only if draft)
  async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if PO is in draft status
      const checkQuery = 'SELECT status FROM purchase_orders WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Purchase order not found');
      }
      
      if (checkResult.rows[0].status !== 'draft') {
        throw new Error('Can only delete draft purchase orders');
      }

      const query = 'DELETE FROM purchase_orders WHERE id = $1 RETURNING *';
      const result = await client.query(query, [id]);

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = purchaseOrderQueries;
