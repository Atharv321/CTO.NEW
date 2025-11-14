# Stock Workflows API Documentation

## Overview

The Stock Workflows API provides ACID-safe operations for managing inventory stock movements across multiple locations. It supports receiving, consuming, and adjusting stock with full audit trail capabilities.

## Features

- **Atomic Operations**: All stock movements are ACID-compliant with transaction rollback on errors
- **Audit Logging**: Complete audit trail for every stock change with user attribution
- **Low Stock Detection**: Real-time monitoring of inventory levels below thresholds
- **Barcode Support**: Track stock movements with barcode references
- **Location-based Inventory**: Manage stock across multiple locations
- **User Attribution**: Track which user made each change with IP address and user agent
- **Metadata Support**: Attach custom metadata to stock movements

## Endpoints

### 1. Receive Stock

Add new stock to inventory (e.g., deliveries, restocking).

**Endpoint**: `POST /api/stock/receive`

**Request Body**:
```json
{
  "itemId": "item-olive-oil",
  "locationId": "loc-kitchen-east",
  "quantity": 15,
  "reason": "New shipment from supplier",
  "userId": "user-123",
  "barcodeReference": "SHIP-001",
  "metadata": {
    "deliveryNote": "DN-789",
    "supplier": "Acme Foods"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "item": {
    "id": "item-olive-oil",
    "name": "Extra Virgin Olive Oil (1L)",
    "barcode": "OLV-001",
    "unit": "bottle",
    "category": "pantry",
    "reorderPoint": 8
  },
  "location": {
    "id": "loc-kitchen-east",
    "name": "East Kitchen",
    "address": "123 East St"
  },
  "movement": {
    "id": "mov-1",
    "itemId": "item-olive-oil",
    "locationId": "loc-kitchen-east",
    "movementType": "receive",
    "quantity": 15,
    "previousQuantity": 20,
    "newQuantity": 35,
    "reason": "New shipment from supplier",
    "userId": "user-123",
    "barcodeReference": "SHIP-001",
    "timestamp": "2024-11-14T12:30:45.123Z"
  },
  "inventoryLevel": {
    "itemId": "item-olive-oil",
    "locationId": "loc-kitchen-east",
    "quantity": 35,
    "lowStockThreshold": 10,
    "isLowStock": false
  },
  "previousQuantity": 20,
  "newQuantity": 35,
  "difference": 15,
  "lowStockThreshold": 10,
  "isLowStock": false
}
```

### 2. Consume Stock

Remove stock from inventory (e.g., usage, sales).

**Endpoint**: `POST /api/stock/consume`

**Request Body**:
```json
{
  "itemId": "item-olive-oil",
  "locationId": "loc-kitchen-east",
  "quantity": 5,
  "reason": "Kitchen usage",
  "userId": "chef-456",
  "barcodeReference": "USAGE-002"
}
```

**Response** (201):
```json
{
  "success": true,
  "newQuantity": 15,
  "previousQuantity": 20,
  "difference": -5,
  "isLowStock": false
}
```

**Error Response** (400):
```json
{
  "error": "Insufficient inventory - cannot consume more than available"
}
```

### 3. Adjust Stock

Set stock to an exact quantity (e.g., inventory audits, corrections).

**Endpoint**: `POST /api/stock/adjust`

**Request Body**:
```json
{
  "itemId": "item-olive-oil",
  "locationId": "loc-kitchen-west",
  "quantity": 30,
  "reason": "Inventory audit correction",
  "userId": "manager-789"
}
```

**Response** (201):
```json
{
  "success": true,
  "newQuantity": 30,
  "previousQuantity": 12,
  "difference": 18,
  "isLowStock": false
}
```

### 4. Get Stock Movements

Retrieve history of stock movements with filtering.

**Endpoint**: `GET /api/stock/movements`

**Query Parameters**:
- `itemId` (optional): Filter by item
- `locationId` (optional): Filter by location
- `movementType` (optional): Filter by type (`receive`, `consume`, `adjust`)
- `limit` (optional): Maximum number of results (default: 100)
- `since` (optional): ISO 8601 timestamp for filtering

**Example Request**:
```
GET /api/stock/movements?itemId=item-olive-oil&movementType=receive&limit=50
```

**Response** (200):
```json
{
  "movements": [
    {
      "id": "mov-3",
      "itemId": "item-olive-oil",
      "locationId": "loc-kitchen-east",
      "movementType": "receive",
      "quantity": 10,
      "previousQuantity": 20,
      "newQuantity": 30,
      "reason": "New shipment",
      "userId": "user-123",
      "barcodeReference": "SHIP-001",
      "timestamp": "2024-11-14T12:30:45.123Z",
      "itemName": "Extra Virgin Olive Oil (1L)",
      "itemBarcode": "OLV-001",
      "locationName": "East Kitchen"
    }
  ],
  "count": 1
}
```

### 5. Get Audit Logs

Retrieve audit logs for compliance and tracking.

**Endpoint**: `GET /api/audit-logs`

**Query Parameters**:
- `entityType` (optional): Filter by entity type (e.g., `inventory_item`)
- `entityId` (optional): Filter by entity ID
- `userId` (optional): Filter by user
- `limit` (optional): Maximum number of results (default: 100)
- `since` (optional): ISO 8601 timestamp for filtering

**Example Request**:
```
GET /api/audit-logs?userId=user-123&limit=20
```

**Response** (200):
```json
{
  "logs": [
    {
      "id": "aud-1",
      "entityType": "inventory_item",
      "entityId": "item-olive-oil",
      "action": "stock_receive",
      "userId": "user-123",
      "changes": {
        "locationId": "loc-kitchen-east",
        "movementType": "receive",
        "previousQuantity": 20,
        "newQuantity": 35,
        "difference": 15,
        "reason": "New shipment from supplier",
        "barcodeReference": "SHIP-001"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-11-14T12:30:45.123Z"
    }
  ],
  "count": 1
}
```

### 6. Get Low Stock Items

Identify items below their low stock threshold.

**Endpoint**: `GET /api/stock/low-stock`

**Query Parameters**:
- `locationId` (optional): Filter by location

**Example Request**:
```
GET /api/stock/low-stock?locationId=loc-kitchen-east
```

**Response** (200):
```json
{
  "items": [
    {
      "itemId": "item-flour",
      "locationId": "loc-pantry-central",
      "quantity": 5,
      "lowStockThreshold": 10,
      "itemName": "Flour (25kg bag)",
      "itemBarcode": "FLR-025",
      "locationName": "Central Pantry",
      "isLowStock": true,
      "unitsBelowThreshold": 5
    }
  ],
  "count": 1
}
```

### 7. Compute Low Stock Threshold

Calculate optimal low stock threshold based on parameters.

**Endpoint**: `POST /api/stock/threshold/compute`

**Request Body**:
```json
{
  "reorderPoint": 20,
  "leadTime": 14,
  "safetyStock": 5
}
```

**Response** (200):
```json
{
  "threshold": 29,
  "parameters": {
    "reorderPoint": 20,
    "leadTime": 14,
    "safetyStock": 5
  }
}
```

**Calculation Formula**:
```
threshold = reorderPoint + (ceil(leadTime / 7) * 2) + safetyStock
```

### 8. Get Inventory Status

Retrieve current inventory status across locations.

**Endpoint**: `GET /api/inventory/status`

**Query Parameters**:
- `locationId` (optional): Filter by location

**Example Request**:
```
GET /api/inventory/status?locationId=loc-kitchen-east
```

**Response** (200):
```json
{
  "inventory": [
    {
      "itemId": "item-olive-oil",
      "locationId": "loc-kitchen-east",
      "quantity": 20,
      "lowStockThreshold": 10,
      "itemName": "Extra Virgin Olive Oil (1L)",
      "itemBarcode": "OLV-001",
      "locationName": "East Kitchen",
      "isLowStock": false,
      "stockStatus": "adequate"
    }
  ],
  "count": 1
}
```

## Transaction Safety

All stock movement operations are ACID-compliant:

1. **Atomicity**: All changes within a stock movement (inventory update, movement record, audit log) happen as a single atomic unit
2. **Consistency**: Inventory quantities never go negative; failed operations don't persist any changes
3. **Isolation**: Each transaction works with a snapshot of the data
4. **Durability**: Completed transactions are permanently recorded

### Example: Rollback on Error

```javascript
// Attempting to consume more than available
POST /api/stock/consume
{
  "itemId": "item-flour",
  "locationId": "loc-pantry-central",
  "quantity": 100,  // Only 5 available
  "userId": "user-1"
}

// Response: 400 Bad Request
{
  "error": "Insufficient inventory - cannot consume more than available"
}

// NO changes are persisted:
// - Inventory quantity remains unchanged
// - No stock movement record created
// - No audit log entry created
```

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "error": "Missing required fields: itemId, locationId, and quantity are required"
}
```

**400 Bad Request** (Business Logic):
```json
{
  "error": "Insufficient inventory - cannot consume more than available"
}
```

**404 Not Found**:
```json
{
  "error": "Item not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Database connection failed"
}
```

## Testing

### Run All Tests
```bash
npm test
```

### Test Coverage
- Unit tests for stock workflow functions
- Integration tests for API endpoints
- Transaction atomicity tests
- Audit log verification tests
- Low stock detection tests

All tests verify:
- ACID transaction properties
- Proper error handling and rollback
- Audit log accuracy
- Concurrent operation handling

## Example Usage

### Complete Stock Workflow Example

```javascript
// 1. Receive new stock
const receiveResponse = await fetch('/api/stock/receive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemId: 'item-olive-oil',
    locationId: 'loc-kitchen-east',
    quantity: 50,
    reason: 'Weekly delivery',
    userId: 'warehouse-001',
    barcodeReference: 'DEL-12345'
  })
});

// 2. Consume stock during operations
const consumeResponse = await fetch('/api/stock/consume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemId: 'item-olive-oil',
    locationId: 'loc-kitchen-east',
    quantity: 10,
    reason: 'Daily kitchen usage',
    userId: 'chef-002'
  })
});

// 3. Check for low stock items
const lowStockResponse = await fetch('/api/stock/low-stock');
const lowStockData = await lowStockResponse.json();

if (lowStockData.count > 0) {
  console.log('Low stock alert:', lowStockData.items);
}

// 4. Review audit trail
const auditResponse = await fetch('/api/audit-logs?entityId=item-olive-oil');
const auditData = await auditResponse.json();
console.log('Audit history:', auditData.logs);
```

## Architecture

### Data Model

```
Items
  ├─ id
  ├─ name
  ├─ barcode
  ├─ reorderPoint
  └─ unit

Locations
  ├─ id
  ├─ name
  ├─ address
  └─ defaultLowStockThreshold

Inventory Levels (Item + Location)
  ├─ itemId
  ├─ locationId
  ├─ quantity
  └─ lowStockThreshold

Stock Movements (History)
  ├─ id
  ├─ itemId
  ├─ locationId
  ├─ movementType (receive/consume/adjust)
  ├─ quantity
  ├─ previousQuantity
  ├─ newQuantity
  ├─ reason
  ├─ userId
  ├─ barcodeReference
  ├─ metadata
  └─ timestamp

Audit Logs (Compliance)
  ├─ id
  ├─ entityType
  ├─ entityId
  ├─ action
  ├─ userId
  ├─ changes (JSON)
  ├─ ipAddress
  ├─ userAgent
  └─ timestamp
```

## Best Practices

1. **Always provide userId**: Track who made each change for accountability
2. **Use barcode references**: Link movements to external systems (deliveries, POs)
3. **Add meaningful reasons**: Help with future auditing and analysis
4. **Monitor low stock regularly**: Set up automated checks for low stock items
5. **Review audit logs**: Regularly verify transaction integrity
6. **Handle errors gracefully**: Transaction rollbacks ensure data consistency

## Security Considerations

- Validate user permissions before stock operations
- Log all changes with user attribution
- Capture IP addresses and user agents for security auditing
- Implement rate limiting for API endpoints
- Use HTTPS in production
- Consider adding authentication middleware

## Performance

- In-memory transactions for fast operations
- Efficient filtering with indexed queries
- Sorted results for optimized retrieval
- Configurable result limits to prevent large payloads

## Future Enhancements

- [ ] Batch operations for multiple items
- [ ] Scheduled low stock notifications
- [ ] Export audit logs to external systems
- [ ] Real-time WebSocket updates for inventory changes
- [ ] Advanced analytics and reporting
- [ ] Multi-warehouse transfer workflows
