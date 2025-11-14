# Inventory Management System - Complete Guide

This document provides a comprehensive overview of the integrated inventory management system including the API backend and barcode scanner frontend.

## System Architecture

```
┌─────────────────────────────────────────┐
│    Browser (Web UI)                     │
│  - Barcode Scanner (React)              │
│  - Inventory Manager                    │
│  - Real-time UI                         │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────────┐
│    Node.js/Express API Server           │
│  - JWT Authentication                   │
│  - Role-Based Access Control            │
│  - Validation & Error Handling          │
└──────────────┬──────────────────────────┘
               │ SQL
┌──────────────▼──────────────────────────┐
│    PostgreSQL Database                  │
│  - Items & Categories                   │
│  - Multi-Location Stock                 │
│  - Users & Roles                        │
│  - Stock Movement Audit Log             │
└─────────────────────────────────────────┘
```

## API Server

### Overview
RESTful API for complete inventory management with role-based access control, multi-location stock tracking, and comprehensive audit trails.

### Location
`/home/engine/project/api/`

### Key Features
- JWT authentication
- Role-based permissions (admin, manager, operator, viewer)
- Pagination and filtering
- Data validation
- Referential integrity
- Stock movement audit trail
- Multi-location support

### Database Migrations
Migrations are located in `/api/migrations/`:
1. `001_create_users_table.sql` - User management with roles
2. `002_create_categories_table.sql` - Hierarchical categories
3. `003_create_suppliers_table.sql` - Supplier information
4. `004_create_items_table.sql` - Inventory items
5. `005_create_locations_table.sql` - Warehouse/storage locations
6. `006_create_stock_levels_table.sql` - Multi-location stock tracking
7. `007_create_stock_movements_table.sql` - Audit trail

### Running Migrations
```bash
cd api
npm run migrate
```

### API Endpoints Summary

#### Categories API
```
POST   /api/categories              Create category (admin, manager)
GET    /api/categories              List categories
GET    /api/categories/:id          Get category
PUT    /api/categories/:id          Update category (admin, manager)
DELETE /api/categories/:id          Delete category (admin)
```

#### Items API
```
POST   /api/items                   Create item (admin, manager)
GET    /api/items                   List items with pagination/filtering
GET    /api/items/search/:query     Search items
GET    /api/items/sku/:sku          Get item by SKU
GET    /api/items/barcode/:barcode  Get item by barcode
GET    /api/items/:id               Get item details
PUT    /api/items/:id               Update item (admin, manager)
DELETE /api/items/:id               Delete item (admin)
```

#### Stock API
```
GET    /api/stock/item/:itemId                    Get stock by item
GET    /api/stock/item/:itemId/total             Get total stock for item
GET    /api/stock/location/:locationId           Get stock by location
GET    /api/stock/location/:locationId/summary   Get location summary
GET    /api/stock/:itemId/:locationId            Get stock level
POST   /api/stock/:itemId/:locationId/adjust     Adjust stock (operator+)
POST   /api/stock/:itemId/:locationId/init       Initialize stock (manager+)
GET    /api/stock/:itemId/:locationId/history    Get movement history
```

### Authentication

All API endpoints (except `/health`) require JWT authentication:

```
Authorization: Bearer <JWT_TOKEN>
```

### Role-Based Access

| Role | Categories | Items | Stock Adjust | Delete |
|------|-----------|-------|------|--------|
| admin | ✓ | ✓ | ✓ | ✓ |
| manager | ✓ | ✓ | ✓ | ✗ |
| operator | ✗ | ✗ | ✓ | ✗ |
| viewer | ✓ (read-only) | ✓ (read-only) | ✗ | ✗ |

### Testing

```bash
cd api
npm test                          # Run all tests
npm test -- --watch              # Watch mode
npm test -- --coverage           # Coverage report
```

**Test Suites:**
- Service layer tests: `src/services/__tests__/`
- Integration tests: `src/routes/__tests__/`
- API tests: `server.test.js`

### Documentation

- **Full API Specification**: `/api/INVENTORY_API.md`
- **API README**: `/api/README.md`
- **Postman Collection**: `/api/inventory-api.postman_collection.json`

## Frontend Integration

The barcode scanner frontend can integrate with this API through:

1. **Item Lookup by Barcode**: 
   ```
   GET /api/items/barcode/:barcode
   ```

2. **Stock Adjustment**:
   ```
   POST /api/stock/:itemId/:locationId/adjust
   Body: {
     quantity: number,
     location_id: number,
     movement_type: "receipt" | "issue" | "adjustment",
     notes: string
   }
   ```

3. **Item Search**:
   ```
   GET /api/items/search/:query
   ```

### Example Frontend Integration

```javascript
// Get item by barcode
async function lookupItem(barcode) {
  const response = await fetch(`/api/items/barcode/${barcode}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Adjust stock after scanning
async function recordScan(itemId, locationId, quantity) {
  const response = await fetch(`/api/stock/${itemId}/${locationId}/adjust`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quantity,
      location_id: locationId,
      movement_type: 'receipt'
    })
  });
  return response.json();
}
```

## Database Schema

### Users Table
Tracks users with role-based access control.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table
Hierarchical category system for items.

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_category_id INTEGER REFERENCES categories(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Items Table
Core inventory items with category and supplier relationships.

```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  barcode VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  unit_cost DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  reorder_level INTEGER DEFAULT 10,
  lead_time_days INTEGER,
  active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Locations Table
Warehouse and storage location definitions.

```sql
CREATE TABLE locations (
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
```

### Stock Levels Table
Multi-location stock tracking with computed available quantity.

```sql
CREATE TABLE stock_levels (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  last_counted_at TIMESTAMP,
  last_counted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id, location_id)
);
```

### Stock Movements Table
Complete audit trail of all inventory movements.

```sql
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id VARCHAR(100),
  notes TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Common Operations

### Create a New Item

**Request:**
```bash
curl -X POST http://localhost:3001/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SKU-001",
    "barcode": "1234567890",
    "name": "Widget A",
    "description": "Premium widget",
    "category_id": 1,
    "supplier_id": 1,
    "unit_cost": 10.00,
    "unit_price": 19.99,
    "reorder_level": 10
  }'
```

### Initialize Stock for Location

**Request:**
```bash
curl -X POST http://localhost:3001/api/stock/1/1/init \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 100}'
```

### Adjust Stock (Record a Scan)

**Request:**
```bash
curl -X POST http://localhost:3001/api/stock/1/1/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "location_id": 1,
    "movement_type": "receipt",
    "notes": "Scanned and received"
  }'
```

### Search for Item by Barcode

**Request:**
```bash
curl -X GET "http://localhost:3001/api/items/barcode/1234567890" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Stock Levels for Item

**Request:**
```bash
curl -X GET "http://localhost:3001/api/stock/item/1" \
  -H "Authorization: Bearer $TOKEN"
```

### List Items by Location

**Request:**
```bash
curl -X GET "http://localhost:3001/api/items?location_id=1&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

## Data Validation

The API enforces comprehensive validation:

### Item Validation
- **SKU**: Required, unique, non-empty string
- **Name**: Required, non-empty string
- **Category**: Must reference existing category
- **Prices**: Valid decimal numbers
- **Reorder Level**: Non-negative integer

### Stock Validation
- **Quantity**: Non-negative integer for adjustments
- **Location**: Must exist
- **Item**: Must exist and be active
- **Movement Type**: One of: receipt, issue, adjustment, count, return

### Referential Integrity
- Items must have valid category
- Stock levels reference existing items and locations
- User references are maintained
- Suppliers are optional but must exist if specified

## Error Handling

The API returns standard HTTP status codes:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Item updated |
| 201 | Created | Item created |
| 204 | No Content | Item deleted |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | No token provided |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Item doesn't exist |
| 409 | Conflict | Duplicate SKU |
| 500 | Server Error | Database error |

## Performance Considerations

### Pagination
Use pagination for large result sets:
```
GET /api/items?page=1&limit=50
```

### Filtering
Reduce results before fetching:
```
GET /api/items?category_id=1&search=widget
```

### Indexing
The database uses indexes on:
- SKU, barcode
- Item names
- Category IDs
- Location IDs
- Created dates

## Security

### Authentication
- JWT tokens required for all protected endpoints
- Tokens should be rotated periodically
- Use HTTPS in production

### Authorization
- Role-based access control
- Each endpoint validates user role
- Sensitive operations require higher roles

### Data Protection
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- Password hashing for user credentials
- Audit trail for all stock movements

## Monitoring & Logging

### Important Metrics
- API response times
- Error rates
- Database query performance
- Stock discrepancies

### Audit Trail
All stock movements are logged with:
- User ID (who made the change)
- Timestamp
- Movement type
- Quantity adjusted
- Notes/reference

## Deployment

### Development
```bash
cd api
npm install
npm run migrate
npm run dev
```

### Production
```bash
cd api
npm install --production
npm run migrate
NODE_ENV=production npm start
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=3001
```

## Troubleshooting

### Database Connection Issues
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify database exists
- Check credentials

### Authentication Failures
- Ensure JWT_SECRET matches
- Verify token hasn't expired
- Check Authorization header format

### Stock Adjustment Issues
- Verify item exists and is active
- Ensure location exists
- Check movement type is valid
- Verify user has operator+ role

## Support & Documentation

- Full API docs: `INVENTORY_API.md`
- Postman collection: `inventory-api.postman_collection.json`
- API README: `api/README.md`
- This guide: `INVENTORY_SYSTEM.md`
