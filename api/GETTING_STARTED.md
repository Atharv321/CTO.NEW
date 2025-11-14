# Getting Started with Supplier & Purchase Order API

This guide will help you get the supplier and purchase order API up and running.

## Quick Start (Docker)

The easiest way to get started is using Docker Compose:

```bash
# Start all services (database, api, web)
docker-compose up

# In another terminal, run migrations
docker-compose exec api npm run migrate

# Seed sample data (optional)
docker-compose exec api npm run seed
```

The API will be available at `http://localhost:3001`

## Manual Setup (Local Development)

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Start PostgreSQL

Make sure PostgreSQL is running and accessible. You can use Docker:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=devuser \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=appdb \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Configure Environment

Create a `.env` file in the `api/` directory:

```env
DATABASE_URL=postgresql://devuser:devpassword@localhost:5432/appdb
PORT=3001
NODE_ENV=development
```

### 4. Run Migrations

```bash
npm run migrate
```

This will create all necessary tables:
- suppliers
- locations
- items
- supplier_preferred_items
- supplier_locations
- purchase_orders
- purchase_order_items

### 5. Seed Sample Data (Optional)

```bash
npm run seed
```

This creates:
- 5 sample items
- 2 sample suppliers
- 2 sample locations
- Supplier-item relationships

### 6. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 7. Test the API

```bash
# Health check
curl http://localhost:3001/health

# List suppliers
curl http://localhost:3001/api/suppliers

# Get supplier details
curl http://localhost:3001/api/suppliers/1

# Create a purchase order
curl -X POST http://localhost:3001/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": 1,
    "location_id": 1,
    "items": [
      {
        "item_id": 1,
        "quantity": 50,
        "unit_price": 17.99
      }
    ]
  }'
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test tests/suppliers.test.js
npm test tests/purchaseOrders.test.js

# Run with coverage
npm test -- --coverage
```

**Note**: Tests require a running PostgreSQL database. They will create and clean up their own test data.

## Common Tasks

### Create a Supplier

```bash
curl -X POST http://localhost:3001/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Supplier Co",
    "contact_email": "contact@newsupplier.com",
    "lead_time_days": 7
  }'
```

### Create a Draft Purchase Order

```bash
curl -X POST http://localhost:3001/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": 1,
    "location_id": 1,
    "notes": "Quarterly restock",
    "items": [
      {
        "item_id": 1,
        "quantity": 100,
        "unit_price": 15.99
      }
    ]
  }'
```

### Submit a Purchase Order

```bash
# Get the PO ID from the previous response, then:
curl -X POST http://localhost:3001/api/purchase-orders/1/submit
```

### Receive Items

```bash
curl -X POST http://localhost:3001/api/purchase-orders/1/receive \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "item_id": 1,
        "received_quantity": 100
      }
    ]
  }'
```

### Export Purchase Order

```bash
# CSV format
curl http://localhost:3001/api/purchase-orders/1/export?format=csv > po.csv

# PDF format (placeholder)
curl http://localhost:3001/api/purchase-orders/1/export?format=pdf
```

## API Workflow

A typical purchase order workflow:

1. **Create Supplier** (if new)
   - POST /api/suppliers

2. **Link Supplier to Location** (if needed)
   - POST /api/suppliers/:id/locations

3. **Add Preferred Items** (optional, for pricing reference)
   - POST /api/suppliers/:id/items

4. **Create Draft PO**
   - POST /api/purchase-orders
   - Status: `draft`

5. **Edit PO** (if needed)
   - PUT /api/purchase-orders/:id
   - Only works while status is `draft`

6. **Submit PO**
   - POST /api/purchase-orders/:id/submit
   - Status: `draft` → `submitted`
   - PO is now locked and cannot be edited

7. **Receive Items**
   - POST /api/purchase-orders/:id/receive
   - Can receive partially or all at once
   - Stock is automatically updated
   - Status: `submitted` → `received` (when all items received)

8. **Export for Records**
   - GET /api/purchase-orders/:id/export?format=csv

## Database Access

If you need direct database access:

```bash
# Using Docker
docker-compose exec db psql -U devuser -d appdb

# Local PostgreSQL
psql postgresql://devuser:devpassword@localhost:5432/appdb
```

Useful queries:

```sql
-- View all suppliers
SELECT * FROM suppliers;

-- View all purchase orders with status
SELECT po_number, status, total_amount, created_at 
FROM purchase_orders 
ORDER BY created_at DESC;

-- View PO details with items
SELECT po.po_number, po.status, i.sku, i.name, poi.quantity, poi.received_quantity
FROM purchase_orders po
JOIN purchase_order_items poi ON po.id = poi.po_id
JOIN items i ON poi.item_id = i.id
WHERE po.id = 1;

-- Check stock levels
SELECT sku, name, quantity FROM items ORDER BY quantity;
```

## Troubleshooting

### Database Connection Error

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
- Make sure PostgreSQL is running
- Check DATABASE_URL in your environment
- Verify credentials and database name

### Migration Errors

**Problem**: Migration fails with syntax error

**Solution**:
```bash
# Check migration status
psql $DATABASE_URL -c "SELECT * FROM schema_migrations"

# Drop and recreate database (WARNING: deletes all data)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run migrate
```

### Test Failures

**Problem**: Tests fail with "Purchase order not found"

**Solution**:
- Tests clean up their own data
- Make sure database is accessible
- Each test creates its own test data
- Check for constraint violations in logs

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find and kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 npm run dev
```

## Next Steps

- Read the [Purchase Orders Documentation](../docs/PURCHASE_ORDERS.md) for detailed API specs
- Review the [API Documentation](../API.md) for integration examples
- Check out the test files for usage examples
- Explore the database schema in `src/db/migrations/001_init_suppliers.sql`

## Support

For issues or questions:
1. Check the documentation in `docs/PURCHASE_ORDERS.md`
2. Review test files for examples
3. Check the database schema
4. Look at error logs for detailed messages
