# Barber Booking System - Frontend

A modern React + TypeScript web application built with Vite, featuring comprehensive UI components, state management, API integration, and testing.

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

## Getting Started

### Prerequisites

- Node.js 18+ (see `../../.nvmrc` for the exact version)
- pnpm 8+ (or npm/yarn if configured)

### Installation

```bash
# Install all dependencies from root
pnpm install

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
