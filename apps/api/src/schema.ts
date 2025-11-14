import { query } from './db';

export const initializeSchema = async () => {
  try {
    // Create categories table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create suppliers table
    await query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        contact_email VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create locations table
    await query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create inventory items table
    await query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku VARCHAR(100) NOT NULL UNIQUE,
        barcode VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create stock levels table
    await query(`
      CREATE TABLE IF NOT EXISTS stock_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0,
        reorder_level INTEGER NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(item_id, location_id)
      );
    `);

    // Create inventory adjustments table
    await query(`
      CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        adjustment INTEGER NOT NULL,
        reason VARCHAR(50) NOT NULL CHECK (reason IN ('scanned_entry', 'manual_adjustment', 'correction', 'count_variance')),
        notes TEXT,
        adjusted_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better query performance
    await query(`CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier ON inventory_items(supplier_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_stock_levels_item ON stock_levels(item_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_stock_levels_location ON stock_levels(location_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_adjustments_item ON inventory_adjustments(item_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_adjustments_location ON inventory_adjustments(location_id);`);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize schema:', error);
    throw error;
  }
};
