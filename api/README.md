# Barber Booking API

A comprehensive REST and GraphQL API for barber shop booking management with built-in validation, rate limiting, and transactional booking creation.

## Features

- **REST & GraphQL APIs**: Full CRUD operations for services, barbers, customers, and bookings
- **Smart Booking Logic**: Prevents double bookings with transactional creation
- **Availability Management**: Flexible scheduling with time slot generation
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Multi-tier rate limiting for different endpoint types
- **Database Transactions**: ACID compliance with Prisma ORM
- **Comprehensive Testing**: Unit and integration test coverage
- **API Documentation**: Detailed REST and GraphQL documentation

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm

### Installation

1. Clone and install dependencies:
# Barbershop Admin API

Backend API service for managing a barbershop booking system with admin authentication.

## Features

- **Authentication**: JWT-based authentication with password login and magic link support
- **Services Management**: Full CRUD operations for barbershop services
- **Barbers Management**: Manage barber profiles and information
- **Availability Management**: 
  - Recurring weekly availability templates
  - Specific date overrides for holidays/special hours
- **Bookings Management**: 
  - List and filter bookings with pagination
  - Update booking statuses
  - View booking statistics
- **Validation**: Comprehensive request validation using Joi
- **Database**: PostgreSQL with migration system
- **Testing**: Full integration test suite

## Tech Stack

- Node.js + Express
- PostgreSQL
- JWT for authentication
- Joi for validation
- Jest + Supertest for testing
- bcrypt for password hashing
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
# API Service

Express-based API service for inventory management, supplier management, and purchase orders.

## Features

- **Health Check**: Basic health endpoint
- **Supplier Management**: Full CRUD for suppliers with contact details and lead times
- **Purchase Orders**: Draft, submit, and receive orders with stock integration
- **Export**: CSV export for purchase orders (PDF placeholder)
- **Database Migrations**: Automated schema management

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm or yarn
- Node.js 16+
- PostgreSQL database
- Environment variables configured (see `.env.example`)

### Installation

```bash
cd api
npm install
```

2. Set up environment variables:
```bash
cp ../.env.example .env
# Edit .env with your database configuration
```

3. Set up the database:
```bash
npm run db:migrate
npm run db:seed  # Optional: seed with sample data
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at:
- REST API: http://localhost:3001/api
- GraphQL: http://localhost:3001/graphql
- Health Check: http://localhost:3001/health

## API Endpoints

### REST API
- `GET /api/services` - List all services
- `POST /api/services` - Create new service
- `GET /api/barbers` - List barbers
- `GET /api/customers` - List customers
- `GET /api/bookings` - List bookings with filters
- `POST /api/bookings` - Create booking
- `GET /api/bookings/available-slots` - Get available time slots

### GraphQL
Full GraphQL API with queries and mutations for all entities. Visit `/graphql` for the interactive playground.

## Key Features

### Booking Logic
- **Slot Availability**: Real-time availability checking
- **Double Booking Prevention**: Database constraints and application logic
- **Time Slot Generation**: Automatic 30-minute slot generation based on availability
- **Transactional Creation**: Atomic booking creation with rollback on failure

### Rate Limiting
- **General API**: 100 requests/15 minutes
- **Booking Operations**: 10 requests/15 minutes
- **Customer Operations**: 50 requests/15 minutes
- **Account Creation**: 5 requests/hour

### Validation
- Input sanitization and validation
- UUID format validation
- Date/time validation
- Business logic validation (availability, overlapping bookings)

## Testing

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch
```

Test suites include:
- Booking service logic
- REST API endpoints
- GraphQL queries and mutations
- Rate limiting functionality
- Error handling scenarios

## Database Schema

The API uses Prisma ORM with PostgreSQL. Key models:
- **Service**: Haircut/grooming services with pricing
- **Barber**: Staff members with availability schedules
- **Customer**: Client information
- **Booking**: Appointments with status tracking
- **Availability**: Weekly working hours per barber

## Scripts

- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Security

- SQL injection prevention via Prisma ORM
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration
- Error message sanitization

## Documentation

See `docs/README.md` for comprehensive API documentation including:
- Complete endpoint reference
- Request/response examples
- Error handling
- GraphQL schema
- Authentication guidelines
### Environment Variables

Create a `.env` file in the api directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/barbershop

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development
```

### Database Setup

Run migrations and seed the database:

```bash
npm run seed
```

This will:
- Create all necessary database tables
- Create an admin user (email: admin@barbershop.com, password: admin123)
- Create sample barbers and services
- Set up availability templates

### Development

Start the development server:

```bash
npm run dev
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
```bash
# Run migrations
npm run migrate

# Seed sample data (optional)
npm run seed
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3001`

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

## API Documentation

See [Admin API Documentation](../docs/admin-api.md) for detailed endpoint documentation.

### Quick Start Example

1. **Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barbershop.com",
    "password": "admin123"
  }'
```

2. **Use the token for authenticated requests:**
```bash
curl http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
api/
├── src/
│   ├── db/
│   │   ├── index.js          # Database connection
│   │   └── migrations.js     # Database migrations
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── services.js       # Services CRUD
│   │   ├── barbers.js        # Barbers CRUD
│   │   ├── availability.js   # Availability management
│   │   └── bookings.js       # Bookings management
│   └── validators/
│       └── index.js          # Validation schemas
├── scripts/
│   ├── migrate.js            # Migration runner
│   └── seed.js               # Database seeding
├── tests/
│   ├── setup.js              # Test utilities
│   ├── auth.test.js          # Auth tests
│   ├── services.test.js      # Services tests
│   ├── availability.test.js  # Availability tests
│   └── bookings.test.js      # Bookings tests
├── server.js                 # Main application entry point
└── package.json
```

## Database Schema

### Tables

- **admins**: Admin users for authentication
- **barbers**: Barber profiles
- **services**: Available services (haircut, beard trim, etc.)
- **availability_templates**: Recurring weekly availability schedules
- **availability_overrides**: Specific date availability overrides
- **bookings**: Customer bookings
- **magic_links**: Passwordless authentication tokens
- **migrations**: Migration tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/magic-link` - Request magic link
- `POST /api/auth/verify-magic-link` - Verify magic link

### Services (Admin)
- `GET /api/admin/services` - List all services
- `GET /api/admin/services/:id` - Get service by ID
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service

### Barbers (Admin)
- `GET /api/admin/barbers` - List all barbers
- `GET /api/admin/barbers/:id` - Get barber by ID
- `POST /api/admin/barbers` - Create barber
- `PUT /api/admin/barbers/:id` - Update barber
- `DELETE /api/admin/barbers/:id` - Delete barber

### Availability (Admin)
- `GET /api/admin/availability/templates` - List templates
- `GET /api/admin/availability/templates/barber/:barberId` - Get barber templates
- `POST /api/admin/availability/templates` - Create template
- `PUT /api/admin/availability/templates/:id` - Update template
- `DELETE /api/admin/availability/templates/:id` - Delete template
- `GET /api/admin/availability/overrides` - List overrides
- `GET /api/admin/availability/overrides/barber/:barberId` - Get barber overrides
- `POST /api/admin/availability/overrides` - Create override
- `PUT /api/admin/availability/overrides/:id` - Update override
- `DELETE /api/admin/availability/overrides/:id` - Delete override

### Bookings (Admin)
- `GET /api/admin/bookings` - List bookings (with filtering & pagination)
- `GET /api/admin/bookings/:id` - Get booking by ID
- `PATCH /api/admin/bookings/:id/status` - Update booking status
- `GET /api/admin/bookings/stats/summary` - Get booking statistics

## Validation

All endpoints use Joi schemas for validation. Invalid requests return:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

## Error Handling

Standard HTTP status codes are used:
- `200` - Success
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `404` - Not found
- `409` - Conflict
- `500` - Internal server error

## Security

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens for authentication
- Magic links expire after 15 minutes
- Input validation on all endpoints
- SQL injection protection via parameterized queries

## Production Deployment

1. Set strong `JWT_SECRET` environment variable
2. Use HTTPS
3. Set `NODE_ENV=production`
4. Use a managed PostgreSQL service
5. Enable rate limiting (not included, consider adding)
6. Set up monitoring and logging
7. Regular security updates
## API Endpoints

### Health Check

```
GET /health
```

Returns `{ "status": "OK" }` when the server is running.

### Suppliers

- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers` - List suppliers (with pagination, filtering, search)
- `GET /api/suppliers/:id` - Get supplier details with preferred items and locations
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Soft delete supplier
- `DELETE /api/suppliers/:id?hard=true` - Hard delete supplier
- `POST /api/suppliers/:id/items` - Add preferred item
- `DELETE /api/suppliers/:id/items/:itemId` - Remove preferred item
- `POST /api/suppliers/:id/locations` - Link location
- `DELETE /api/suppliers/:id/locations/:locationId` - Unlink location

### Purchase Orders

- `POST /api/purchase-orders` - Create draft PO
- `GET /api/purchase-orders` - List POs (with pagination and filtering)
- `GET /api/purchase-orders/:id` - Get PO details
- `PUT /api/purchase-orders/:id` - Update draft PO
- `POST /api/purchase-orders/:id/submit` - Submit PO to supplier
- `POST /api/purchase-orders/:id/receive` - Receive items and update stock
- `POST /api/purchase-orders/:id/cancel` - Cancel PO
- `GET /api/purchase-orders/:id/export?format=csv` - Export PO summary
- `DELETE /api/purchase-orders/:id` - Delete draft PO

For detailed API documentation and workflow examples, see [Purchase Orders Documentation](../docs/PURCHASE_ORDERS.md).

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test tests/suppliers.test.js
npm test tests/purchaseOrders.test.js

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Database Migrations

Migrations are stored in `src/db/migrations/` and are automatically run in order.

The migration system:
- Tracks executed migrations in `schema_migrations` table
- Skips already-executed migrations
- Runs new migrations in alphanumeric order

To create a new migration:

1. Create a new `.sql` file in `src/db/migrations/`
2. Name it with a number prefix (e.g., `002_add_new_table.sql`)
3. Run `npm run migrate`

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/barber_booking
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3001
NODE_ENV=development
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Run tests before committing

## License

MIT License
## Architecture

### Directory Structure

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
│   ├── db/
│   │   ├── connection.js         # PostgreSQL connection pool
│   │   ├── migrations/           # SQL migration files
│   │   └── queries/              # Database query modules
│   │       ├── suppliers.js      # Supplier queries
│   │       └── purchaseOrders.js # PO queries
│   └── routes/                   # Express route handlers
│       ├── suppliers.js          # Supplier endpoints
│       └── purchaseOrders.js     # PO endpoints
├── scripts/
│   ├── migrate.js                # Migration runner
│   └── seed.js                   # Sample data seeder
├── tests/                        # Integration tests
│   ├── suppliers.test.js
│   └── purchaseOrders.test.js
├── server.js                     # Express app setup
└── package.json
```

### Database Schema

Key tables:
- `suppliers` - Supplier information and contact details
- `locations` - Warehouse/store locations
- `items` - Inventory items
- `supplier_preferred_items` - Items offered by suppliers with pricing
- `supplier_locations` - Supplier-location relationships
- `purchase_orders` - Purchase order headers
- `purchase_order_items` - PO line items

See migration files in `src/db/migrations/` for complete schema.

## Business Logic

### Purchase Order Workflow

1. **Draft**: Create and edit PO
2. **Submit**: Lock PO and send to supplier
3. **Receive**: Accept delivery and update inventory
4. **Status**: Tracks order lifecycle

### Stock Integration

When items are received via PO, the system:
- Updates `received_quantity` in PO items
- Increments `quantity` in items table
- Changes PO status to 'received' when complete

### Validation Rules

- Draft POs can be edited/deleted
- Submitted POs cannot be modified
- Items must exist before ordering
- Status transitions follow: draft → submitted → received
- Partial receiving is supported

## Development

### Adding New Endpoints

1. Create query functions in `src/db/queries/`
2. Create route handlers in `src/routes/`
3. Register routes in `server.js`
4. Add integration tests in `tests/`

### Code Style

- Use async/await for database operations
- Handle errors with try/catch
- Return appropriate HTTP status codes
- Validate input data
- Use transactions for multi-step operations

## Troubleshooting

### Database Connection Issues

```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Migration Failures

```bash
# Check migration status
psql $DATABASE_URL -c "SELECT * FROM schema_migrations"

# Manually run migration
psql $DATABASE_URL -f src/db/migrations/001_init_suppliers.sql
```

### Test Failures

```bash
# Clean test data
psql $DATABASE_URL -c "DELETE FROM purchase_orders WHERE po_number LIKE 'PO-%'"

# Run tests with verbose output
npm test -- --verbose
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use secure `DATABASE_URL`
3. Run migrations: `npm run migrate`
4. Start server: `npm start`
5. Monitor logs for errors
6. Use process manager (PM2, systemd, etc.)

## Contributing

1. Write tests for new features
2. Follow existing code style
3. Update documentation
4. Ensure all tests pass

## License

MIT
2. Follow existing code patterns
3. Update documentation
4. Ensure all tests pass
5. Check code style with ESLint

## License

See main repository LICENSE file.
