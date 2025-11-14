# Stock Management API Documentation

## Overview

This API provides comprehensive stock management functionality including inventory tracking, stock movements, low stock monitoring, and audit logging. All operations are ACID-compliant with full transaction support.

## Base URL

```
http://localhost:3001/api/stock
```

## Authentication

Currently, the API accepts user information through headers:
- `X-User-ID`: User identifier
- `X-User-Name`: User display name

If not provided, operations will be attributed to 'anonymous'.

## Data Types

- **UUID**: String identifier for resources
- **Decimal**: Numeric values with 3 decimal places for quantities
- **Timestamp**: ISO 8601 formatted datetime strings

## Endpoints

### Products

#### Create Product
```http
POST /api/stock/products
```

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Optional description",
  "barcode": "1234567890123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Product Name",
    "description": "Optional description",
    "barcode": "1234567890123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Product created successfully"
}
```

#### Get Product
```http
GET /api/stock/products/{id}
```

#### Get All Products
```http
GET /api/stock/products?limit=100&offset=0
```

### Locations

#### Create Location
```http
POST /api/stock/locations
```

**Request Body:**
```json
{
  "name": "Warehouse A",
  "description": "Main warehouse",
  "address": "123 Storage Street"
}
```

#### Get Location
```http
GET /api/stock/locations/{id}
```

#### Get All Locations
```http
GET /api/stock/locations?limit=100&offset=0
```

### Stock Movements

#### Receive Stock
```http
POST /api/stock/receive
```

**Request Body:**
```json
{
  "productId": "uuid",
  "locationId": "uuid",
  "quantity": 100.5,
  "reason": "Purchase order receipt",
  "referenceNumber": "PO-001",
  "barcode": "1234567890123",
  "metadata": {
    "supplier": "ABC Company",
    "invoice": "INV-001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "movementId": "uuid",
  "inventory": {
    "id": "uuid",
    "product_id": "uuid",
    "location_id": "uuid",
    "quantity": "100.500",
    "reserved_quantity": "0.000",
    "low_stock_threshold": "10.000"
  },
  "message": "Stock received successfully"
}
```

#### Consume Stock
```http
POST /api/stock/consume
```

**Request Body:**
```json
{
  "productId": "uuid",
  "locationId": "uuid",
  "quantity": 25,
  "reason": "Production use",
  "referenceNumber": "WO-001",
  "barcode": "1234567890123"
}
```

#### Adjust Stock
```http
POST /api/stock/adjust
```

**Request Body:**
```json
{
  "productId": "uuid",
  "locationId": "uuid",
  "quantity": 75,
  "reason": "Physical count adjustment",
  "referenceNumber": "ADJ-001"
}
```

#### Get Stock History
```http
GET /api/stock/history?productId=uuid&locationId=uuid&movementType=RECEIVE&startDate=2024-01-01&endDate=2024-01-31&limit=100&offset=0
```

**Query Parameters:**
- `productId`: Filter by product (optional)
- `locationId`: Filter by location (optional)
- `movementType`: Filter by movement type (RECEIVE, CONSUME, ADJUST)
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)
- `limit`: Maximum results to return (default: 100)
- `offset`: Results to skip (default: 0)

### Inventory

#### Get Specific Inventory
```http
GET /api/stock/inventory?productId=uuid&locationId=uuid
```

#### Get All Inventory
```http
GET /api/stock/inventory?limit=100&offset=0
```

### Low Stock Management

#### Get Low Stock Alerts
```http
GET /api/stock/low-stock?locationId=uuid
```

#### Update Low Stock Threshold
```http
PUT /api/stock/low-stock/threshold
```

**Request Body:**
```json
{
  "productId": "uuid",
  "locationId": "uuid",
  "threshold": 25
}
```

#### Get Low Stock Notifications
```http
GET /api/stock/low-stock/notifications?locationId=uuid
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "type": "LOW_STOCK_CRITICAL",
      "priority": "HIGH",
      "productId": "uuid",
      "locationId": "uuid",
      "sku": "PROD-001",
      "productName": "Product Name",
      "locationName": "Warehouse A",
      "currentQuantity": 5.0,
      "threshold": 10.0,
      "availableQuantity": 5.0,
      "shortageAmount": 5.0,
      "message": "Critical: Product Name at Warehouse A is below low stock threshold...",
      "recommendedAction": "Reorder immediately",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "summary": {
    "critical": 1,
    "warning": 3,
    "total": 4
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Get Items Approaching Low Stock
```http
GET /api/stock/low-stock/approaching?locationId=uuid&daysAhead=7
```

#### Get Stock Health Metrics
```http
GET /api/stock/low-stock/health?locationId=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalItems": 150,
    "lowStockItems": 12,
    "trackedItems": 100,
    "lowStockPercentage": 12.0,
    "inventoryHealthScore": 145.5,
    "healthStatus": "GOOD",
    "totalAvailableQuantity": 5000.0,
    "weeklyMovements": {
      "total": 45,
      "receives": 15,
      "consumes": 25,
      "adjustments": 5
    }
  },
  "locationId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Get Top Consuming Products
```http
GET /api/stock/low-stock/top-consumers?locationId=uuid&days=30&limit=10
```

#### Get Slow Moving Inventory
```http
GET /api/stock/low-stock/slow-moving?locationId=uuid&days=90
```

### Audit Log

#### Get Audit Log
```http
GET /api/stock/audit?tableName=inventory&recordId=uuid&action=UPDATE&userId=user123&startDate=2024-01-01&endDate=2024-01-31&limit=100&offset=0
```

**Query Parameters:**
- `tableName`: Filter by table name (inventory, products, locations, etc.)
- `recordId`: Filter by record ID
- `action`: Filter by action (INSERT, UPDATE, DELETE)
- `userId`: Filter by user who performed the action
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)
- `limit`: Maximum results to return (default: 100)
- `offset`: Results to skip (default: 0)

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created successfully
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error

## ACID Compliance

All stock movement operations are ACID-compliant:

- **Atomicity**: Operations either complete fully or not at all
- **Consistency**: Database remains in a valid state after each operation
- **Isolation**: Concurrent operations don't interfere with each other
- **Durability**: Completed operations persist even after system failures

## Concurrency Control

The API uses database row-level locking to ensure consistency during concurrent operations. When multiple requests try to modify the same inventory item simultaneously, they are queued and processed sequentially.

## Audit Trail

Every inventory change creates an audit log entry with:
- Before and after values
- User attribution
- Timestamp
- IP address and user agent
- Change context

## Low Stock Notifications

The low stock service provides:

1. **Critical Alerts**: Items currently below threshold
2. **Warning Alerts**: Items projected to reach low stock within specified timeframe
3. **Health Metrics**: Overall inventory health assessment
4. **Consumption Analytics**: Top consuming products and slow-moving items

## Decimal Precision

All quantity values use DECIMAL(15, 3) precision, supporting:
- Up to 12 digits before decimal point
- 3 digits after decimal point
- Suitable for both large quantities and precise measurements

## Barcode Support

Barcodes can be associated with:
- Products (master barcode)
- Individual stock movements (batch/barcode level tracking)

## Reference Numbers

Optional reference numbers support integration with:
- Purchase orders
- Work orders
- Adjustment documents
- External systems

## Metadata

Optional JSON metadata field allows storing additional information like:
- Supplier details
- Batch numbers
- Expiration dates
- Custom fields