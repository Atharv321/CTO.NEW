-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  location_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  warehouse_type VARCHAR(50) DEFAULT 'warehouse',
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_name ON locations(name);
CREATE INDEX idx_locations_code ON locations(location_code);
CREATE INDEX idx_locations_active ON locations(active);
