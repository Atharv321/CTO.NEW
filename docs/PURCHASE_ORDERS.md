# Purchase Order Integration Workflow

## Overview

The Purchase Order (PO) system provides comprehensive supplier management and stock ordering capabilities. It integrates seamlessly with the inventory system to track orders from creation through receiving.

## Architecture

### Database Schema

The PO system consists of several interconnected tables:

- **suppliers**: Store supplier information, contact details, and lead times
- **locations**: Warehouse/store locations where items can be delivered
- **supplier_locations**: Many-to-many relationship linking suppliers to locations
- **supplier_preferred_items**: Items offered by suppliers with pricing
- **purchase_orders**: Main PO records with status tracking
- **purchase_order_items**: Line items within each PO
- **items**: Existing inventory items that can be ordered

### Status Flow

Purchase orders follow a strict status workflow:

```
draft → submitted → received
  ↓         ↓
cancelled  cancelled
```

**Status Descriptions:**
- **draft**: PO is being created/edited. Can be modified or deleted.
- **submitted**: PO has been sent to supplier. No longer editable.
- **received**: All items have been received and stock updated.
- **cancelled**: PO was cancelled before completion.

## API Endpoints

### Supplier Management

#### Create Supplier
```
POST /api/suppliers

Body:
{
  "name": "Acme Supplies",
  "contact_name": "John Doe",
  "contact_email": "john@acme.com",
  "contact_phone": "555-1234",
  "address": "123 Main St, City, State 12345",
  "lead_time_days": 7,
  "notes": "Reliable supplier for office supplies"
}

Response: 201 Created
{
  "id": 1,
  "name": "Acme Supplies",
  "contact_name": "John Doe",
  "contact_email": "john@acme.com",
  "contact_phone": "555-1234",
  "address": "123 Main St, City, State 12345",
  "lead_time_days": 7,
  "notes": "Reliable supplier for office supplies",
  "active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### List Suppliers
```
GET /api/suppliers?page=1&limit=50&active=true&search=acme

Response: 200 OK
{
  "data": [
    {
      "id": 1,
      "name": "Acme Supplies",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "totalPages": 1
  }
}
```

#### Get Supplier Details
```
GET /api/suppliers/:id

Response: 200 OK
{
  "id": 1,
  "name": "Acme Supplies",
  "contact_name": "John Doe",
  "contact_email": "john@acme.com",
  "lead_time_days": 7,
  "preferred_items": [
    {
      "id": 1,
      "item_id": 5,
      "sku": "WIDGET-001",
      "name": "Premium Widget",
      "supplier_sku": "ACM-WIDGET-001",
      "unit_price": "9.99",
      "minimum_order_quantity": 10
    }
  ],
  "locations": [
    {
      "id": 1,
      "name": "Main Warehouse",
      "address": "456 Storage Ln"
    }
  ]
}
```

#### Update Supplier
```
PUT /api/suppliers/:id

Body:
{
  "contact_email": "newemail@acme.com",
  "lead_time_days": 10
}

Response: 200 OK
```

#### Delete Supplier
```
DELETE /api/suppliers/:id              # Soft delete (sets active=false)
DELETE /api/suppliers/:id?hard=true    # Hard delete (removes from DB)

Response: 200 OK
```

#### Manage Preferred Items
```
POST /api/suppliers/:id/items
Body:
{
  "item_id": 5,
  "supplier_sku": "ACM-WIDGET-001",
  "unit_price": 9.99,
  "minimum_order_quantity": 10
}

DELETE /api/suppliers/:id/items/:itemId
```

#### Manage Locations
```
POST /api/suppliers/:id/locations
Body:
{
  "location_id": 1
}

DELETE /api/suppliers/:id/locations/:locationId
```

### Purchase Order Management

#### Create Draft Purchase Order
```
POST /api/purchase-orders

Body:
{
  "supplier_id": 1,
  "location_id": 1,
  "notes": "Quarterly restock",
  "created_by": "user@example.com",
  "items": [
    {
      "item_id": 5,
      "quantity": 100,
      "unit_price": 9.99
    },
    {
      "item_id": 6,
      "quantity": 50,
      "unit_price": 14.99
    }
  ]
}

Response: 201 Created
{
  "id": 1,
  "po_number": "PO-20240115-0001",
  "supplier_id": 1,
  "location_id": 1,
  "status": "draft",
  "total_amount": "1749.50",
  "notes": "Quarterly restock",
  "created_by": "user@example.com",
  "created_at": "2024-01-15T10:30:00Z",
  "submitted_at": null,
  "received_at": null,
  "items": [
    {
      "id": 1,
      "po_id": 1,
      "item_id": 5,
      "sku": "WIDGET-001",
      "name": "Premium Widget",
      "quantity": 100,
      "unit_price": "9.99",
      "received_quantity": 0,
      "line_total": "999.00"
    },
    {
      "id": 2,
      "po_id": 1,
      "item_id": 6,
      "sku": "GADGET-001",
      "name": "Super Gadget",
      "quantity": 50,
      "unit_price": "14.99",
      "received_quantity": 0,
      "line_total": "749.50"
    }
  ]
}
```

#### List Purchase Orders
```
GET /api/purchase-orders?page=1&limit=50&status=draft&supplier_id=1&location_id=1

Response: 200 OK
{
  "data": [
    {
      "id": 1,
      "po_number": "PO-20240115-0001",
      "supplier_id": 1,
      "supplier_name": "Acme Supplies",
      "location_id": 1,
      "location_name": "Main Warehouse",
      "status": "draft",
      "total_amount": "1749.50",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1
  }
}
```

#### Get Purchase Order Details
```
GET /api/purchase-orders/:id

Response: 200 OK
{
  "id": 1,
  "po_number": "PO-20240115-0001",
  "supplier_id": 1,
  "supplier_name": "Acme Supplies",
  "supplier_email": "john@acme.com",
  "location_id": 1,
  "location_name": "Main Warehouse",
  "location_address": "456 Storage Ln",
  "status": "draft",
  "total_amount": "1749.50",
  "notes": "Quarterly restock",
  "created_by": "user@example.com",
  "created_at": "2024-01-15T10:30:00Z",
  "submitted_at": null,
  "received_at": null,
  "items": [...]
}
```

#### Update Draft Purchase Order
```
PUT /api/purchase-orders/:id

Body:
{
  "notes": "Updated notes",
  "items": [
    {
      "item_id": 5,
      "quantity": 120,
      "unit_price": 9.99
    }
  ]
}

Response: 200 OK

Note: Only draft POs can be updated. Returns 400 for non-draft POs.
```

#### Submit Purchase Order
```
POST /api/purchase-orders/:id/submit

Response: 200 OK
{
  "id": 1,
  "po_number": "PO-20240115-0001",
  "status": "submitted",
  "submitted_at": "2024-01-15T11:00:00Z",
  ...
}

Business Rules:
- PO must be in 'draft' status
- PO must have at least one item
- Once submitted, PO cannot be edited
```

#### Receive Purchase Order Items
```
POST /api/purchase-orders/:id/receive

Body:
{
  "items": [
    {
      "item_id": 5,
      "received_quantity": 100
    },
    {
      "item_id": 6,
      "received_quantity": 50
    }
  ]
}

Response: 200 OK
{
  "id": 1,
  "status": "received",
  "received_at": "2024-01-20T09:00:00Z",
  "items": [
    {
      "item_id": 5,
      "quantity": 100,
      "received_quantity": 100,
      ...
    }
  ]
}

Business Rules:
- PO must be in 'submitted' status
- Stock is automatically updated for each received item
- Partial receiving is supported (status remains 'submitted')
- When all items fully received, status changes to 'received'
```

#### Cancel Purchase Order
```
POST /api/purchase-orders/:id/cancel

Response: 200 OK
{
  "id": 1,
  "status": "cancelled",
  ...
}

Business Rules:
- Cannot cancel 'received' POs
- Can cancel 'draft' or 'submitted' POs
```

#### Export Purchase Order
```
GET /api/purchase-orders/:id/export?format=csv

Response: 200 OK (CSV file download)

GET /api/purchase-orders/:id/export?format=pdf

Response: 200 OK (PDF placeholder - to be implemented)
{
  "message": "PDF export not yet implemented",
  "placeholder": true,
  "po_number": "PO-20240115-0001",
  "supplier": "Acme Supplies",
  "total_amount": "1749.50",
  "items_count": 2
}
```

#### Delete Purchase Order
```
DELETE /api/purchase-orders/:id

Response: 200 OK

Business Rules:
- Only draft POs can be deleted
- Returns 400 for non-draft POs
```

## Integration with Inventory System

### Stock Updates

When items are received via `POST /api/purchase-orders/:id/receive`, the system automatically:

1. Updates the `received_quantity` field in `purchase_order_items`
2. Increments the `quantity` field in the `items` table
3. Changes PO status to 'received' when all items are fully received

Example:
```sql
-- Before receiving
SELECT quantity FROM items WHERE id = 5;  -- Returns: 50

-- Receive 100 units via PO
POST /api/purchase-orders/1/receive
{
  "items": [{ "item_id": 5, "received_quantity": 100 }]
}

-- After receiving
SELECT quantity FROM items WHERE id = 5;  -- Returns: 150
```

### Item Availability

Items referenced in purchase orders must exist in the `items` table. The system validates this via foreign key constraints.

### Location Tracking

Each purchase order is linked to a specific location where items will be delivered. This enables:
- Location-specific inventory tracking
- Multi-warehouse management
- Supplier-location relationships

## Workflow Examples

### Complete Purchase Order Lifecycle

```bash
# 1. Create a supplier
curl -X POST http://localhost:3001/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Depot",
    "contact_email": "sales@officedepot.com",
    "lead_time_days": 5
  }'
# Returns: { "id": 1, ... }

# 2. Link supplier to location
curl -X POST http://localhost:3001/api/suppliers/1/locations \
  -H "Content-Type: application/json" \
  -d '{ "location_id": 1 }'

# 3. Add preferred items
curl -X POST http://localhost:3001/api/suppliers/1/items \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 5,
    "unit_price": 9.99,
    "minimum_order_quantity": 10
  }'

# 4. Create draft PO
curl -X POST http://localhost:3001/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": 1,
    "location_id": 1,
    "items": [
      { "item_id": 5, "quantity": 50, "unit_price": 9.99 }
    ]
  }'
# Returns: { "id": 1, "po_number": "PO-20240115-0001", "status": "draft" }

# 5. Review and update PO (optional)
curl -X PUT http://localhost:3001/api/purchase-orders/1 \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Rush order",
    "items": [
      { "item_id": 5, "quantity": 100, "unit_price": 9.99 }
    ]
  }'

# 6. Submit PO to supplier
curl -X POST http://localhost:3001/api/purchase-orders/1/submit

# 7. Receive items (when delivered)
curl -X POST http://localhost:3001/api/purchase-orders/1/receive \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "item_id": 5, "received_quantity": 100 }
    ]
  }'

# 8. Export PO for records
curl http://localhost:3001/api/purchase-orders/1/export?format=csv > po_report.csv
```

### Partial Receiving

```bash
# Submit PO with 100 units
curl -X POST http://localhost:3001/api/purchase-orders/1/submit

# Receive partial shipment (40 units)
curl -X POST http://localhost:3001/api/purchase-orders/1/receive \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "item_id": 5, "received_quantity": 40 }
    ]
  }'
# Status remains 'submitted'

# Receive remaining (60 units)
curl -X POST http://localhost:3001/api/purchase-orders/1/receive \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "item_id": 5, "received_quantity": 60 }
    ]
  }'
# Status changes to 'received'
```

## Business Rules Summary

### Purchase Order States

| Status | Can Edit | Can Submit | Can Receive | Can Cancel | Can Delete |
|--------|----------|------------|-------------|------------|------------|
| draft | ✓ | ✓ | ✗ | ✓ | ✓ |
| submitted | ✗ | ✗ | ✓ | ✓ | ✗ |
| received | ✗ | ✗ | ✗ | ✗ | ✗ |
| cancelled | ✗ | ✗ | ✗ | ✗ | ✗ |

### Validation Rules

- **Create PO**: Must have supplier_id and location_id
- **Submit PO**: Must have at least one item
- **Receive PO**: Must provide valid item_id and received_quantity > 0
- **Status Transitions**: Must follow draft → submitted → received flow
- **Stock Updates**: Automatically applied when receiving items
- **Item Validation**: Items must exist in items table

## Error Handling

### Common Error Responses

```json
// 400 Bad Request
{
  "error": "supplier_id is required"
}

// 404 Not Found
{
  "error": "Purchase order not found"
}

// 400 Business Rule Violation
{
  "error": "Can only submit draft purchase orders"
}

// 500 Internal Server Error
{
  "error": "Failed to create purchase order",
  "message": "Database connection error"
}
```

## Testing

The API includes comprehensive integration tests covering:

- CRUD operations for suppliers and purchase orders
- Status transition validation
- Stock integration verification
- Partial receiving scenarios
- Error handling and edge cases

Run tests:
```bash
cd api
npm test tests/suppliers.test.js
npm test tests/purchaseOrders.test.js
```

## Future Enhancements

- Email notifications to suppliers when PO submitted
- Automatic reorder point triggers
- Supplier performance metrics
- Multi-currency support
- Approval workflows for large orders
- PDF generation for export
- Barcode integration for receiving
- Historical pricing analysis
