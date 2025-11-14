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

- Node.js 16+
- PostgreSQL database
- Environment variables configured (see `.env.example`)

### Installation

```bash
cd api
npm install
```

### Database Setup

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
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3001
NODE_ENV=development
```

## Architecture

### Directory Structure

```
api/
├── src/
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
2. Follow existing code patterns
3. Update documentation
4. Ensure all tests pass
5. Check code style with ESLint

## License

See main repository LICENSE file.
