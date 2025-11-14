# API Specification

This document describes the API endpoints available in the system.

## Admin API

For barbershop booking system admin endpoints, see the [Admin API Documentation](docs/admin-api.md).

The admin API provides:
- JWT-based authentication (password + magic link)
- Services CRUD operations
- Barbers management
- Availability management (recurring templates + date overrides)
- Bookings management with filtering and pagination
- Comprehensive validation and error handling

Quick admin API endpoints:
- **Auth**: `POST /api/auth/login`, `POST /api/auth/magic-link`
- **Services**: `GET/POST/PUT/DELETE /api/admin/services`
- **Barbers**: `GET/POST/PUT/DELETE /api/admin/barbers`
- **Availability**: `/api/admin/availability/templates`, `/api/admin/availability/overrides`
- **Bookings**: `GET /api/admin/bookings` (with filtering & pagination)

---

# Inventory Scanner API Specification (Legacy)

This section describes the API support and integration points for the Inventory Barcode Scanner system.

## Overview

The scanner is designed to work with backend APIs for:
- Item lookup by barcode/SKU
- Stock adjustment operations
- Inventory reporting
- User authentication (optional)

## Scanner Result Format

All scan results follow this format:

```typescript
interface BarcodeScanResult {
  data: string           // The scanned barcode/QR code value
  format: string         // Format identifier (CODE_128, QR_CODE, MANUAL_ENTRY, etc.)
  timestamp: number      // Unix timestamp of scan
}
```

## Item Lookup Endpoint

### Recommended Endpoint Pattern

```
GET /api/items/:barcode
GET /api/inventory/lookup/:sku
POST /api/items/search
```

### Request Example

```bash
curl -X GET "https://api.example.com/api/items/123456789" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Format (Recommended)

**Success (200):**
```json
{
  "id": "item-123",
  "barcode": "123456789",
  "sku": "SKU-001",
  "name": "Widget A",
  "description": "Premium widget variant",
  "price": 29.99,
  "quantity": 150,
  "location": "Warehouse A, Shelf 3",
  "category": "widgets",
  "status": "active"
}
```

**Not Found (404):**
```json
{
  "error": "Item not found",
  "barcode": "123456789"
}
```

**Error (500):**
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Stock Adjustment Endpoint

### Endpoint Pattern

```
PATCH /api/inventory/:itemId/adjust
POST /api/inventory/adjustments
```

### Request Example

```bash
curl -X PATCH "https://api.example.com/api/inventory/item-123/adjust" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adjustment": 1,
    "reason": "scanned_entry",
    "notes": "Manual inventory count"
  }'
```

### Request Body

```typescript
{
  adjustment: number           // Quantity change (+/-)
  reason: string              // 'scanned_entry' | 'manual_adjustment' | 'correction'
  notes?: string              // Optional notes
  location?: string           // Optional warehouse location
  batchId?: string            // Optional batch/transaction ID
  timestamp?: number          // Optional override timestamp
}
```

### Response Example

```json
{
  "success": true,
  "itemId": "item-123",
  "previousQuantity": 150,
  "newQuantity": 151,
  "adjustment": 1,
  "timestamp": 1699564800,
  "adjustmentId": "adj-456"
}
```

## Batch Operations

### Bulk Item Lookup

```
POST /api/items/batch-lookup
```

Request:
```json
{
  "barcodes": ["123456789", "987654321", "555555555"],
  "includePrice": true,
  "includeLocation": true
}
```

Response:
```json
{
  "results": [
    {
      "barcode": "123456789",
      "found": true,
      "item": { /* item data */ }
    },
    {
      "barcode": "999999999",
      "found": false,
      "error": "Item not found"
    }
  ]
}
```

## Authentication

For secured endpoints, include authorization:

```typescript
// Bearer Token
headers: {
  'Authorization': `Bearer ${token}`
}

// Basic Auth
headers: {
  'Authorization': 'Basic ' + btoa('username:password')
}

// API Key
headers: {
  'X-API-Key': apiKey
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid barcode format |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Item not found |
| 409 | Conflict (e.g., insufficient stock) |
| 429 | Rate limited |
| 500 | Server error |

## Rate Limiting

Recommended headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699564800
```

Handle 429 responses with exponential backoff:

```typescript
async function withRetry(fn, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429 && i < maxAttempts - 1) {
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
}
```

## Integration Examples

### Minimal API Integration

```typescript
// src/services/itemApi.ts
export async function lookupItem(barcode: string) {
  const response = await fetch(`/api/items/${barcode}`)
  
  if (!response.ok) {
    throw new Error(`Item lookup failed: ${response.statusText}`)
  }
  
  return response.json()
}

export async function adjustStock(itemId: string, quantity: number) {
  const response = await fetch(`/api/inventory/${itemId}/adjust`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adjustment: quantity,
      reason: 'scanned_entry'
    })
  })
  
  if (!response.ok) {
    throw new Error(`Stock adjustment failed: ${response.statusText}`)
  }
  
  return response.json()
}
```

### Component Integration

```typescript
import { useEffect, useState } from 'react'
import { lookupItem } from '../services/itemApi'
import { BarcodeScanner, BarcodeScanResult } from '../components/BarcodeScanner'

export function InventoryManagerWithAPI() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleScan = async (result: BarcodeScanResult) => {
    setLoading(true)
    setError(null)
    
    try {
      const itemData = await lookupItem(result.data)
      
      // Add or update item in inventory
      const existingIndex = items.findIndex(i => i.id === itemData.id)
      if (existingIndex >= 0) {
        const updated = [...items]
        updated[existingIndex].quantity += 1
        setItems(updated)
      } else {
        setItems([...items, { ...itemData, quantity: 1 }])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <BarcodeScanner onScan={handleScan} />
      {/* Rest of component */}
    </div>
  )
}
```

## Webhooks (Optional)

For real-time updates, implement webhooks:

```
POST /webhooks/inventory-updated
```

Payload:
```json
{
  "event": "inventory.adjusted",
  "timestamp": 1699564800,
  "data": {
    "itemId": "item-123",
    "adjustment": 1,
    "newQuantity": 151
  }
}
```

## Caching Strategy

Recommended client-side caching:

```typescript
const itemCache = new Map()

async function getCachedItem(barcode: string) {
  if (itemCache.has(barcode)) {
    return itemCache.get(barcode)
  }
  
  const item = await lookupItem(barcode)
  itemCache.set(barcode, item)
  
  // Clear cache after 5 minutes
  setTimeout(() => itemCache.delete(barcode), 5 * 60 * 1000)
  
  return item
}
```

## CORS Requirements

For browser-based scanning, ensure API supports CORS:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Testing API Integration

```typescript
// Mock API for testing
vi.mock('../services/itemApi', () => ({
  lookupItem: vi.fn((barcode) => {
    const db = {
      '123456789': { id: 'item-1', name: 'Widget A' },
    }
    return Promise.resolve(db[barcode] || null)
  })
}))
```

## Offline Support

For offline-first functionality:

```typescript
async function lookupItemWithOfflineSupport(barcode: string) {
  try {
    return await lookupItem(barcode)
  } catch (error) {
    // Fall back to local cache
    const cached = localStorage.getItem(`item_${barcode}`)
    if (cached) {
      return JSON.parse(cached)
    }
    throw error
  }
}
```

## Versioning

Use API versioning for backward compatibility:

```
GET /api/v1/items/:barcode
GET /api/v2/items/:barcode
```

## Supplier and Purchase Order APIs

The system now includes comprehensive supplier management and purchase order capabilities.

### Quick Start

```typescript
// Fetch suppliers
const suppliers = await fetch('/api/suppliers?active=true')
  .then(res => res.json())

// Create purchase order
const po = await fetch('/api/purchase-orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    supplier_id: 1,
    location_id: 1,
    items: [
      { item_id: 5, quantity: 100, unit_price: 9.99 }
    ]
  })
}).then(res => res.json())

// Submit order
await fetch(`/api/purchase-orders/${po.id}/submit`, {
  method: 'POST'
})

// Receive items
await fetch(`/api/purchase-orders/${po.id}/receive`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { item_id: 5, received_quantity: 100 }
    ]
  })
})
```

For complete documentation, see [Purchase Orders Guide](docs/PURCHASE_ORDERS.md).

## Documentation Links

- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Purchase Orders Documentation](docs/PURCHASE_ORDERS.md)
