# Stock Management API

A comprehensive stock management system with ACID-compliant transactions, audit logging, and low stock monitoring.

## Features

### ✅ Core Functionality
- **Stock Movements**: Receive, consume, and adjust stock with atomic operations
- **Inventory Management**: Track quantities by product and location
- **Product Management**: Create and manage products with SKU and barcode support
- **Location Management**: Multiple storage locations with full tracking
- **Audit Logging**: Complete audit trail for all inventory changes

### ✅ Advanced Features
- **Low Stock Monitoring**: Configurable thresholds with real-time alerts
- **Predictive Analytics**: Identify items approaching low stock
- **Stock Health Metrics**: Overall inventory health assessment
- **Consumption Analytics**: Top consuming products and slow-moving inventory
- **Barcode Support**: Product and movement-level barcode tracking
- **Reference Numbers**: Integration with purchase orders, work orders, etc.

### ✅ Technical Features
- **ACID Compliance**: All operations are atomic, consistent, isolated, and durable
- **Transactional Safety**: Database-level transactions with rollback capability
- **Concurrent Operations**: Row-level locking prevents data corruption
- **High Precision**: Decimal(15,3) precision for accurate quantity tracking
- **Comprehensive Testing**: Unit tests, integration tests, and ACID transaction tests

## Quick Start

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- npm

### Installation

1. **Install dependencies**
   ```bash
   cd api
   npm install
   ```

2. **Setup database**
   ```bash
   # Create .env file from example
   cp ../.env.example .env
   
   # Edit .env with your database credentials
   # DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   ```

3. **Run migrations**
   ```bash
   npm run migrate
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Run the demo**
   ```bash
   npm run demo
   ```

### Docker Setup

```bash
# Start PostgreSQL and API
docker-compose up -d postgres api

# Run migrations
docker-compose exec api npm run migrate

# Run demo
docker-compose exec api npm run demo
```

## API Endpoints

### Stock Movements
```http
POST /api/stock/receive    # Receive stock
POST /api/stock/consume    # Consume stock  
POST /api/stock/adjust     # Adjust stock
GET  /api/stock/history    # Movement history
```

### Inventory
```http
GET /api/stock/inventory   # Get inventory levels
```

### Products & Locations
```http
POST /api/stock/products   # Create product
GET  /api/stock/products   # List products
POST /api/stock/locations  # Create location
GET  /api/stock/locations  # List locations
```

### Low Stock Management
```http
GET  /api/stock/low-stock                    # Low stock alerts
PUT  /api/stock/low-stock/threshold          # Update threshold
GET  /api/stock/low-stock/notifications      # Generate notifications
GET  /api/stock/low-stock/approaching        # Items approaching low stock
GET  /api/stock/low-stock/health             # Health metrics
GET  /api/stock/low-stock/top-consumers      # Top consuming products
GET  /api/stock/low-stock/slow-moving        # Slow moving inventory
```

### Audit
```http
GET /api/stock/audit         # Audit log
```

## Example Usage

### Receive Stock
```bash
curl -X POST http://localhost:3001/api/stock/receive \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user123" \
  -H "X-User-Name: John Doe" \
  -d '{
    "productId": "product-uuid",
    "locationId": "location-uuid", 
    "quantity": 100,
    "reason": "Purchase order receipt",
    "referenceNumber": "PO-001",
    "barcode": "1234567890123"
  }'
```

### Get Low Stock Alerts
```bash
curl http://localhost:3001/api/stock/low-stock/notifications
```

Response:
```json
{
  "success": true,
  "notifications": [
    {
      "type": "LOW_STOCK_CRITICAL",
      "priority": "HIGH",
      "productId": "uuid",
      "productName": "Business Laptop",
      "locationName": "Main Warehouse", 
      "currentQuantity": 5.0,
      "threshold": 10.0,
      "shortageAmount": 5.0,
      "message": "Critical: Business Laptop at Main Warehouse is below low stock threshold",
      "recommendedAction": "Reorder immediately"
    }
  ],
  "summary": {
    "critical": 1,
    "warning": 3,
    "total": 4
  }
}
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Basic functionality tests
npm test stock.test.js

# ACID transaction tests  
npm test acid.test.js

# Low stock service tests
npm test lowStock.test.js
```

### Watch Mode
```bash
npm run test:watch
```

## Database Schema

The system uses the following main tables:

- **products**: Product master data
- **locations**: Storage locations
- **inventory**: Current stock levels by product/location
- **stock_movements**: Complete transaction history
- **audit_log**: Audit trail for all changes

See `migrations/` directory for complete schema definitions.

## ACID Compliance

All stock operations are ACID-compliant:

- **Atomicity**: Operations either complete fully or not at all
- **Consistency**: Database constraints ensure data integrity
- **Isolation**: Row-level locks prevent concurrent conflicts
- **Durability**: Transactions are persisted before acknowledgment

### Transaction Example
```sql
BEGIN;
-- Lock inventory row
SELECT * FROM inventory WHERE product_id = $1 AND location_id = $2 FOR UPDATE;

-- Update quantity
UPDATE inventory SET quantity = quantity + $3 WHERE id = $4;

-- Create movement record
INSERT INTO stock_movements (...) VALUES (...);

-- Create audit log entry  
INSERT INTO audit_log (...) VALUES (...);

COMMIT;
```

## Low Stock Service

The low stock service provides intelligent monitoring:

### Notification Types
- **CRITICAL**: Currently below threshold
- **WARNING**: Projected to reach low stock within timeframe

### Health Metrics
- Overall inventory health score
- Low stock percentage
- Movement analytics
- Consumption patterns

### Predictive Analytics
- Average daily consumption calculation
- Days until low stock prediction
- Slow-moving inventory identification

## Configuration

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db
PORT=3001
NODE_ENV=development
```

### Database Configuration
- Connection pooling (max 20 connections)
- Connection timeout: 2 seconds
- Idle timeout: 30 seconds

## Performance

### Indexes
- Primary keys on all tables
- Composite indexes on product/location combinations
- Timestamp indexes for history queries
- Audit log indexes for efficient searching

### Query Optimization
- Prepared statements for all queries
- Connection pooling for high concurrency
- Efficient pagination with limit/offset

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Metrics Available
- Request/response times
- Database query performance
- Connection pool status
- Error rates

## Security

### Input Validation
- All inputs validated at service layer
- SQL injection prevention with parameterized queries
- Type checking for all parameters

### Audit Trail
- Complete before/after values for all changes
- User attribution with IP address and user agent
- Timestamped entries with ISO 8601 format

## Integration

### Barcode Support
- Product-level master barcodes
- Movement-level batch/barcode tracking
- Flexible barcode formats (UPC, EAN, custom)

### Reference Numbers
- Purchase order integration
- Work order tracking
- Adjustment document references

### Metadata
- JSON metadata field for custom data
- Supplier information
- Batch numbers
- Expiration dates

## Deployment

### Production Considerations
- Use PostgreSQL connection pooling
- Configure appropriate timeout values
- Monitor database connection usage
- Regular backup of audit logs

### Scaling
- Horizontal scaling with read replicas
- Database partitioning for large datasets
- Caching for frequently accessed data

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL is running
   - Confirm network connectivity

2. **Migration Failures**
   - Check database permissions
   - Verify PostgreSQL version compatibility
   - Review migration SQL for syntax errors

3. **Test Failures**
   - Ensure test database exists
   - Run migrations before tests
   - Check for port conflicts

### Logs
- Application logs: Console output
- Database logs: PostgreSQL logs
- Test logs: Jest output

## Contributing

1. Fork the repository
2. Create feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details.