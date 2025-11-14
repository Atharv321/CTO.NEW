# Inventory Management API - Implementation Guide

This guide explains the complete implementation of the Inventory Management API with multi-location stock tracking, role-based access control, and comprehensive testing.

## Project Structure

```
apps/api/src/
├── index.ts                      # Main application entry point
├── db.ts                         # Database connection and queries
├── schema.ts                     # Database schema initialization
├── middleware/
│   ├── auth.ts                   # Authentication and authorization
│   └── validation.ts             # Request validation middleware
├── services/
│   ├── categoryService.ts        # Category business logic
│   ├── categoryService.test.ts   # Category service tests
│   ├── locationService.ts        # Location business logic
│   ├── supplierService.ts        # Supplier business logic
│   ├── itemService.ts            # Inventory items business logic
│   ├── itemService.test.ts       # Item service tests
│   ├── stockService.ts           # Stock management business logic
│   └── stockService.test.ts      # Stock service tests
└── routes/
    ├── categories.ts             # Category endpoints
    ├── locations.ts              # Location endpoints
    ├── suppliers.ts              # Supplier endpoints
    ├── items.ts                  # Item endpoints
    ├── stock.ts                  # Stock management endpoints
    └── integration.test.ts       # Integration tests
```

## Key Features Implemented

### 1. Multi-Module CRUD Operations

#### Categories
- Create, read, update, delete categories
- Search items by category
- Prevent deletion of categories with associated items

#### Locations (Warehouses)
- Manage multiple warehouse locations
- Track stock by location
- Location-specific low stock alerts

#### Suppliers
- Store supplier information with contact details
- Optional supplier reference on items
- Supplier tracking for sourcing

#### Inventory Items
- Full SKU and barcode management
- Item search across name, SKU, and barcode
- Price tracking
- Category and supplier associations
- Item-level and location-specific tracking

#### Stock Management
- Multi-location stock level tracking
- Stock adjustments with audit trail
- Reorder level management
- Low stock detection
- Adjustment history

### 2. Location Scoping

All stock operations are location-aware:
- Stock levels tracked per item per location
- Adjustments recorded with location context
- Low stock alerts per location
- Adjustment history tied to specific locations

### 3. Pagination and Filtering

All list endpoints support:
- **Pagination**: `page` and `limit` parameters
- **Filtering**: Search by name, SKU, barcode, or category
- **Sorting**: Ordered by creation date (newest first)
- **Limits**: Max 100 items per page, default 10

Response format includes pagination metadata:
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### 4. Role-Based Permissions

Three roles with different permission levels:

| Permission | Admin | Manager | Viewer |
|-----------|-------|---------|--------|
| Read All | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ❌ |
| Update | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| Scan Adjustment | ✅ | ✅ | ✅* |
| Manual Adjustment | ✅ | ✅ | ❌ |

*Viewer can only create `scanned_entry` adjustments

### 5. Data Validation

Comprehensive validation on all inputs:
- **Type checking**: String, number, UUID, email
- **Length validation**: Min/max lengths for strings
- **Pattern matching**: Email format, UUID format
- **Business rules**: Duplicate SKU/barcode prevention
- **Referential integrity**: Category/supplier existence

### 6. Referential Integrity

Database constraints ensure data consistency:
- **Items → Categories**: Can't delete category with items
- **Items → Suppliers**: Optional, deletion sets to NULL
- **Stock → Items/Locations**: Cascade delete
- **Adjustments → Items/Locations**: Cascade delete

### 7. Service-Layer Tests

Comprehensive test coverage using Vitest:

**CategoryService Tests:**
- Create category with/without description
- Get all categories (paginated)
- Get category by ID
- Update category
- Delete category
- Get category by name
- Duplicate prevention

**ItemService Tests:**
- Create item with all fields
- Get paginated items
- Get item by barcode
- Get item by SKU
- Search items
- Get items by category
- Update item
- Delete item

**StockService Tests:**
- Get stock level for item/location
- Get all stock for item
- Get stock at location
- Create/update stock level
- Adjust stock and create adjustment record
- Get adjustment history
- Get low stock items

### 8. Integration Tests

Test scenarios covering:
- **Authentication**: Valid/invalid tokens, missing headers
- **Authorization**: Role-based access control
- **Happy Paths**: CRUD operations with valid data
- **Error Handling**: 400, 401, 403, 404, 409, 500 responses
- **Pagination**: Page/limit calculation
- **Validation**: Data validation errors
- **Referential Integrity**: Foreign key constraints
- **Duplicates**: Unique constraints for SKU/barcode/name

### 9. API Documentation

Complete API documentation in `INVENTORY_API.md` includes:
- All endpoint descriptions
- Request/response examples
- Query parameters
- Error codes
- Role-based access examples
- Pagination explanation
- Rate limiting guidance

### 10. Postman Collection

`Inventory-API.postman_collection.json` provides:
- Pre-configured endpoints for all operations
- Example requests with sample data
- Variable placeholders ({{categoryId}}, {{itemId}}, etc.)
- Authorization header setup
- Both successful and error scenarios

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or pnpm

### Installation

```bash
cd apps/api
npm install
```

### Environment Setup

Create `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
API_PORT=3000
NODE_ENV=development
```

### Running the API

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm run start
```

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test categoryService.test.ts

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## Authentication

The API uses Bearer token authentication. Include in all requests:

```bash
Authorization: Bearer <token>
```

### Mock Implementation

For development, tokens are validated as follows:
- `admin-token` → Admin role
- `manager-token` → Manager role
- `viewer-token` → Viewer role
- `invalid` → Rejected
- Any other token → Accepted with default role

### Production Implementation

Replace mock authentication in `middleware/auth.ts` with:
- JWT verification
- Session validation
- OAuth integration
- API key validation

## Database Schema

### Tables

1. **categories**
   - `id` (UUID, PK)
   - `name` (VARCHAR 255, UNIQUE)
   - `description` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)

2. **locations**
   - `id` (UUID, PK)
   - `name` (VARCHAR 255, UNIQUE)
   - `description` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)

3. **suppliers**
   - `id` (UUID, PK)
   - `name` (VARCHAR 255, UNIQUE)
   - `contact_email` (VARCHAR 255)
   - `phone` (VARCHAR 20)
   - `created_at`, `updated_at` (TIMESTAMP)

4. **inventory_items**
   - `id` (UUID, PK)
   - `sku` (VARCHAR 100, UNIQUE)
   - `barcode` (VARCHAR 100, UNIQUE)
   - `name` (VARCHAR 255)
   - `description` (TEXT)
   - `category_id` (UUID, FK → categories)
   - `supplier_id` (UUID, FK → suppliers, nullable)
   - `price` (DECIMAL 10,2)
   - `created_at`, `updated_at` (TIMESTAMP)

5. **stock_levels**
   - `id` (UUID, PK)
   - `item_id` (UUID, FK → inventory_items)
   - `location_id` (UUID, FK → locations)
   - `quantity` (INTEGER)
   - `reorder_level` (INTEGER)
   - `created_at`, `updated_at` (TIMESTAMP)
   - UNIQUE(item_id, location_id)

6. **inventory_adjustments**
   - `id` (UUID, PK)
   - `item_id` (UUID, FK → inventory_items)
   - `location_id` (UUID, FK → locations)
   - `adjustment` (INTEGER)
   - `reason` (VARCHAR 50, CHECK)
   - `notes` (TEXT)
   - `adjusted_by` (VARCHAR 255)
   - `created_at` (TIMESTAMP)

### Indexes

- `inventory_items.category_id`
- `inventory_items.supplier_id`
- `stock_levels.item_id`
- `stock_levels.location_id`
- `inventory_adjustments.item_id`
- `inventory_adjustments.location_id`

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message",
  "details": {
    "field": "Field-specific error message"
  }
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication failed)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicates, constraints)
- `500`: Internal Server Error

## API Examples

### Create Category

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices"
  }'
```

### Create Item

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SKU-001",
    "barcode": "123456789",
    "name": "Wireless Mouse",
    "categoryId": "cat-uuid",
    "supplierId": "sup-uuid",
    "price": 29.99
  }'
```

### Lookup Item by Barcode

```bash
curl http://localhost:3000/api/items/barcode/123456789 \
  -H "Authorization: Bearer viewer-token"
```

### Adjust Stock (Barcode Scan)

```bash
curl -X POST http://localhost:3000/api/stock/adjust \
  -H "Authorization: Bearer viewer-token" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item-uuid",
    "locationId": "loc-uuid",
    "adjustment": 1,
    "reason": "scanned_entry",
    "notes": "Incoming shipment scanned"
  }'
```

### Get Low Stock Items

```bash
curl http://localhost:3000/api/stock/location/loc-uuid/low-stock \
  -H "Authorization: Bearer manager-token"
```

## Performance Considerations

1. **Pagination**: Large datasets automatically paginated (max 100 items)
2. **Indexes**: Added on all foreign keys and frequently queried columns
3. **Connection Pooling**: PostgreSQL connection pool for efficient DB access
4. **Query Optimization**: Parameterized queries prevent SQL injection
5. **Caching**: Consider caching category/location lists (1hr TTL)

## Security Features

1. **Authentication**: Bearer token validation
2. **Authorization**: Role-based access control
3. **Input Validation**: Type and format checking
4. **SQL Injection Prevention**: Parameterized queries
5. **CORS**: Enable as needed for frontend integration
6. **HTTPS**: Required in production
7. **Rate Limiting**: Implement at API Gateway level

## Future Enhancements

1. **Batch Operations**: Bulk create/update endpoints
2. **Export/Import**: CSV import for items and stock
3. **Webhooks**: Real-time notifications for low stock
4. **Analytics**: Sales trends, stock turnover analysis
5. **Barcode Generation**: Generate barcodes for new items
6. **Mobile App**: React Native mobile interface
7. **Offline Mode**: Sync when connectivity restored
8. **Advanced Reporting**: Custom report builder
9. **Multi-tenant**: Support multiple companies
10. **Audit Logging**: Detailed action audit trail

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` environment variable
- Verify PostgreSQL is running
- Check credentials and database exists
- Review PostgreSQL logs

### Permission Denied on Operations
- Check authorization header token
- Verify user role has required permissions
- Check endpoint requires specific role

### Validation Errors
- Review error `details` field for specific field errors
- Check data types match requirements
- Verify required fields are provided
- Validate string lengths and formats

### Duplicate Key Errors
- SKU and barcode must be unique
- Category and location names must be unique
- Supplier names must be unique
- Check for existing items with same SKU/barcode

## Support and Documentation

- **API Documentation**: `INVENTORY_API.md`
- **Postman Collection**: `Inventory-API.postman_collection.json`
- **Test Files**: `src/services/*.test.ts` and `src/routes/integration.test.ts`
- **Source Code**: Well-commented service and route files
