# Inventory API

A comprehensive REST API for managing inventory items, categories, and stock levels across multiple locations with role-based access control.

## Features

- **Item Management**: Create, read, update, delete inventory items
- **Category Management**: Organize items into hierarchical categories
- **Multi-Location Stock**: Track stock levels across different warehouse locations
- **Stock Movements**: Complete audit trail of all stock adjustments
- **Role-Based Access Control**: Different permission levels (admin, manager, operator, viewer)
- **Pagination & Filtering**: Efficient data retrieval with search and filters
- **Data Validation**: Input validation and referential integrity enforcement
- **JWT Authentication**: Secure token-based authentication
- **Comprehensive Testing**: Unit tests, service layer tests, and integration tests

## Quick Start

### Installation

```bash
npm install
```

### Database Setup

1. Ensure PostgreSQL is running
2. Create database:
```bash
createdb appdb
```

3. Run migrations:
```bash
npm run migrate
```

### Development

```bash
npm run dev
```

Server starts at `http://localhost:3001`

### Testing

```bash
npm test
```

## API Endpoints

### Categories
- `POST /api/categories` - Create category (admin, manager)
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category
- `PUT /api/categories/:id` - Update category (admin, manager)
- `DELETE /api/categories/:id` - Delete category (admin)

### Items
- `POST /api/items` - Create item (admin, manager)
- `GET /api/items` - List items with pagination/filtering
- `GET /api/items/search/:query` - Search items
- `GET /api/items/sku/:sku` - Get item by SKU
- `GET /api/items/barcode/:barcode` - Get item by barcode
- `GET /api/items/:id` - Get item
- `PUT /api/items/:id` - Update item (admin, manager)
- `DELETE /api/items/:id` - Delete item (admin)

### Stock
- `GET /api/stock/item/:itemId` - Get stock by item
- `GET /api/stock/item/:itemId/total` - Get total stock for item
- `GET /api/stock/location/:locationId` - Get stock by location
- `GET /api/stock/location/:locationId/summary` - Get location summary
- `GET /api/stock/:itemId/:locationId` - Get stock level
- `POST /api/stock/:itemId/:locationId/adjust` - Adjust stock (operator, manager, admin)
- `POST /api/stock/:itemId/:locationId/init` - Initialize stock (manager, admin)
- `GET /api/stock/:itemId/:locationId/history` - Get movement history

## Authentication

All endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Role-Based Access

- **admin**: Full access to all operations
- **manager**: Can create/update items, categories, and manage stock
- **operator**: Can adjust stock and view items
- **viewer**: Read-only access

## Pagination & Filtering

### Pagination
```
GET /api/items?page=1&limit=20
```

Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Filtering

**Search across multiple fields:**
```
GET /api/items?search=widget
```

**Filter by category:**
```
GET /api/items?category_id=1
```

**Filter by supplier:**
```
GET /api/items?supplier_id=1
```

**Filter by location:**
```
GET /api/items?location_id=1
```

**Show only low stock:**
```
GET /api/stock/location/1?below_reorder=true
```

## Data Validation

The API validates all input data:

- **SKU**: Required, unique, string
- **Item Name**: Required, non-empty string
- **Category ID**: Required, must reference existing category
- **Quantity**: Non-negative integer
- **Movement Type**: Must be one of: receipt, issue, adjustment, count, return

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No content
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (e.g., duplicate SKU)
- `500` - Server error

Error response format:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Database Schema

### Users
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

### Categories
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

### Items
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

### Stock Levels
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

### Stock Movements
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

## Development

### Project Structure

```
api/
├── src/
│   ├── routes/          # Express route handlers
│   ├── services/        # Business logic layer
│   ├── middleware/      # Auth, validation, etc.
│   ├── db/             # Database connection
│   └── test/           # Test utilities
├── migrations/          # Database migrations
├── scripts/            # Utility scripts
├── server.js           # Express app setup
├── server.test.js      # API tests
├── INVENTORY_API.md    # API documentation
└── inventory-api.postman_collection.json
```

### Key Files

- **server.js** - Express app setup and route mounting
- **src/middleware/auth.js** - JWT authentication and authorization
- **src/middleware/validation.js** - Input validation middleware
- **src/services/** - Business logic for items, categories, and stock
- **src/routes/** - API endpoint definitions
- **migrations/** - SQL migration files

### Adding New Features

1. Create a migration if schema changes are needed
2. Create service class in `src/services/`
3. Write service unit tests
4. Create routes in `src/routes/`
5. Write integration tests
6. Update API documentation

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test
```bash
npm test -- src/routes/__tests__/items.integration.test.js
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage
```bash
npm test -- --coverage
```

### Test Files
- `src/services/__tests__/` - Service layer unit tests
- `src/routes/__tests__/` - Integration tests with auth scenarios
- `src/test/` - Test utilities (auth helpers, db helpers)

## Postman Collection

Import the included `inventory-api.postman_collection.json` into Postman for easy API testing.

**Setup:**
1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `inventory-api.postman_collection.json`
4. In collection variables, set:
   - `base_url` - http://localhost:3001
   - `token` - Your JWT token

## Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/appdb

# API
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production
```

## Migration Management

### Run Migrations
```bash
npm run migrate
```

### Create New Migration
1. Create SQL file in `migrations/` directory
2. Use naming convention: `NNN_description.sql`
3. Run `npm run migrate` to execute

## Production Considerations

1. **Database**: Use managed PostgreSQL service (RDS, Cloud SQL, etc.)
2. **Authentication**: Implement proper JWT token generation and refresh logic
3. **Security**: Use HTTPS, enable CORS properly, validate all inputs
4. **Monitoring**: Add logging and error tracking (Sentry, DataDog, etc.)
5. **Performance**: Add caching, optimize queries, use connection pooling
6. **Backup**: Regular database backups
7. **Rate Limiting**: Implement rate limiting to prevent abuse
8. **API Versioning**: Consider API versioning for breaking changes

## Support & Documentation

- **Full API Documentation**: See `INVENTORY_API.md`
- **Postman Collection**: Use `inventory-api.postman_collection.json`
- **Database Schema**: See README section above
- **Error Codes**: See `INVENTORY_API.md` Error Responses section

## License

MIT
