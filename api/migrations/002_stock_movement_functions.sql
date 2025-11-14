-- Functions for stock movement operations
-- These functions ensure ACID compliance and proper audit logging

-- Function to process stock receive operation
CREATE OR REPLACE FUNCTION process_stock_receive(
    p_product_id UUID,
    p_location_id UUID,
    p_quantity DECIMAL(15, 3),
    p_reference_number VARCHAR(100),
    p_barcode VARCHAR(100),
    p_reason TEXT,
    p_user_id VARCHAR(255),
    p_user_name VARCHAR(255),
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_movement_id UUID;
    v_inventory_id UUID;
    v_old_quantity DECIMAL(15, 3);
    v_new_quantity DECIMAL(15, 3);
BEGIN
    -- Validate inputs
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive for receive operation';
    END IF;

    -- Get or create inventory record
    SELECT id, quantity INTO v_inventory_id, v_old_quantity
    FROM inventory
    WHERE product_id = p_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
        -- Create new inventory record
        INSERT INTO inventory (product_id, location_id, quantity)
        VALUES (p_product_id, p_location_id, p_quantity)
        RETURNING id, quantity INTO v_inventory_id, v_new_quantity;
    ELSE
        -- Update existing inventory
        v_new_quantity := v_old_quantity + p_quantity;
        UPDATE inventory
        SET quantity = v_new_quantity
        WHERE id = v_inventory_id;
    END IF;

    -- Create stock movement record
    INSERT INTO stock_movements (
        product_id, location_id, movement_type, quantity,
        reference_number, barcode, reason, user_id, user_name, metadata
    )
    VALUES (
        p_product_id, p_location_id, 'RECEIVE', p_quantity,
        p_reference_number, p_barcode, p_reason, p_user_id, p_user_name, p_metadata
    )
    RETURNING id INTO v_movement_id;

    -- Create audit log entry
    INSERT INTO audit_log (
        table_name, record_id, action, old_values, new_values, user_id, user_name
    )
    VALUES (
        'inventory', v_inventory_id, 'UPDATE',
        jsonb_build_object('quantity', v_old_quantity),
        jsonb_build_object('quantity', v_new_quantity),
        p_user_id, p_user_name
    );

    RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process stock consume operation
CREATE OR REPLACE FUNCTION process_stock_consume(
    p_product_id UUID,
    p_location_id UUID,
    p_quantity DECIMAL(15, 3),
    p_reference_number VARCHAR(100),
    p_barcode VARCHAR(100),
    p_reason TEXT,
    p_user_id VARCHAR(255),
    p_user_name VARCHAR(255),
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_movement_id UUID;
    v_inventory_id UUID;
    v_old_quantity DECIMAL(15, 3);
    v_new_quantity DECIMAL(15, 3);
BEGIN
    -- Validate inputs
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive for consume operation';
    END IF;

    -- Get inventory record and lock it
    SELECT id, quantity INTO v_inventory_id, v_old_quantity
    FROM inventory
    WHERE product_id = p_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
        RAISE EXCEPTION 'No inventory found for product % at location %', p_product_id, p_location_id;
    END IF;

    IF v_old_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_old_quantity, p_quantity;
    END IF;

    -- Update inventory
    v_new_quantity := v_old_quantity - p_quantity;
    UPDATE inventory
    SET quantity = v_new_quantity
    WHERE id = v_inventory_id;

    -- Create stock movement record
    INSERT INTO stock_movements (
        product_id, location_id, movement_type, quantity,
        reference_number, barcode, reason, user_id, user_name, metadata
    )
    VALUES (
        p_product_id, p_location_id, 'CONSUME', p_quantity,
        p_reference_number, p_barcode, p_reason, p_user_id, p_user_name, p_metadata
    )
    RETURNING id INTO v_movement_id;

    -- Create audit log entry
    INSERT INTO audit_log (
        table_name, record_id, action, old_values, new_values, user_id, user_name
    )
    VALUES (
        'inventory', v_inventory_id, 'UPDATE',
        jsonb_build_object('quantity', v_old_quantity),
        jsonb_build_object('quantity', v_new_quantity),
        p_user_id, p_user_name
    );

    RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process stock adjust operation
CREATE OR REPLACE FUNCTION process_stock_adjust(
    p_product_id UUID,
    p_location_id UUID,
    p_quantity DECIMAL(15, 3),
    p_reference_number VARCHAR(100),
    p_barcode VARCHAR(100),
    p_reason TEXT,
    p_user_id VARCHAR(255),
    p_user_name VARCHAR(255),
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_movement_id UUID;
    v_inventory_id UUID;
    v_old_quantity DECIMAL(15, 3);
    v_new_quantity DECIMAL(15, 3);
    v_adjustment_amount DECIMAL(15, 3);
BEGIN
    -- Get or create inventory record
    SELECT id, quantity INTO v_inventory_id, v_old_quantity
    FROM inventory
    WHERE product_id = p_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
        -- Create new inventory record
        INSERT INTO inventory (product_id, location_id, quantity)
        VALUES (p_product_id, p_location_id, p_quantity)
        RETURNING id, quantity INTO v_inventory_id, v_new_quantity;
        v_adjustment_amount := p_quantity;
    ELSE
        -- Update existing inventory
        v_new_quantity := p_quantity;
        v_adjustment_amount := p_quantity - v_old_quantity;
        UPDATE inventory
        SET quantity = v_new_quantity
        WHERE id = v_inventory_id;
    END IF;

    -- Create stock movement record
    INSERT INTO stock_movements (
        product_id, location_id, movement_type, quantity,
        reference_number, barcode, reason, user_id, user_name, metadata
    )
    VALUES (
        p_product_id, p_location_id, 'ADJUST', v_adjustment_amount,
        p_reference_number, p_barcode, p_reason, p_user_id, p_user_name, p_metadata
    )
    RETURNING id INTO v_movement_id;

    -- Create audit log entry
    INSERT INTO audit_log (
        table_name, record_id, action, old_values, new_values, user_id, user_name
    )
    VALUES (
        'inventory', v_inventory_id, 'UPDATE',
        jsonb_build_object('quantity', v_old_quantity),
        jsonb_build_object('quantity', v_new_quantity),
        p_user_id, p_user_name
    );

    RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;