-- Database schema for stock workflows
-- Initial migration for stock management system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barcode VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table (stock levels per product per location)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity DECIMAL(15, 3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(15, 3) NOT NULL DEFAULT 0,
    low_stock_threshold DECIMAL(15, 3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, location_id)
);

-- Stock movements table (transaction history)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('RECEIVE', 'CONSUME', 'ADJUST')),
    quantity DECIMAL(15, 3) NOT NULL,
    reference_number VARCHAR(100),
    barcode VARCHAR(100),
    reason TEXT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table for all inventory changes
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_location ON inventory(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_location ON stock_movements(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();