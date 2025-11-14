-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  barcode VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  unit_cost DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  reorder_level INTEGER DEFAULT 10,
  lead_time_days INTEGER,
  active BOOLEAN DEFAULT true,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_barcode ON items(barcode);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_supplier_id ON items(supplier_id);
CREATE INDEX idx_items_active ON items(active);
