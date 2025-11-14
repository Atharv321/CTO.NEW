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
  },
  {
    name: '010_create_alert_events_table',
    up: `
      CREATE TABLE IF NOT EXISTS alert_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL CHECK (type IN ('low_stock', 'impending_expiration', 'supplier_order_update', 'system_error')),
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        user_id UUID REFERENCES users(id),
        location_id UUID REFERENCES locations(id),
        product_id UUID REFERENCES products(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS alert_events;`
  },
  {
    name: '011_create_alert_thresholds_table',
    up: `
      CREATE TABLE IF NOT EXISTS alert_thresholds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location_id UUID REFERENCES locations(id),
        product_id UUID REFERENCES products(id),
        type VARCHAR(50) NOT NULL CHECK (type IN ('low_stock', 'impending_expiration', 'supplier_order_update', 'system_error')),
        threshold DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(location_id, product_id, type)
      );
    `,
    down: `DROP TABLE IF EXISTS alert_thresholds;`
  },
  {
    name: '012_create_user_notification_preferences_table',
    up: `
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        alert_types TEXT[] NOT NULL,
        channels JSONB NOT NULL,
        min_severity VARCHAR(20) NOT NULL CHECK (min_severity IN ('low', 'medium', 'high', 'critical')),
        quiet_hours JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `,
    down: `DROP TABLE IF EXISTS user_notification_preferences;`
  },
  {
    name: '013_create_notifications_table',
    up: `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        alert_event_id UUID NOT NULL REFERENCES alert_events(id),
        channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('email', 'sms', 'push', 'in_app')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
        sent_at TIMESTAMP,
        error TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS notifications;`
  },
  {
    name: '014_create_in_app_notifications_table',
    up: `
      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS in_app_notifications;`
  },
  {
    name: '015_create_alerting_indexes',
    up: `
      CREATE INDEX IF NOT EXISTS idx_alert_events_type_severity ON alert_events(type, severity);
      CREATE INDEX IF NOT EXISTS idx_alert_events_created_at ON alert_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_alert_events_user_id ON alert_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_alert_events_location_id ON alert_events(location_id);
      CREATE INDEX IF NOT EXISTS idx_alert_events_product_id ON alert_events(product_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id_status ON notifications(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_notifications_alert_event_id ON notifications(alert_event_id);
      CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id_read ON in_app_notifications(user_id, read);
      CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON in_app_notifications(created_at);
    `,
    down: ``
  }
];

export default migrations;