# Sample Deployment Pipeline

This repository provides a reference implementation for a full CI/CD pipeline deploying a simple two-service application (API + Web).

## Project Structure

- `api/` – Node.js API service
- `web/` – Node.js web frontend
- `docker-compose.yml` – Local development stack
- `docker-compose.prod.yml` – Production-ready stack using pre-built images
- `helm/` – Helm chart for Kubernetes deployments
- `.github/workflows/ci-cd.yml` – GitHub Actions workflow for CI/CD
- `docs/deployment.md` – Detailed deployment guide
- `docs/ci-cd-pipeline.md` – CI/CD workflow deep dive
- `docs/kubernetes-secrets.md` – Kubernetes secret management
- `docs/architecture.md` – System architecture overview
- `scripts/` – Utility scripts (migrations, rollback)

## Getting Started

1. Copy `.env.example` to `.env` and adjust the values as needed.
2. Install dependencies with `make install` (optional but recommended for running tests locally).
3. Run `make up` to start the full stack locally.
4. Visit the web UI at `http://localhost:3000` and the API health endpoint at `http://localhost:3001/health`.

### Useful Commands

| Command | Description |
| ------- | ----------- |
| `make build` | Build Docker images for local services |
| `make up` / `make down` | Start or stop the Docker Compose stack |
| `make clean` | Stop services and remove volumes |
| `make test` | Run unit tests for API and Web |
| `make migrate` | Execute local database migrations |
| `make logs` | Tail logs for all services |
| `make rollback` | Trigger staging rollback via Helm |

## Database & Migrations

The API service uses **Prisma** to manage the relational schema, migrations, and seed data. The data model lives in [`api/prisma/schema.prisma`](api/prisma/schema.prisma); generated SQL migrations are stored in [`api/prisma/migrations`](api/prisma/migrations).

### Running migrations locally

```bash
# Using the migration script
./scripts/run_migrations.sh local

# Or manually
export DATABASE_URL="postgresql://user:password@localhost:5432/appdb"
cd api
npm install
npm run migrate
```

The migration script will apply the pending Prisma migrations and populate baseline seed data (roles and sample locations). Set `SKIP_DB_SEED=true` when running the script if you want to bypass the seed step.

### Creating a new migration

1. Update the Prisma schema (`api/prisma/schema.prisma`).
2. Run `npx prisma migrate dev --name <change-name>` inside the `api` directory. Use `--create-only` if you want to review the SQL without executing it.
3. Commit both the schema change and the generated migration folder.

### Additional documentation

- [`docs/database-schema.md`](docs/database-schema.md) – entity relationships, constraints, and auditing approach.
- [`docs/database-migrations.md`](docs/database-migrations.md) – detailed guidance on the Prisma-based migration workflow, environment-specific commands, and troubleshooting tips.

## Environment Configuration & Secrets

### Environment Files

The repository includes environment configuration files for different deployment scenarios:

- `.env.example` - Default development configuration
- `.env.local.example` - Local development overrides
- `.env.staging.example` - Staging environment template
- `.env.production.example` - Production environment template

### Setting Up Locally

```bash
# Copy the example file
cp .env.example .env

# Edit with your local values
nano .env
```

**⚠️ IMPORTANT:** Never commit `.env` files to git. They are automatically ignored in `.gitignore`.

### GitHub Secrets for CI/CD

For automated deployments, configure secrets in GitHub:

**Settings → Secrets and variables → Actions**

Required secrets:

- `STAGING_DATABASE_URL` - PostgreSQL connection string for staging
- `STAGING_REDIS_URL` - Redis connection string for staging
- `PRODUCTION_DATABASE_URL` - PostgreSQL connection string for production
- `PRODUCTION_REDIS_URL` - Redis connection string for production
- `STAGING_JWT_ACCESS_SECRET` - JWT secret for staging
- `PRODUCTION_JWT_ACCESS_SECRET` - JWT secret for production
- `STAGING_KUBECONFIG` - Kubernetes config (base64) for staging
- `PRODUCTION_KUBECONFIG` - Kubernetes config (base64) for production

### Secrets Best Practices

1. **Rotation:** Rotate secrets every 90 days
2. **Never commit:** Never hardcode secrets in source files
3. **Minimal scope:** Give each secret only required permissions
4. **Audit:** Monitor and log secret access
5. **Environment-specific:** Use different secrets for each environment

See [`docs/deployment-guide.md`](docs/deployment-guide.md) for detailed secrets management.

## Logs Management

### Local Development Logs

```bash
# View all service logs
docker compose logs -f

# View specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres

# Save logs to file
docker compose logs > logs.txt
```

### Production Logs

For production deployments, logs are retrieved from Kubernetes:

```bash
# API service logs
kubectl logs deployment/app-api -n production --tail=100 -f

# Web service logs
kubectl logs deployment/app-web -n production --tail=100 -f

# Previous logs (crashed containers)
kubectl logs deployment/app-api -n production --previous
```

### Log Aggregation

For production environments, implement centralized logging with:
- **Elasticsearch + Kibana** - Search and analyze logs
- **Datadog** - Monitoring and alerting
- **CloudWatch** - AWS managed logging
- **Stackdriver** - GCP managed logging

### Logging Best Practices

- Use **structured logging** (JSON format)
- Include **request IDs** and **trace IDs**
- Use appropriate **log levels** (error, warn, info, debug)
- Never log **sensitive data** (passwords, tokens, PII)

## CI/CD Pipeline

The CI/CD pipeline (`.github/workflows/ci.yml` and `.github/workflows/ci-cd.yml`) includes:

- **Lint & Format Check** - ESLint and Prettier
- **Type Checking** - TypeScript validation
- **Unit Tests** - Jest test suite
- **Build** - Docker image builds
- **Integration Tests** - End-to-end tests (Playwright)
- **Deploy** - Automatic deployment to staging/production

### Pipeline Steps

1. **Lint** - Check code style and format
2. **Type Check** - Validate TypeScript types
3. **Test** - Run unit and integration tests
4. **Build** - Build Docker images
5. **Push** - Push to container registry
6. **Migrate** - Run database migrations
7. **Deploy Staging** - Deploy to staging environment
8. **Deploy Production** - Deploy to production (requires approval)

### Deployment Considerations

#### Separate API and Worker Processes

In production, run separate deployments:

- **API Service:** Handles HTTP requests (scale horizontally based on traffic)
- **Worker Service:** Processes background jobs from queue

#### Cron Jobs Alternative

If separate workers aren't feasible, use Kubernetes CronJobs for:
- Database cleanup
- Report generation
- Cache refresh
- Backups

See [`docs/deployment-guide.md`](docs/deployment-guide.md) for detailed instructions.

## Documentation

See additional documentation:

- [`docs/deployment.md`](docs/deployment.md) - Original deployment guide with Helm
- [`docs/deployment-guide.md`](docs/deployment-guide.md) - Complete deployment, logs, and secrets guide
- [`docs/ci-cd-pipeline.md`](docs/ci-cd-pipeline.md) - CI/CD workflow deep dive
- [`docs/kubernetes-secrets.md`](docs/kubernetes-secrets.md) - Kubernetes secret management
- [`docs/architecture.md`](docs/architecture.md) - System architecture overview
- [`docs/rollback-strategy.md`](docs/rollback-strategy.md) - Emergency rollback procedures
# Monorepo

A comprehensive monorepo using pnpm workspaces for managing multiple applications and shared packages.
# Inventory Barcode/QR Code Scanner

A browser-based inventory management system with integrated barcode/QR code scanning capabilities, fallback manual entry, and mobile-friendly interface.

## Features

- **Browser-Based Scanning**: Uses `@zxing/library` for robust barcode and QR code detection
- **Multiple Format Support**: Recognizes CODE_128, QR codes, and other common formats
- **Fallback Manual Entry**: Graceful fallback when camera is unavailable
- **Mobile-Friendly**: Fully responsive design optimized for phones, tablets, and desktops
- **Accessibility**: WCAG 2.1 compliant with proper ARIA labels and keyboard navigation
- **Real-Time Inventory Management**: Add, update, and remove items instantly
- **Item Database**: Pre-configured inventory with automatic lookup
- **Comprehensive Testing**: Integration tests with mocked scanner input

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test:coverage

# UI dashboard
npm test:ui
```

## Architecture

### Components

#### `BarcodeScanner`
The main scanning component that handles:
- Video stream capture from device camera
- Real-time barcode/QR code detection
- Error handling and camera permission management
- Manual entry fallback form
- Accessibility features

**Props:**
- `onScan`: Callback when a barcode is scanned
- `onManualEntry`: Callback for manual barcode entry
- `isActive`: Boolean to control scanning state
- `ariaLabel`: Custom ARIA label for accessibility

#### `InventoryManager`
Main container component managing:
- Item inventory state
- Barcode scanning orchestration
- Item quantity adjustments
- Remove functionality
- Inventory summary display

### Hooks

#### `useBarcodeScan`
Custom React hook for barcode scanning logic:
- Manages camera stream and device access
- Handles `BrowserMultiFormatReader` lifecycle
- Provides scan result callbacks
- Cleans up resources on unmount

## Usage Example

```tsx
import { InventoryManager } from './components/InventoryManager'

export default function App() {
  return <InventoryManager />
}
```

Or use components individually:

```tsx
import { BarcodeScanner } from './components/BarcodeScanner'

function MyComponent() {
  const handleScan = (result) => {
    console.log('Scanned:', result.data, result.format)
  }

  return (
    <BarcodeScanner
      onScan={handleScan}
      ariaLabel="Item scanner"
    />
  )
}
```

## Scanner Database

The scanner comes with a pre-configured inventory database. Supported test barcodes:

| Barcode | Item Name |
|---------|-----------|
| 123456789 | Widget A |
| 987654321 | Widget B |
| 555555555 | Gadget X |
| QR_001 | Premium Tool |

Manual entries for unknown barcodes will display a "not found" message but can be extended by modifying the database in `InventoryManager.tsx`.

## Browser Support

- **Chrome/Edge**: Full support including camera access
- **Firefox**: Full support including camera access
- **Safari**: Full support with iOS 14.5+
- **Mobile Browsers**: Optimized for both Android and iOS

**Required Permissions:**
- Camera access (HTTPS required in production)

## Accessibility

The application implements WCAG 2.1 Level AA standards:

- **Keyboard Navigation**: All controls are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Color Contrast**: Meets WCAG AA contrast requirements
- **Focus Management**: Clear focus indicators
- **Reduced Motion**: Respects `prefers-reduced-motion` preference
- **Touch Targets**: Minimum 44x44px for mobile
- **Form Labels**: Associated labels for all inputs

### Testing for Accessibility

Test keyboard navigation:
```bash
# Tab through all interactive elements
# Verify focus is visible and logical
```

Test with screen readers:
```bash
# Use NVDA (Windows), JAWS, or VoiceOver (macOS/iOS)
# Verify all content is announced properly
```

## Testing

### Test Coverage

The project includes comprehensive test suites:

1. **Integration Tests** (`integration.test.tsx`)
   - End-to-end scanning workflows
   - Manual entry fallback
   - Inventory management operations
   - Error handling

2. **Component Tests** (`BarcodeScanner.test.tsx`)
   - Scanner UI rendering
   - Manual entry form interaction
   - Accessibility features
   - State management

3. **Hook Tests** (`hooks.test.ts`)
   - Camera stream lifecycle
   - Scan result handling
   - Error scenarios
   - Resource cleanup

### Mock Scanner Input

Tests use mocked scanner results to simulate barcode detection:

```typescript
import { createMockScanResult } from './test/mocks'

const mockResult = createMockScanResult('123456789', 'CODE_128')
// Use in tests...
```

### Running Specific Tests

```bash
# Run integration tests only
npm test -- integration.test

# Run with pattern
npm test -- --grep "manual entry"

# Watch specific file
npm test -- --watch BarcodeScanner.test.tsx
```

## API Integration

The system supports API lookup endpoints for barcode validation. To add API support:

1. Create an API service module
2. Update `InventoryManager` to call the API on scan
3. Handle async item lookups

Example:

```typescript
async function lookupBarcode(barcode: string) {
  const response = await fetch(`/api/items/${barcode}`)
  return response.json()
}
```

## Mobile Optimization

### Touch Optimization
- Large touch targets (44x44px minimum)
- Optimized spacing for mobile devices
- Landscape/portrait orientation support

### Performance
- Efficient re-renders using React hooks
- Minimal camera stream operations
- Optimized CSS for mobile

### Responsiveness Breakpoints
- **Desktop**: 1200px and above
- **Tablet**: 768px to 1200px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## Styling

The application uses CSS with:
- CSS variables for theming
- Mobile-first responsive design
- Smooth animations and transitions
- Color-blind friendly palette

### Colors
- Primary: `#4caf50` (Green)
- Error: `#ef5350` (Red)
- Text Primary: `#333`
- Text Secondary: `#666`
- Background: `#fafafa`

## Error Handling

The scanner handles various error scenarios:

- **Camera Permission Denied**: Shows manual entry fallback
- **No Camera Available**: Displays error message with fallback option
- **Invalid Barcode Format**: Graceful handling with user feedback
- **Unknown Barcode**: Notifies user with scanned value
- **Network Errors**: Handled in API integration layer

## Performance Considerations

- Camera stream cleanup on component unmount
- Efficient state updates using React hooks
- Minimal re-renders with proper prop memoization
- Optimized CSS animations with `will-change` hints

## Known Limitations

- Requires HTTPS in production for camera access
- Some older browsers may have limited barcode format support
- Works best with adequate lighting for scanning
- Mobile browsers may have different camera permission UX

## Future Enhancements

- [ ] Batch import/export functionality
- [ ] Cloud sync and storage
- [ ] Advanced analytics and reporting
- [ ] Multi-user support with authentication
- [ ] Offline mode with sync
- [ ] Custom item database configuration
- [ ] Receipt printing
- [ ] Barcode generation

## Contributing

When contributing, ensure:

1. All tests pass: `npm test`
2. Code is properly typed: `npm run type-check`
3. Linting passes: `npm run lint`
4. Accessibility is maintained
5. Mobile responsiveness is tested

## License

[Add your license here]

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test files for usage examples
3. Inspect browser console for error messages
4. Verify camera permissions are granted

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Ensure HTTPS is used (required for camera access)
- Try a different browser
- Verify camera is available and not in use

### Scanning Not Detecting Codes
- Improve lighting conditions
- Ensure barcode/QR code is clear and not damaged
- Try different angles
- Use manual entry as fallback

### Manual Entry Not Appearing
- Ensure camera permission error occurred
- Or click "Use Manual Entry Instead" button
- Check browser console for errors

### Tests Failing
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version is 16+
- Check that all dependencies installed correctly
# Barber Booking System

A comprehensive barber booking platform with customer-facing UI, web application, and backend API.

## Project Structure

```
├── apps/
│   ├── customer-booking-ui/     # Next.js customer-facing application
│   └── web/                     # Vite + React main web application
│   ├── api/              # Backend API service
│   └── web/              # Frontend web application
├── packages/
│   └── shared/           # Shared utilities and types
├── docker-compose.yml    # Local development environment
└── package.json          # Root workspace configuration
```

│   └── customer-booking-ui/     # Next.js customer-facing application
├── packages/
│   └── shared/                   # Shared types and utilities (future)
└── package.json                  # Root monorepo package
```

## Technologies

### Customer Booking UI
- **Framework**: Next.js 14, React 18, TypeScript
- **State Management**: TanStack React Query v5
- **Forms**: React Hook Form with Zod validation
- **Styling**: CSS Modules with mobile-responsive design
- **API Client**: Axios

### Web Application
- **Framework**: Vite 5 + React 18 + TypeScript
- **UI Library**: Mantine UI 7
- **State Management**: Zustand + TanStack React Query v5
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library
- **Documentation**: Storybook 7
- **API Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ (see `.nvmrc` for the exact version)
- pnpm 8+ (or npm/yarn if configured)
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Run linter
pnpm run lint

# Format code
pnpm run format
```

### Development

```bash
# Start development server for specific app
pnpm --filter @app/api dev
pnpm --filter @app/web dev

# Start all development servers
pnpm run dev
```

### Docker Development Environment

```bash
# Start local development environment
docker-compose up -d

# Stop the environment
docker-compose down
```

## Package Structure

### Apps

- **@app/api**: Backend API service (Node.js/Express)
- **@app/web**: Frontend web application (React)

### Packages

- **@shared/utils**: Shared utility functions
- **@shared/types**: Shared TypeScript types

## Available Scripts

From the root directory, you can run:

- `pnpm install` - Install dependencies across all workspaces
- `pnpm run build` - Build all packages
- `pnpm run dev` - Run development mode for all apps
- `pnpm run test` - Run tests across all packages
- `pnpm run lint` - Run linting across all packages
- `pnpm run format` - Format code across all packages
- `pnpm run type-check` - Run TypeScript type checking
- `pnpm --filter <workspace> <script>` - Run a script in a specific workspace

## Development Guidelines

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md).

## License

MIT
# Development mode
pnpm dev

# Build
pnpm build

# Type checking
pnpm type-check
```

## Features

### Customer Booking UI

- **Multi-step booking flow**:
  1. Service selection with pricing and duration
  2. Barber and date selection
  3. Time slot picker with real-time availability
  4. Customer details form with validation
  5. Booking confirmation screen

- **State Management**:
  - React Query for efficient caching of services, barbers, and time slots
  - Automatic cache invalidation on booking creation
  - Optimized re-fetching strategies

- **Validation**:
  - Client-side form validation with Zod schema
  - Email format validation
  - Phone number validation
  - Real-time error feedback

- **Accessibility**:
  - ARIA labels and descriptions
  - Keyboard navigation support
  - Focus management
  - Semantic HTML elements
  - Color contrast compliance
  - Screen reader compatibility

- **Mobile Responsive**:
  - Responsive grid layouts
  - Touch-friendly buttons and inputs
  - Optimized font sizes for mobile
  - Proper viewport meta tag

- **Error Handling**:
  - Loading states for all data fetches
  - User-friendly error messages
  - API error handling with proper feedback
  - Form submission error display

## Environment Variables

Create `.env.local` file in the `apps/customer-booking-ui` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Component Structure

### Main Components

- **Layout**: Application header and footer
- **BookingPage**: Multi-step booking orchestrator
- **ServiceSelection**: Service browsing and selection
- **BarberDateSelection**: Barber and date picker
- **TimeSlotSelection**: Available time slots
- **BookingForm**: Customer details form with validation
- **BookingConfirmation**: Success/pending confirmation screen

### Hooks

- `useServices()`: Fetch all services
- `useService(id)`: Fetch single service
- `useBarbers()`: Fetch all barbers
- `useBarber(id)`: Fetch single barber
- `useAvailableSlots(barberId, date)`: Fetch slots for barber/date
- `useCreateBooking()`: Create new booking
- `useBooking(id)`: Fetch booking details
- `useCancelBooking()`: Cancel booking

## API Endpoints

The application expects the following API endpoints:

```
GET    /api/services              # Get all services
GET    /api/services/:id          # Get service details
GET    /api/barbers               # Get all barbers
GET    /api/barbers/:id           # Get barber details
GET    /api/time-slots/available  # Get available slots (params: barberId, date)
POST   /api/bookings              # Create booking
GET    /api/bookings/:id          # Get booking details
DELETE /api/bookings/:id          # Cancel booking
```

## Types

All TypeScript types are defined in `src/types/booking.ts`:

- `Service`: Barber service information
- `Barber`: Barber professional information
- `TimeSlot`: Available booking slots
- `BookingFormData`: Customer booking form data
- `BookingConfirmation`: Booking confirmation response
- `ApiError`: API error structure

## Styling

The application uses CSS Modules for component styling with:

- CSS custom properties for theming
- Mobile-first responsive design
- Accessibility-focused styling
- Focus states for keyboard navigation

## Best Practices

1. **Accessibility**: All interactive elements are keyboard accessible
2. **Performance**: React Query caching reduces API calls
3. **Error Handling**: Comprehensive error states and user feedback
4. **Validation**: Zod schemas ensure data integrity
5. **Mobile First**: Responsive design starts from mobile screens
6. **Type Safety**: Full TypeScript coverage

## Web Application

The main web application is located at `apps/web/` and built with Vite for optimal development experience.

### Features

- **Modern Stack**: Vite 5 for lightning-fast HMR and optimal build performance
- **UI Components**: Mantine UI 7 with comprehensive component library
- **State Management**: Hybrid approach with Zustand for global state and React Query for server state
- **Routing**: React Router v6 for client-side navigation
- **Type Safety**: Full TypeScript support with strict mode
- **Testing**: Vitest + React Testing Library for unit and integration tests
- **Documentation**: Storybook 7 for component development and documentation
- **Code Quality**: ESLint + Prettier for consistent code style

### Quick Start

```bash
cd apps/web

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build

# Run Storybook
npm run storybook
```

### Architecture

- **Path Aliases**: Configured for clean imports (`@/`, `@components/`, `@lib/`, etc.)
- **API Client**: Centralized Axios instance with interceptors
- **Theme System**: Customizable Mantine theme
- **Environment Config**: `.env` based configuration with TypeScript support

For detailed documentation, see [apps/web/README.md](apps/web/README.md)

## Future Enhancements

- [ ] Playwright E2E tests
- [ ] Payment integration
- [ ] Calendar widget
- [ ] Notification system
- [ ] Booking management page
- [ ] Analytics tracking
- [ ] Multi-language support
- [ ] Mobile applications (React Native)

## License

Private - All rights reserved
