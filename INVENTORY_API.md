# Inventory Management API

Complete REST API for managing inventory items, categories, locations, suppliers, and multi-location stock levels with role-based access control.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Categories](#categories)
  - [Locations](#locations)
  - [Suppliers](#suppliers)
  - [Items](#items)
  - [Stock Management](#stock-management)
- [Error Codes](#error-codes)
- [Pagination](#pagination)
- [Role-Based Access Control](#role-based-access-control)

## Overview

The Inventory API provides comprehensive endpoints for:
- Managing inventory items with SKU and barcode tracking
- Organizing items into categories
- Managing warehouse locations
- Tracking supplier information
- Multi-location stock level management
- Stock adjustments with audit trail

### Base URL

```
http://localhost:3000/api
```

All endpoints require authentication via Bearer token in the Authorization header.

## Authentication

All requests require an `Authorization` header with a Bearer token:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/categories
```

### Token Format

```
Authorization: Bearer <jwt_token>
```

### Roles

- **admin**: Full access (read, create, update, delete)
- **manager**: Read, create, and update permissions
- **viewer**: Read-only access + stock adjustment capability

## Endpoints

### Categories

Manage inventory item categories.

#### List Categories

```http
GET /api/categories?page=1&limit=10
```

**Query Parameters:**
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 10, max: 100): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Electronics",
      "description": "Electronic devices and components",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Get Category by ID

```http
GET /api/categories/{categoryId}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Electronics",
  "description": "Electronic devices and components",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Response (404):**
```json
{
  "error": "Category not found"
}
```

#### Create Category

```http
POST /api/categories
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and components"
}
```

**Required Fields:**
- `name` (string, 1-255 characters): Category name (unique)

**Optional Fields:**
- `description` (string, max 1000 characters): Category description

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Electronics",
  "description": "Electronic devices and components",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Response (409):**
```json
{
  "error": "Category with this name already exists"
}
```

#### Update Category

```http
PUT /api/categories/{categoryId}
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "name": "Updated Electronics",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Electronics",
  "description": "Updated description",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### Delete Category

```http
DELETE /api/categories/{categoryId}
Authorization: Bearer <admin_token>
```

**Response (204):** No content

**Response (409):**
```json
{
  "error": "Cannot delete category with associated items"
}
```

### Locations

Manage warehouse/inventory locations.

#### List Locations

```http
GET /api/locations?page=1&limit=10
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Warehouse A",
      "description": "Main warehouse",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Get Location by ID

```http
GET /api/locations/{locationId}
```

#### Create Location

```http
POST /api/locations
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "name": "Warehouse A",
  "description": "Main warehouse"
}
```

#### Update Location

```http
PUT /api/locations/{locationId}
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "name": "Warehouse A - Updated",
  "description": "Updated description"
}
```

#### Delete Location

```http
DELETE /api/locations/{locationId}
Authorization: Bearer <admin_token>
```

### Suppliers

Manage supplier information.

#### List Suppliers

```http
GET /api/suppliers?page=1&limit=10
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Supplier Inc.",
      "contactEmail": "contact@supplier.com",
      "phone": "+1-555-0123",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Get Supplier by ID

```http
GET /api/suppliers/{supplierId}
```

#### Create Supplier

```http
POST /api/suppliers
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "name": "Supplier Inc.",
  "contactEmail": "contact@supplier.com",
  "phone": "+1-555-0123"
}
```

**Required Fields:**
- `name` (string, 1-255 characters): Supplier name (unique)

**Optional Fields:**
- `contactEmail` (string): Valid email address
- `phone` (string, max 20 characters): Contact phone number

#### Update Supplier

```http
PUT /api/suppliers/{supplierId}
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "name": "Updated Supplier Inc.",
  "contactEmail": "newemail@supplier.com"
}
```

#### Delete Supplier

```http
DELETE /api/suppliers/{supplierId}
Authorization: Bearer <admin_token>
```

### Items

Manage inventory items.

#### List Items

```http
GET /api/items?page=1&limit=10
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "sku": "SKU-001",
      "barcode": "123456789012",
      "name": "Wireless Mouse",
      "description": "USB wireless mouse",
      "categoryId": "550e8400-e29b-41d4-a716-446655440000",
      "supplierId": "550e8400-e29b-41d4-a716-446655440002",
      "price": 29.99,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Get Item by ID

```http
GET /api/items/{itemId}
```

#### Get Item by Barcode

```http
GET /api/items/barcode/{barcode}
```

Example:
```http
GET /api/items/barcode/123456789012
```

#### Get Item by SKU

```http
GET /api/items/sku/{sku}
```

Example:
```http
GET /api/items/sku/SKU-001
```

#### Search Items

```http
GET /api/items/search?q={searchTerm}&page=1&limit=10
```

Searches across name, barcode, and SKU fields.

Example:
```http
GET /api/items/search?q=mouse&page=1&limit=10
```

#### Get Items by Category

```http
GET /api/items/category/{categoryId}?page=1&limit=10
```

#### Create Item

```http
POST /api/items
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "sku": "SKU-001",
  "barcode": "123456789012",
  "name": "Wireless Mouse",
  "description": "USB wireless mouse",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "supplierId": "550e8400-e29b-41d4-a716-446655440002",
  "price": 29.99
}
```

**Required Fields:**
- `sku` (string, 1-100 characters): Stock keeping unit (unique)
- `barcode` (string, 1-100 characters): Barcode (unique)
- `name` (string, 1-255 characters): Item name
- `categoryId` (UUID): Category ID
- `price` (number): Item price

**Optional Fields:**
- `description` (string, max 1000 characters): Item description
- `supplierId` (UUID): Supplier ID

**Response (201):** Item object

**Response (409):**
```json
{
  "error": "Item with this SKU already exists"
}
```

#### Update Item

```http
PUT /api/items/{itemId}
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "name": "Updated Wireless Mouse",
  "price": 34.99
}
```

#### Delete Item

```http
DELETE /api/items/{itemId}
Authorization: Bearer <admin_token>
```

### Stock Management

Manage multi-location stock levels and adjustments.

#### Get Stock Level for Item at Location

```http
GET /api/stock/item/{itemId}/location/{locationId}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "itemId": "550e8400-e29b-41d4-a716-446655440003",
  "locationId": "550e8400-e29b-41d4-a716-446655440001",
  "quantity": 150,
  "reorderLevel": 10,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Get All Stock for an Item

```http
GET /api/stock/item/{itemId}
```

Returns all stock levels for an item across all locations.

#### Get All Stock at a Location

```http
GET /api/stock/location/{locationId}?page=1&limit=10
```

#### Get Low Stock Items at Location

```http
GET /api/stock/location/{locationId}/low-stock
```

Returns items where quantity <= reorderLevel.

#### Create or Update Stock Level

```http
POST /api/stock
Authorization: Bearer <admin_or_manager_token>
Content-Type: application/json

{
  "itemId": "550e8400-e29b-41d4-a716-446655440003",
  "locationId": "550e8400-e29b-41d4-a716-446655440001",
  "quantity": 150,
  "reorderLevel": 10
}
```

**Required Fields:**
- `itemId` (UUID): Item ID
- `locationId` (UUID): Location ID
- `quantity` (integer): Stock quantity

**Optional Fields:**
- `reorderLevel` (integer, default: 10): Reorder point

**Response (201):** Stock level object

#### Adjust Stock

```http
POST /api/stock/adjust
Authorization: Bearer <any_authenticated_user>
Content-Type: application/json

{
  "itemId": "550e8400-e29b-41d4-a716-446655440003",
  "locationId": "550e8400-e29b-41d4-a716-446655440001",
  "adjustment": 5,
  "reason": "scanned_entry",
  "notes": "Received shipment"
}
```

**Required Fields:**
- `itemId` (UUID): Item ID
- `locationId` (UUID): Location ID
- `adjustment` (integer): Quantity change (positive or negative)
- `reason` (string): Adjustment reason
  - `scanned_entry`: Barcode scanning entry (viewer role allowed)
  - `manual_adjustment`: Manual count adjustment
  - `correction`: Inventory correction
  - `count_variance`: Physical count variance

**Optional Fields:**
- `notes` (string): Additional notes about adjustment

**Response (201):**
```json
{
  "stockLevel": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "itemId": "550e8400-e29b-41d4-a716-446655440003",
    "locationId": "550e8400-e29b-41d4-a716-446655440001",
    "quantity": 155,
    "reorderLevel": 10,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  },
  "adjustment": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "itemId": "550e8400-e29b-41d4-a716-446655440003",
    "locationId": "550e8400-e29b-41d4-a716-446655440001",
    "adjustment": 5,
    "reason": "scanned_entry",
    "notes": "Received shipment",
    "adjustedBy": "user-123",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

#### Get Adjustment History

```http
GET /api/stock/adjustments/{itemId}/{locationId}?page=1&limit=10
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "itemId": "550e8400-e29b-41d4-a716-446655440003",
      "locationId": "550e8400-e29b-41d4-a716-446655440001",
      "adjustment": 5,
      "reason": "scanned_entry",
      "notes": "Received shipment",
      "adjustedBy": "user-123",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate or constraint violation) |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": "Error message",
  "details": {
    "field1": "Field-specific error"
  }
}
```

## Pagination

All list endpoints support pagination with the following parameters:

- `page` (default: 1): Page number (1-indexed)
- `limit` (default: 10, max: 100): Items per page

Response includes:
- `data`: Array of items
- `total`: Total number of items
- `page`: Current page number
- `limit`: Items per page
- `totalPages`: Total number of pages

### Example

```http
GET /api/items?page=2&limit=20
```

## Role-Based Access Control

### Admin Role
- Read all resources
- Create all resources
- Update all resources
- Delete all resources

### Manager Role
- Read all resources
- Create resources (categories, locations, suppliers, items, stock)
- Update resources
- Cannot delete resources

### Viewer Role
- Read all resources
- Adjust stock (scanned_entry reason only)
- Cannot create, update, or delete resources

### Stock Adjustment Permissions

- **Admin**: All adjustment reasons
- **Manager**: All adjustment reasons
- **Viewer**: `scanned_entry` only (for barcode scanning)

## Data Validation

### SKU and Barcode
- Must be unique across all items
- Required fields when creating items
- Case-sensitive

### Prices
- Decimal format (10.2 precision)
- Must be non-negative

### Quantities
- Integer values
- Can be negative for stock adjustments

### Names
- 1-255 characters
- Whitespace trimmed
- Case-sensitive for uniqueness checks

## Referential Integrity

- **Item → Category**: Foreign key constraint, cannot delete category with items
- **Item → Supplier**: Optional reference, supplier deletion sets to NULL
- **Stock Level → Item/Location**: Cascade delete, deleting item/location removes stock
- **Adjustment → Item/Location**: Cascade delete, for audit trail

## Rate Limiting

Recommended rate limits:
- 1000 requests per minute per user
- Exponential backoff for 429 responses

## Caching

For improved performance:
- Cache category/location lists (1 hour TTL)
- Cache item details (30 minutes TTL)
- No caching for stock levels (real-time)
- No caching for adjustments (audit trail)
