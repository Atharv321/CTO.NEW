# Inventory API Documentation

## Overview

The Inventory API provides comprehensive REST endpoints for managing inventory items, categories, and stock levels across multiple locations. The API supports role-based access control, pagination, filtering, and full audit trails.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All endpoints (except `/health`) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

## Role-Based Permissions

The API supports four role levels:

- **admin**: Full access to all operations including create, update, delete
- **manager**: Can create, read, and update items and categories; can manage stock
- **operator**: Can read items and adjust stock levels; cannot delete
- **viewer**: Read-only access to items and stock levels

## Categories Endpoints

### Create Category

**POST** `/categories`

**Required Role**: admin, manager

**Request Body**:
```json
{
  "name": "Electronics",
  "description": "Electronic items",
  "parent_category_id": null
}
```

**Response** (201):
```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic items",
  "parent_category_id": null,
  "active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### List Categories

**GET** `/categories`

**Query Parameters**:
- `page` (default: 1) - Page number for pagination
- `limit` (default: 20, max: 100) - Items per page
- `search` - Search categories by name

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic items",
      "parent_category_id": null,
      "active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Get Category

**GET** `/categories/:id`

**Response** (200):
```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic items",
  "parent_category_id": null,
  "active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Update Category

**PUT** `/categories/:id`

**Required Role**: admin, manager

**Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response** (200): Updated category object

### Delete Category

**DELETE** `/categories/:id`

**Required Role**: admin

**Response**: (204) No Content

## Items Endpoints

### Create Item

**POST** `/items`

**Required Role**: admin, manager

**Request Body**:
```json
{
  "sku": "SKU-001",
  "barcode": "1234567890",
  "name": "Widget A",
  "description": "Premium widget variant",
  "category_id": 1,
  "supplier_id": 1,
  "unit_cost": 10.00,
  "unit_price": 19.99,
  "reorder_level": 10,
  "lead_time_days": 5
}
```

**Response** (201): Created item object

### List Items

**GET** `/items`

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page
- `search` - Search by name, SKU, or barcode
- `category_id` - Filter by category
- `supplier_id` - Filter by supplier
- `location_id` - Filter by location (shows only items in stock at location)

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "sku": "SKU-001",
      "barcode": "1234567890",
      "name": "Widget A",
      "description": "Premium widget variant",
      "category_id": 1,
      "category_name": "Electronics",
      "supplier_id": 1,
      "supplier_name": "Supplier A",
      "unit_cost": 10.00,
      "unit_price": 19.99,
      "reorder_level": 10,
      "lead_time_days": 5,
      "active": true,
      "created_by": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Search Items

**GET** `/items/search/:query`

**Path Parameters**:
- `query` - Search term (searches name, SKU, barcode)

**Response** (200):
```json
[
  {
    "id": 1,
    "sku": "SKU-001",
    "barcode": "1234567890",
    "name": "Widget A"
  }
]
```

### Get Item by SKU

**GET** `/items/sku/:sku`

**Response** (200): Item object with category and supplier details

### Get Item by Barcode

**GET** `/items/barcode/:barcode`

**Response** (200): Item object with category and supplier details

### Get Item

**GET** `/items/:id`

**Response** (200): Item object with category and supplier details

### Update Item

**PUT** `/items/:id`

**Required Role**: admin, manager

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "category_id": 2,
  "supplier_id": 2,
  "unit_cost": 12.00,
  "unit_price": 21.99,
  "reorder_level": 15,
  "lead_time_days": 7,
  "active": true
}
```

**Response** (200): Updated item object

### Delete Item

**DELETE** `/items/:id`

**Required Role**: admin

**Response** (204): No Content

## Stock Endpoints

### Get Stock by Item

**GET** `/stock/item/:itemId`

**Response** (200):
```json
[
  {
    "id": 1,
    "item_id": 1,
    "location_id": 1,
    "quantity_on_hand": 100,
    "quantity_reserved": 10,
    "quantity_available": 90,
    "location_name": "Warehouse A",
    "location_code": "WH-A",
    "last_counted_at": "2024-01-15T10:00:00Z",
    "last_counted_by": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### Get Total Stock by Item

**GET** `/stock/item/:itemId/total`

**Response** (200):
```json
{
  "totalOnHand": 500,
  "totalReserved": 50,
  "totalAvailable": 450
}
```

### Get Stock by Location

**GET** `/stock/location/:locationId`

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page
- `search` - Search by item name, SKU, or barcode
- `below_reorder` (true/false) - Show only items below reorder level

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "item_id": 1,
      "location_id": 1,
      "quantity_on_hand": 50,
      "quantity_reserved": 5,
      "quantity_available": 45,
      "sku": "SKU-001",
      "item_name": "Widget A",
      "barcode": "1234567890"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

### Get Location Summary

**GET** `/stock/location/:locationId/summary`

**Response** (200):
```json
{
  "total_items": 100,
  "total_quantity": 5000,
  "below_reorder_count": 8
}
```

### Get Stock Level

**GET** `/stock/:itemId/:locationId`

**Response** (200):
```json
{
  "id": 1,
  "item_id": 1,
  "location_id": 1,
  "quantity_on_hand": 100,
  "quantity_reserved": 10,
  "quantity_available": 90
}
```

### Adjust Stock

**POST** `/stock/:itemId/:locationId/adjust`

**Required Role**: admin, manager, operator

**Request Body**:
```json
{
  "quantity": 5,
  "location_id": 1,
  "movement_type": "receipt",
  "notes": "Received from supplier",
  "reference_id": "PO-12345"
}
```

**Movement Types**:
- `receipt` - Stock received
- `issue` - Stock removed
- `adjustment` - Manual adjustment
- `count` - Physical count adjustment
- `return` - Return received

**Response** (200):
```json
{
  "id": 1,
  "item_id": 1,
  "location_id": 1,
  "movement_type": "receipt",
  "quantity": 5,
  "reference_type": "inventory_adjustment",
  "reference_id": "PO-12345",
  "notes": "Received from supplier",
  "user_id": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Initialize Stock

**POST** `/stock/:itemId/:locationId/init`

**Required Role**: admin, manager

**Request Body**:
```json
{
  "quantity": 100
}
```

**Response** (201): Stock level object

### Get Stock Movement History

**GET** `/stock/:itemId/:locationId/history`

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

**Response** (200):
```json
[
  {
    "id": 1,
    "item_id": 1,
    "location_id": 1,
    "movement_type": "receipt",
    "quantity": 5,
    "reference_type": "inventory_adjustment",
    "reference_id": "PO-12345",
    "notes": "Received from supplier",
    "user_id": 1,
    "username": "john.doe",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request body or parameters"
}
```

### 401 Unauthorized

```json
{
  "error": "No token provided"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions",
  "required": ["admin", "manager"],
  "current": "viewer"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 409 Conflict

```json
{
  "error": "Resource already exists"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error message"
}
```

## Pagination

Most list endpoints support pagination with the following parameters:

- `page` - Page number (default: 1, minimum: 1)
- `limit` - Items per page (default: 20, maximum: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

## Filtering

### Text Search

Use the `search` parameter to filter by text:
```
GET /items?search=widget
```

Searches across:
- Items: name, SKU, barcode
- Categories: name

### Category Filter

Filter items by category:
```
GET /items?category_id=5
```

### Supplier Filter

Filter items by supplier:
```
GET /items?supplier_id=3
```

### Location Filter

Filter items with stock at a specific location:
```
GET /items?location_id=2
```

### Below Reorder Level

Show stock levels below reorder threshold:
```
GET /stock/location/1?below_reorder=true
```

## Data Validation

### SKU
- Required for items
- Must be unique
- String format

### Category ID
- Required for items
- Must reference existing category
- Integer format

### Stock Quantity
- Must be non-negative
- Integer format
- Cannot exceed system limits

### Movement Type
- Required for stock adjustments
- Must be one of: receipt, issue, adjustment, count, return

## Rate Limiting

No rate limiting is currently configured. For production deployments, consider implementing rate limiting per user/token.

## Examples

### Create a Category

```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic items"
  }'
```

### Create an Item

```bash
curl -X POST http://localhost:3001/api/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SKU-001",
    "name": "Widget A",
    "category_id": 1,
    "unit_price": 29.99
  }'
```

### Get Items with Pagination

```bash
curl -X GET "http://localhost:3001/api/items?page=1&limit=10&search=widget" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Adjust Stock

```bash
curl -X POST http://localhost:3001/api/stock/1/1/adjust \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "location_id": 1,
    "movement_type": "receipt",
    "notes": "Received shipment"
  }'
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table
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

### Stock Levels Table
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
