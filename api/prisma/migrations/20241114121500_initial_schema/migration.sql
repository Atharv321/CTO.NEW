-- Enable extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER', 'COUNT', 'SALE', 'RETURN');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'OVERSTOCK', 'EXPIRY', 'ORDER_DELAY', 'AUDIT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WEBHOOK', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "password_hash" TEXT,
    "phone" TEXT,
    "role_id" UUID NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "master_sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "default_unit_of_measure" TEXT,
    "upc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_items" (
    "id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "supplier_id" UUID,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "unit_of_measure" TEXT,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "reorder_quantity" INTEGER NOT NULL DEFAULT 0,
    "lead_time_days" INTEGER,
    "cost_amount" DECIMAL(12,2),
    "price_amount" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "location_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_levels" (
    "id" UUID NOT NULL,
    "location_item_id" UUID NOT NULL,
    "quantity_on_hand" DECIMAL(18,4) NOT NULL,
    "quantity_reserved" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "quantity_available" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "last_counted_at" TIMESTAMP(3),
    "counted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" UUID NOT NULL,
    "location_item_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "performed_by_id" UUID,
    "purchase_order_item_id" UUID,
    "transaction_type" "TransactionType" NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "ordered_by_id" UUID,
    "approved_by_id" UUID,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "reference_code" TEXT,
    "expected_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "location_item_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity_ordered" DECIMAL(18,4) NOT NULL,
    "quantity_received" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "location_item_id" UUID,
    "alert_type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged_by_id" UUID,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "entity_name" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "user_id" UUID,
    "request_id" TEXT,
    "changed_data" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_queue" (
    "id" UUID NOT NULL,
    "alert_id" UUID,
    "location_id" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_error" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_locations_user_id_location_id_key" ON "user_locations"("user_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_master_sku_key" ON "inventory_items"("master_sku");

-- CreateIndex
CREATE INDEX "location_items_inventory_item_id_idx" ON "location_items"("inventory_item_id");

-- CreateIndex
CREATE INDEX "location_items_supplier_id_idx" ON "location_items"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_items_location_id_sku_key" ON "location_items"("location_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "stock_levels_location_item_id_key" ON "stock_levels"("location_item_id");

-- CreateIndex
CREATE INDEX "stock_transactions_location_id_occurred_at_idx" ON "stock_transactions"("location_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_location_id_reference_code_key" ON "purchase_orders"("location_id", "reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_items_purchase_order_id_location_item_id_key" ON "purchase_order_items"("purchase_order_id", "location_item_id");

-- CreateIndex
CREATE INDEX "alerts_location_id_status_idx" ON "alerts"("location_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_name_entity_id_idx" ON "audit_logs"("entity_name", "entity_id");

-- CreateIndex
CREATE INDEX "notification_queue_status_scheduled_at_idx" ON "notification_queue"("status", "scheduled_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_items" ADD CONSTRAINT "location_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_items" ADD CONSTRAINT "location_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_items" ADD CONSTRAINT "location_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_location_item_id_fkey" FOREIGN KEY ("location_item_id") REFERENCES "location_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_counted_by_id_fkey" FOREIGN KEY ("counted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_location_item_id_fkey" FOREIGN KEY ("location_item_id") REFERENCES "location_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_ordered_by_id_fkey" FOREIGN KEY ("ordered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_location_item_id_fkey" FOREIGN KEY ("location_item_id") REFERENCES "location_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_location_item_id_fkey" FOREIGN KEY ("location_item_id") REFERENCES "location_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_id_fkey" FOREIGN KEY ("acknowledged_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create audit logging function to capture data changes
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger AS $AUDIT$
DECLARE
    v_user uuid;
    v_request_id text;
    v_action "AuditAction";
    v_entity_id uuid;
    v_changes jsonb;
    v_metadata jsonb;
BEGIN
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid INTO v_user;
    SELECT NULLIF(current_setting('app.request_id', true), '') INTO v_request_id;

    IF TG_OP = 'UPDATE' AND NOT (NEW IS DISTINCT FROM OLD) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
        v_entity_id := NEW.id;
        v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_entity_id := OLD.id;
        v_changes := to_jsonb(OLD);
    ELSE
        v_entity_id := NEW.id;
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            v_action := 'DELETE';
        ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
            v_action := 'RESTORE';
        ELSE
            v_action := 'UPDATE';
        END IF;
        v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    END IF;

    v_metadata := jsonb_build_object('trigger_name', TG_NAME, 'schema', TG_TABLE_SCHEMA);

    INSERT INTO audit_logs (id, entity_name, entity_id, action, user_id, request_id, changed_data, metadata, created_at)
    VALUES (gen_random_uuid(), TG_TABLE_NAME, v_entity_id, v_action, v_user, v_request_id, v_changes, v_metadata, CURRENT_TIMESTAMP);

    RETURN COALESCE(NEW, OLD);
END;
$AUDIT$ LANGUAGE plpgsql;

-- Attach audit triggers to core domain tables
CREATE TRIGGER audit_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON "roles"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON "users"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_locations_trigger
AFTER INSERT OR UPDATE OR DELETE ON "locations"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_user_locations_trigger
AFTER INSERT OR UPDATE OR DELETE ON "user_locations"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_suppliers_trigger
AFTER INSERT OR UPDATE OR DELETE ON "suppliers"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_inventory_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON "inventory_items"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_location_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON "location_items"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_stock_levels_trigger
AFTER INSERT OR UPDATE OR DELETE ON "stock_levels"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_stock_transactions_trigger
AFTER INSERT OR UPDATE OR DELETE ON "stock_transactions"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_purchase_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON "purchase_orders"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_purchase_order_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON "purchase_order_items"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_alerts_trigger
AFTER INSERT OR UPDATE OR DELETE ON "alerts"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_notification_queue_trigger
AFTER INSERT OR UPDATE OR DELETE ON "notification_queue"
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Seed baseline reference data
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES
    ('0d67e1fa-27a6-4a16-91f4-d37fb134b4a6', 'admin', 'Full administrative access across the platform.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('56eb1d78-06c9-4bb6-9fa4-f1f620d7c5ed', 'manager', 'Manages purchasing, inventory operations, and reporting.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a8be4c9f-6a97-40f2-8ece-81f92f2189d0', 'staff', 'Performs receiving, stock counts, and day-to-day tasks.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO locations (id, code, name, description, address_line1, city, state, postal_code, country, timezone, created_at, updated_at)
VALUES
    ('f0a1d4e0-9f94-45a7-8e8f-0105c44b31d0', 'NYC-001', 'New York Flagship', 'Primary distribution hub for east coast operations.', '123 Market St', 'New York', 'NY', '10001', 'USA', 'America/New_York', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('8f4bdfcf-5c73-4aa5-8fcc-d5b4c95e6a9b', 'SFO-001', 'San Francisco Warehouse', 'West coast fulfillment and receiving center.', '500 Embarcadero', 'San Francisco', 'CA', '94105', 'USA', 'America/Los_Angeles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('2edd30ed-561c-4bab-bb36-f761d3e2c478', 'LDN-001', 'London Retail', 'European retail storefront with limited stock.', '1 Baker Street', 'London', NULL, 'NW1 6XE', 'UK', 'Europe/London', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

