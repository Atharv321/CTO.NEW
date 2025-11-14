import db from './connection.js';

const migrations = [
  {
    name: '001_create_users_table',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS users;`
  },
  {
    name: '002_create_locations_table',
    up: `
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS locations;`
  },
  {
    name: '003_create_products_table',
    up: `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        cost DECIMAL(10,2) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS products;`
  },
  {
    name: '004_create_inventory_items_table',
    up: `
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id),
        location_id UUID NOT NULL REFERENCES locations(id),
        quantity INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, location_id)
      );
    `,
    down: `DROP TABLE IF EXISTS inventory_items;`
  },
  {
    name: '005_create_stock_movements_table',
    up: `
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id),
        location_id UUID NOT NULL REFERENCES locations(id),
        quantity INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'waste')),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS stock_movements;`
  },
  {
    name: '006_create_report_definitions_table',
    up: `
      CREATE TABLE IF NOT EXISTS report_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('valuation', 'turnover', 'wastage', 'performance')),
        schedule VARCHAR(100),
        filters JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS report_definitions;`
  },
  {
    name: '007_create_report_runs_table',
    up: `
      CREATE TABLE IF NOT EXISTS report_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_definition_id UUID NOT NULL REFERENCES report_definitions(id),
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        data JSONB,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS report_runs;`
  },
  {
    name: '008_create_analytics_snapshots_table',
    up: `
      CREATE TABLE IF NOT EXISTS analytics_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location_id UUID NOT NULL REFERENCES locations(id),
        period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_inventory_value DECIMAL(12,2),
        total_items INTEGER,
        turnover_ratio DECIMAL(8,2),
        wastage_value DECIMAL(12,2),
        wastage_percentage DECIMAL(5,2),
        revenue DECIMAL(12,2),
        cost_of_goods_sold DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(location_id, period_type, period_start)
      );
    `,
    down: `DROP TABLE IF EXISTS analytics_snapshots;`
  },
  {
    name: '009_create_indexes',
    up: `
      CREATE INDEX IF NOT EXISTS idx_inventory_items_product_location ON inventory_items(product_id, location_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product_location ON stock_movements(product_id, location_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_location_period ON analytics_snapshots(location_id, period_type, period_start);
      CREATE INDEX IF NOT EXISTS idx_report_runs_status ON report_runs(status);
    `,
    down: ``
  }
];

export default migrations;