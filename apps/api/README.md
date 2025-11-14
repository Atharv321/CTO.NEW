# Restaurant Inventory Analytics API

A comprehensive analytics backend for restaurant inventory management, providing reporting services for inventory valuation, turnover, wastage, and location performance.

## Features

### Core Analytics
- **Inventory Valuation**: Real-time inventory value calculation with category breakdowns
- **Inventory Turnover**: Track inventory movement and days of supply
- **Wastage Reporting**: Monitor waste with detailed item-level analysis
- **Location Performance**: Comprehensive KPI dashboard for multi-location analysis

### Advanced Features
- **Caching Strategy**: Redis-based caching with configurable TTL
- **Scheduled Jobs**: Automated daily/weekly/monthly snapshot generation
- **Chart-Friendly APIs**: Optimized data structures for frontend visualization
- **Role-Based Access Control**: Granular permissions for different user roles

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/users` - List all users (admin/manager)
- `PATCH /api/auth/users/:id/role` - Update user role (admin only)

#### Analytics
- `GET /api/analytics/valuation` - Inventory valuation data
- `GET /api/analytics/turnover` - Inventory turnover metrics
- `GET /api/analytics/wastage` - Wastage reports
- `GET /api/analytics/performance` - Location performance KPIs

#### Chart Data
- `GET /api/analytics/charts/valuation` - Valuation chart data
- `GET /api/analytics/charts/turnover` - Turnover chart data
- `GET /api/analytics/charts/wastage` - Wastage chart data
- `GET /api/analytics/charts/performance` - Performance chart data

#### Cache Management
- `POST /api/analytics/cache/clear` - Clear analytics cache

#### Scheduler (Admin Only)
- `GET /api/scheduler/tasks` - List active scheduled tasks
- `POST /api/scheduler/trigger/:type` - Manual snapshot trigger

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis credentials
   ```

3. **Run database migrations**
   ```bash
   npm run migrate
   ```

4. **Seed database with test data**
   ```bash
   node --loader tsx/cjs src/database/seed.ts
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Usage Examples

### Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@restaurant.com", "password": "password123"}'

# Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@restaurant.com",
      "name": "Admin User",
      "role": "admin"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Analytics Queries

```bash
# Get inventory valuation
curl -X GET "http://localhost:3000/api/analytics/valuation?period=monthly&locationIds=uuid1,uuid2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get chart data
curl -X GET "http://localhost:3000/api/analytics/charts/valuation?period=weekly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response Format

All analytics endpoints return chart-friendly data:

```json
{
  "success": true,
  "data": [
    {
      "locationId": "uuid",
      "locationName": "Main Restaurant",
      "totalValue": 15420.50,
      "totalItems": 342,
      "categoryBreakdown": [
        {
          "category": "Vegetables",
          "value": 3250.00,
          "itemCount": 120,
          "percentage": 21.1
        }
      ],
      "date": "2024-01-15"
    }
  ]
}
```

Chart data endpoints return:
```json
{
  "success": true,
  "data": {
    "labels": ["Main Restaurant", "Downtown Branch"],
    "datasets": [
      {
        "label": "Inventory Value ($)",
        "data": [15420.50, 12350.75],
        "backgroundColor": "rgba(54, 162, 235, 0.6)",
        "borderColor": "rgba(54, 162, 235, 1)"
      }
    ]
  }
}
```

## Query Parameters

### Common Parameters
- `locationIds` - Comma-separated list of location UUIDs
- `startDate` - ISO date string (YYYY-MM-DD)
- `endDate` - ISO date string (YYYY-MM-DD)
- `period` - `daily`, `weekly`, or `monthly` (default: monthly)
- `category` - Filter by product category

### Examples
```bash
# Monthly report for specific locations
GET /api/analytics/valuation?period=monthly&locationIds=uuid1,uuid2

# Date range query
GET /api/analytics/wastage?startDate=2024-01-01&endDate=2024-01-31

# Category filter
GET /api/analytics/valuation?category=Vegetables&period=weekly
```

## User Roles

### Role Hierarchy
1. **Admin** - Full access to all features
2. **Manager** - Access to analytics and user management
3. **Analyst** - Access to analytics only
4. **Staff** - No analytics access

### Permissions
- **Analytics Access**: Admin, Manager, Analyst
- **Scheduler Management**: Admin only
- **User Management**: Admin, Manager
- **Full API Access**: Admin only

## Caching Strategy

### Cache Keys
- `inventory_valuation:{params_hash}`
- `inventory_turnover:{params_hash}`
- `wastage_report:{params_hash}`
- `location_performance:{params_hash}`

### TTL Configuration
- Analytics data: 10-30 minutes
- Chart data: 30 minutes
- User sessions: 15 minutes

### Cache Invalidation
- Manual: `POST /api/analytics/cache/clear`
- Automatic: Hourly cleanup job
- Event-driven: After inventory updates

## Scheduled Jobs

### Default Schedule
- **Daily Snapshot**: 2:00 AM UTC
- **Weekly Snapshot**: Sunday 3:00 AM UTC  
- **Monthly Snapshot**: 1st day 4:00 AM UTC
- **Cache Cleanup**: Every hour

### Snapshot Data
Stored in `analytics_snapshots` table:
- Location metrics
- Period-based aggregations
- Historical performance data
- Trend analysis data

## Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

### Test Data
The test suite includes comprehensive seed data:
- Multiple locations
- Diverse product catalog
- Historical stock movements
- User accounts with different roles

### Test Coverage
- ✅ Analytics calculations
- ✅ Chart data generation
- ✅ Authentication & authorization
- ✅ Caching mechanisms
- ✅ Error handling
- ✅ API endpoint responses

## Architecture

### Service Structure
```
src/
├── database/          # Database connection and migrations
├── middleware/        # Authentication and validation
├── routes/           # API route handlers
├── services/         # Business logic services
├── tests/            # Test suites
└── types/            # TypeScript type definitions
```

### Key Services
- **AnalyticsService**: Core analytics calculations
- **CacheService**: Redis caching layer
- **AuthService**: Authentication and authorization
- **SchedulerService**: Background job management

### Database Schema
- `users` - User management
- `locations` - Restaurant locations
- `products` - Product catalog
- `inventory_items` - Current inventory levels
- `stock_movements` - Transaction history
- `analytics_snapshots` - Pre-calculated aggregates

## Performance

### Optimization Features
- **Materialized Views**: For heavy aggregations
- **Indexing**: Strategic database indexes
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: Efficient SQL patterns

### Benchmarks
- **Inventory Valuation**: <200ms (cached), <500ms (uncached)
- **Turnover Analysis**: <300ms (cached), <800ms (uncached)
- **Chart Data Generation**: <100ms (cached)
- **Authentication**: <50ms

## Security

### Implemented Measures
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Granular permissions
- **Rate Limiting**: API abuse prevention
- **Input Validation**: SQL injection prevention
- **CORS Configuration**: Cross-origin security

### Security Headers
- Helmet.js for security headers
- CORS with origin validation
- Rate limiting per IP
- Request size limits

## Monitoring

### Health Checks
- `GET /health` - Service health status
- Database connectivity
- Redis connectivity
- Scheduler status

### Logging
- Structured JSON logging
- Error tracking
- Performance metrics
- Request/response logging

## Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Server
API_PORT=3000
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=production
```

### Docker Support
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
# Build application

FROM node:18-alpine AS runtime
# Runtime configuration
```

### Kubernetes
- Health checks configured
- Graceful shutdown handling
- Horizontal pod scaling support
- Environment-based configuration

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Run tests: `npm test`
4. Ensure code coverage: `npm run test:coverage`
5. Submit pull request

### Code Style
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Conventional commits

## License

This project is licensed under the MIT License - see the LICENSE file for details.