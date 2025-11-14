-- Views and functions for low stock management
-- These support the low-stock computation service

-- View for low stock items
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
    i.id as inventory_id,
    i.product_id,
    p.sku,
    p.name as product_name,
    p.barcode as product_barcode,
    i.location_id,
    l.name as location_name,
    i.quantity,
    i.low_stock_threshold,
    i.reserved_quantity,
    (i.quantity - i.reserved_quantity) as available_quantity,
    CASE 
        WHEN (i.quantity - i.reserved_quantity) <= i.low_stock_threshold THEN true
        ELSE false
    END as is_low_stock,
    i.updated_at
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN locations l ON i.location_id = l.id
WHERE i.low_stock_threshold > 0
  AND (i.quantity - i.reserved_quantity) <= i.low_stock_threshold;

-- Function to get low stock alerts
CREATE OR REPLACE FUNCTION get_low_stock_alerts(
    p_location_id UUID DEFAULT NULL
)
RETURNS TABLE (
    inventory_id UUID,
    product_id UUID,
    sku VARCHAR(100),
    product_name VARCHAR(255),
    location_id UUID,
    location_name VARCHAR(255),
    current_quantity DECIMAL(15, 3),
    threshold DECIMAL(15, 3),
    available_quantity DECIMAL(15, 3),
    shortage_amount DECIMAL(15, 3),
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.product_id,
        p.sku,
        p.name,
        i.location_id,
        l.name,
        i.quantity,
        i.low_stock_threshold,
        (i.quantity - i.reserved_quantity),
        GREATEST(0, i.low_stock_threshold - (i.quantity - i.reserved_quantity)),
        i.updated_at
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN locations l ON i.location_id = l.id
    WHERE i.low_stock_threshold > 0
      AND (i.quantity - i.reserved_quantity) <= i.low_stock_threshold
      AND (p_location_id IS NULL OR i.location_id = p_location_id)
    ORDER BY (i.quantity - i.reserved_quantity) ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to update low stock threshold
CREATE OR REPLACE FUNCTION update_low_stock_threshold(
    p_product_id UUID,
    p_location_id UUID,
    p_threshold DECIMAL(15, 3),
    p_user_id VARCHAR(255),
    p_user_name VARCHAR(255)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_inventory_id UUID;
    v_old_threshold DECIMAL(15, 3);
BEGIN
    -- Get or create inventory record
    SELECT id, low_stock_threshold INTO v_inventory_id, v_old_threshold
    FROM inventory
    WHERE product_id = p_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
        -- Create new inventory record with zero quantity and threshold
        INSERT INTO inventory (product_id, location_id, quantity, low_stock_threshold)
        VALUES (p_product_id, p_location_id, 0, p_threshold)
        RETURNING id INTO v_inventory_id;
        v_old_threshold := 0;
    ELSE
        -- Update existing threshold
        UPDATE inventory
        SET low_stock_threshold = p_threshold
        WHERE id = v_inventory_id;
    END IF;

    -- Create audit log entry
    INSERT INTO audit_log (
        table_name, record_id, action, old_values, new_values, user_id, user_name
    )
    VALUES (
        'inventory', v_inventory_id, 'UPDATE',
        jsonb_build_object('low_stock_threshold', v_old_threshold),
        jsonb_build_object('low_stock_threshold', p_threshold),
        p_user_id, p_user_name
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get stock movement history
CREATE OR REPLACE FUNCTION get_stock_movement_history(
    p_product_id UUID DEFAULT NULL,
    p_location_id UUID DEFAULT NULL,
    p_movement_type VARCHAR(20) DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    sku VARCHAR(100),
    product_name VARCHAR(255),
    location_id UUID,
    location_name VARCHAR(255),
    movement_type VARCHAR(20),
    quantity DECIMAL(15, 3),
    reference_number VARCHAR(100),
    barcode VARCHAR(100),
    reason TEXT,
    user_id VARCHAR(255),
    user_name VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.product_id,
        p.sku,
        p.name,
        sm.location_id,
        l.name,
        sm.movement_type,
        sm.quantity,
        sm.reference_number,
        sm.barcode,
        sm.reason,
        sm.user_id,
        sm.user_name,
        sm.metadata,
        sm.created_at
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    JOIN locations l ON sm.location_id = l.id
    WHERE (p_product_id IS NULL OR sm.product_id = p_product_id)
      AND (p_location_id IS NULL OR sm.location_id = p_location_id)
      AND (p_movement_type IS NULL OR sm.movement_type = p_movement_type)
      AND (p_start_date IS NULL OR sm.created_at >= p_start_date)
      AND (p_end_date IS NULL OR sm.created_at <= p_end_date)
    ORDER BY sm.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;