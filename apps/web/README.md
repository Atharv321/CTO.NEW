# Barber Booking System - Frontend

A modern React + TypeScript web application built with Vite, featuring comprehensive UI components, state management, API integration, and testing.

# Supplier Portal Web Application
# Barber Booking System - Web Application

This is the main web application for the Barber Booking System, built with Vite, React, and TypeScript.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **UI Library**: Mantine 7
- **Routing**: React Router v6
- **State Management**: 
  - Zustand for global state
  - React Query (TanStack Query) for server state
- **API Client**: Axios
- **Testing**: Vitest + React Testing Library
- **Component Documentation**: Storybook
- **Linting**: ESLint with TypeScript support

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── layouts/         # Layout components (Header, Navbar, etc.)
│   └── layouts/__tests__/ # Component tests
├── pages/               # Page components for routes
├── hooks/               # Custom React hooks
├── stores/              # Zustand state stores
├── services/            # API service functions
├── lib/                 # Utility functions and helpers
├── config/              # Configuration files
├── theme/               # Mantine theme configuration
├── types/               # TypeScript type definitions
├── test/                # Testing utilities and setup
└── App.tsx              # Main App component
.storybook/              # Storybook configuration
├── main.ts              # Storybook main config
└── preview.tsx          # Storybook preview config
```
- **UI Library**: Mantine UI 7
- **State Management**: 
  - Zustand (global state)
  - TanStack React Query v5 (server state)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library
- **Documentation**: Storybook 7
- **Code Quality**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+ (see `../../.nvmrc` for the exact version)
- pnpm 8+ (or npm/yarn if configured)

### Installation

```bash
# Install all dependencies from root
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

From the monorepo root:

```bash
pnpm install
```

### Environment Configuration

1. Copy the example environment file:

```bash
cd apps/web
cp .env.example .env
```

2. Update the `.env` file with your configuration:

```env
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

### Development

Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3001`

### Building

Build the application for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm type-check` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI
- `pnpm storybook` - Start Storybook
- `pnpm build-storybook` - Build Storybook

## Project Structure

```
apps/web/
├── .storybook/          # Storybook configuration
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   └── Layout/      # Layout component with stories
│   ├── hooks/           # Custom React hooks (React Query)
│   ├── lib/             # Utilities and configurations
│   │   ├── api-client.ts  # Axios API client
│   │   ├── env.ts         # Environment variables
│   │   └── theme.ts       # Mantine theme
│   ├── pages/           # Page components
│   │   ├── HomePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── stores/          # Zustand stores
│   │   └── useAuthStore.ts
│   ├── test/            # Test utilities
│   │   └── setup.ts     # Vitest setup
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Root component
│   ├── App.test.tsx     # App tests
│   ├── main.tsx         # Application entry point
│   └── vite-env.d.ts    # Vite environment types
├── .eslintrc.json       # ESLint configuration
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tsconfig.node.json   # TypeScript config for Node
└── vite.config.ts       # Vite configuration
```

## Architecture

### State Management

The application uses a hybrid state management approach:

1. **Zustand** for global application state (e.g., authentication)
2. **React Query** for server state management (data fetching, caching, mutations)

### API Client

The `apiClient` in `src/lib/api-client.ts` is a centralized Axios instance with:
- Automatic JWT token injection
- Request/response interceptors
- Error handling
- TypeScript support

### Routing

React Router v6 is used for client-side routing. Routes are defined in `App.tsx`.

### Theming

Mantine UI theming is configured in `src/lib/theme.ts`. The theme includes:
- Color scheme
- Typography
- Spacing
- Breakpoints

### Path Aliases

TypeScript path aliases are configured for cleaner imports:

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@lib/*` → `src/lib/*`
- `@hooks/*` → `src/hooks/*`
- `@types/*` → `src/types/*`
- `@stores/*` → `src/stores/*`
- `@pages/*` → `src/pages/*`

### Testing

Tests are written using:
- **Vitest** as the test runner
- **React Testing Library** for component testing
- **@testing-library/jest-dom** for additional matchers

Test files should be colocated with their components using the `.test.tsx` extension.

### Storybook

Storybook is set up for component documentation and development. Stories should be colocated with components using the `.stories.tsx` extension.

## Code Quality

### Linting

ESLint is configured with:
- TypeScript support
- React hooks rules
- React refresh rules
- Prettier integration

### Formatting

Prettier is configured for consistent code formatting with the following rules:
- Single quotes
- 2-space indentation
- Trailing commas (ES5)
- 100 character line width

## Components

### Layout

# Or install web-specific dependencies
cd apps/web
pnpm install
```

### Development

Start the development server with hot module replacement:

```bash
# From root directory
pnpm --filter @app/web dev

# Or from apps/web directory
cd apps/web
pnpm dev
```

The application will be available at `http://localhost:5173`

### Building

```bash
# Build for production
pnpm --filter @app/web build

# Preview the production build locally
pnpm --filter @app/web preview
```

## Available Scripts

### Development

- `pnpm dev` - Start development server
- `pnpm preview` - Preview production build locally

### Building

- `pnpm build` - Build for production (includes TypeScript compilation)

### Testing

- `pnpm test` - Run tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Open Vitest UI dashboard
- `pnpm test:coverage` - Generate coverage report

### Quality Assurance

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm type-check` - Run TypeScript type checking

### Documentation

- `pnpm storybook` - Start Storybook dev server (http://localhost:6006)
- `pnpm storybook:build` - Build Storybook for production

## Environment Variables

Configure through `.env` files (see `.env.example` for available options):

```bash
# API Configuration
VITE_API_URL=http://localhost:3001

# Application Environment
VITE_ENV=development
VITE_APP_TITLE=Barber Booking System

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_STORYBOOK=true
```

Environment variables are defined in `src/config/env.ts` for type-safe access:

```typescript
import { env } from '@/config/env';

console.log(env.API_URL);
console.log(env.isDevelopment);
```

## Architecture

### State Management

#### Global State (Zustand)

Stores are located in `src/stores/` and provide simple, scalable state management:

```typescript
import { useAuthStore } from '@/stores/useAuthStore';

export function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  
  return (
    // Component JSX
  );
}
```

#### Server State (React Query)

Use custom hooks in `src/hooks/useApi.ts` for data fetching:

```typescript
import { useFetch, useCreate, useUpdate, useDelete } from '@/hooks/useApi';

export function MyComponent() {
  const { data, isLoading, error } = useFetch<Booking[]>('/api/bookings');
  const createMutation = useCreate<Booking, CreateBookingData>();
  
  const handleCreate = async () => {
    await createMutation.mutateAsync({
      url: '/api/bookings',
      data: { /* booking data */ },
    });
  };
  
  return (
    // Component JSX
  );
}
```

### API Integration

All API calls go through the centralized API client in `src/lib/api.ts`:

```typescript
import { fetchData, postData } from '@/lib/api';

// Direct API calls
const bookings = await fetchData<Booking[]>('/api/bookings');

// Via React Query hooks
const { data } = useFetch<Booking[]>('/api/bookings');
```

The API client automatically:
- Adds base URL and headers
- Handles errors consistently
- Returns typed responses
- Manages timeouts

### Theming

Theme configuration is centralized in `src/theme/theme.ts`:

```typescript
import { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
  primaryColor: 'blue',
  colors: {
    // Custom colors
  },
  // More theme settings
};
```

## Components

### Layout Components

- **BaseLayout**: Main layout wrapper with header and sidebar
- **AppHeader**: Application header with user menu
- **Navbar**: Navigation sidebar

### Pages

- **Dashboard**: Main dashboard with statistics
- **NotFound**: 404 error page

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test -- Dashboard.test.tsx

# Generate coverage report
pnpm test:coverage

# Open Vitest UI
pnpm test:ui
```

### Writing Tests

Tests use React Testing Library for component testing:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

The `@/test/utils` module provides:
- Pre-configured render function with providers
- All React Testing Library exports
- Setup of Zustand stores, React Router, and React Query

### Test Coverage

To view test coverage:

```bash
pnpm test:coverage
# Open coverage/index.html in browser
```

## Storybook

### Starting Storybook

```bash
pnpm storybook
```

Visit `http://localhost:6006` to browse components.

### Writing Stories

Create `.stories.tsx` files alongside components:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
  title: 'Components/MyComponent',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    title: 'Hello',
  },
};
```

### Building Storybook

```bash
pnpm storybook:build
# Output: storybook-static/
```

## API Integration

The application integrates with a backend API running on `http://localhost:3001` by default.

### Configuring API URL

In development, modify `VITE_API_URL` in `.env`:

```bash
VITE_API_URL=http://your-api-host:port
```

### API Proxy

The Vite dev server proxies `/api/*` requests to the API backend. This helps with CORS during development.

### Adding New API Endpoints

1. Create a service in `src/services/`:

```typescript
// src/services/bookingService.ts
import { useFetch, useCreate } from '@/hooks/useApi';

export interface Booking {
  id: string;
  date: string;
  customerId: string;
  barberId: string;
}

export function useBookings() {
  return useFetch<Booking[]>('/api/bookings');
}

export function useCreateBooking() {
  return useCreate<Booking, Omit<Booking, 'id'>>();
}
```

2. Use in components:

```typescript
import { useBookings, useCreateBooking } from '@/services/bookingService';

export function BookingList() {
  const { data: bookings, isLoading } = useBookings();
  const createMutation = useCreateBooking();
  
  // Component logic
}
```

## Linting and Formatting

### ESLint

```bash
# Check for linting errors
pnpm lint

# Fix linting errors automatically
pnpm lint:fix
```

### Type Checking

```bash
# Type check without emitting files
pnpm type-check
```

## Debugging

### Browser DevTools

1. Open Developer Tools (F12)
2. Use React DevTools extension to inspect components
3. Use Redux DevTools extension for Zustand state inspection

### Vitest Debugging

```bash
# Run tests with debugging
node --inspect-brk ./node_modules/.bin/vitest
```

Then open `chrome://inspect` in Chrome.

## Performance Optimization

### Code Splitting

Routes are split automatically by Vite. For component-level splitting:

```typescript
import { lazy } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Memoization

Use React.memo for expensive components:

```typescript
import { memo } from 'react';

const MemoizedComponent = memo(MyComponent);
```

### Image Optimization

Use optimized image formats (WebP) and lazy loading via Mantine components.

## Deployment

### Building for Production

```bash
pnpm build
```

This creates an optimized build in the `dist/` directory.

### Docker

The application is containerized. See the root `docker-compose.yml` for local development.

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port.

### Build Errors

Clear node_modules and reinstall:

```bash
rm -rf node_modules
pnpm install
pnpm build
```

### Tests Failing

Ensure the test setup is correct:

```bash
pnpm test:ui  # Visual debugging with Vitest UI
```

### Type Errors

Run type checking to see detailed errors:

```bash
pnpm type-check
```

## Contributing

When contributing, ensure:

1. All tests pass: `pnpm test`
2. Code is properly typed: `pnpm type-check`
3. Linting passes: `pnpm lint`
4. Components have Storybook stories
5. New features include tests

See `../../CONTRIBUTING.md` for detailed guidelines.

## License

See `../../LICENSE` for details.
The `Layout` component provides the base application shell with:
- Header with navigation
- Collapsible sidebar
- Responsive design
- Authentication state

## Hooks

### useServices

Example React Query hook for fetching services:

```typescript
import { useServices, useService } from '@hooks/useServices';

// Fetch all services
const { data: services, isLoading } = useServices();

// Fetch single service
const { data: service } = useService(serviceId);
```

## Stores

### useAuthStore

Zustand store for authentication state:

```typescript
import { useAuthStore } from '@stores/useAuthStore';

const { user, isAuthenticated, login, logout } = useAuthStore();
# Web Application

A comprehensive supplier management UI built with React, TypeScript, and Vite.

## Features

### Supplier Management
- **Supplier Directory**: View and search suppliers with advanced filtering
- **Supplier Details**: Comprehensive supplier information with performance metrics
- **Location-based Filtering**: Filter suppliers by geographic location
- **Rating System**: Visual supplier ratings with star display

### Purchase Order Management
- **Order Creation**: Draft, submit, and track purchase orders
- **Status Tracking**: Visual indicators for order status (Draft, Submitted, Approved, Received, etc.)
- **Item Management**: Add/remove items, adjust quantities and pricing
- **Receiving Workflow**: Track received quantities against ordered amounts

### Notifications Center
- **Real-time Updates**: Supplier updates, order status changes, low stock alerts
- **Actionable Notifications**: Direct links to relevant actions from notifications
- **Filtering & Search**: Filter by type and search through notifications
- **Read/Unread Management**: Mark notifications as read or delete them

### Export Functionality
- **Multiple Formats**: Export data as CSV, PDF, or Excel
- **Filtered Exports**: Export only the data matching your filters
- **Supplier & Order Exports**: Separate export options for suppliers and purchase orders

### Role-Based Access Control
- **Permission System**: UI adapts based on user roles (Admin, Manager, Staff)
- **Feature Restrictions**: Hide/disable features based on permissions
- **Secure Navigation**: Role-aware menu system

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI Components**: Custom components with Lucide React icons
- **Styling**: CSS with CSS custom properties
- **Testing**: Vitest with React Testing Library
- **State Management**: React hooks and context
- **API Client**: Custom fetch-based API client

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

5. Build for production:
   ```bash
   pnpm build
   ```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Layout.tsx      # Main app layout with navigation
│   ├── RoleGuard.tsx   # Role-based access control
│   ├── Dashboard.tsx    # Dashboard overview
│   ├── suppliers/       # Supplier-related components
│   ├── purchase-orders/ # Purchase order components
│   └── notifications/  # Notification components
├── hooks/              # Custom React hooks
│   └── useAuth.ts     # Authentication and permissions
├── utils/              # Utility functions
│   └── api.ts         # API client
└── test/               # Test configuration
    └── setup.ts
```

## API Integration

The application integrates with a RESTful API with the following endpoints:

- `GET /api/suppliers` - List suppliers with filtering
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create new supplier
- `PATCH /api/suppliers/:id` - Update supplier

- `GET /api/purchase-orders` - List purchase orders
- `GET /api/purchase-orders/:id` - Get order details
- `POST /api/purchase-orders` - Create new order
- `PATCH /api/purchase-orders/:id/status` - Update order status

- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

## Testing

The application includes comprehensive tests for critical components:

- Supplier Directory tests
- Purchase Order Creation tests  
- Notification Management tests

Run tests with:
```bash
pnpm test
```

## Role Permissions

### Admin
- Full access to all features
- Can create, edit, delete suppliers
- Can approve and manage all purchase orders
- Can manage notifications and exports

### Manager
- Can create and edit suppliers
- Can approve purchase orders
- Can view reports and export data
- Cannot delete suppliers or manage user permissions

### Staff
- Can view supplier information
- Can create purchase orders
- Can receive items
- Limited reporting access
All environment variables must be prefixed with `VITE_` to be exposed to the client:

- `VITE_API_URL` - API base URL
- `VITE_ENV` - Environment name

## Contributing

1. Follow the existing code structure and patterns
2. Write tests for new features
3. Create Storybook stories for new components
4. Run linting and type checking before committing
5. Ensure all tests pass

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, you can change it in `vite.config.ts`:

```typescript
server: {
  port: 3002, // Change to desired port
  host: true,
}
```

### Type Errors

Run type checking to identify issues:

```bash
pnpm type-check
```

### Test Failures

Run tests in watch mode for debugging:

```bash
pnpm test:watch
```

## License

Private - All rights reserved
Configure through `.env` files:

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Ensure all tests pass before submitting
4. Use TypeScript for all new code

## License

MIT License
