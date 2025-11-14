# Web Application

Frontend web application built with Vite + React + TypeScript for the Barber Booking system.

## Tech Stack

- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Language**: TypeScript 5.3
- **UI Library**: Mantine 7.3
- **Routing**: React Router v6
- **State Management**: 
  - React Query (server state)
  - Zustand (client state)
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library
- **Component Development**: Storybook 7.6
- **Icons**: Tabler Icons React

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# From the monorepo root
pnpm install

# Or from this directory
pnpm install
```

### Development

```bash
# Start development server (runs on http://localhost:5173)
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Testing

```bash
# Run tests in watch mode
pnpm run test

# Run tests with UI
pnpm run test:ui

# Run tests with coverage
pnpm run test:coverage
```

### Linting & Type Checking

```bash
# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Type check
pnpm run type-check
```

### Storybook

```bash
# Start Storybook (runs on http://localhost:6006)
pnpm run storybook

# Build Storybook for production
pnpm run build-storybook
```

## Project Structure

```
apps/web/
├── .storybook/              # Storybook configuration
├── src/
│   ├── api/                 # API client and endpoints
│   │   └── client.ts        # Axios API client with interceptors
│   ├── app/                 # Application core
│   │   ├── providers/       # React context providers
│   │   └── router.tsx       # Route definitions
│   ├── components/          # Reusable components
│   │   ├── common/          # Generic components (Button, ThemeToggle)
│   │   └── layout/          # Layout components (Header, Nav, Layout)
│   ├── config/              # Configuration
│   │   └── env.ts           # Environment variables with validation
│   ├── hooks/               # Custom React hooks
│   │   └── useDebounce.ts   # Example debounce hook
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── Appointments.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   ├── store/               # Zustand stores
│   │   ├── authStore.ts     # Authentication state
│   │   └── ui/              # UI-related stores
│   │       └── themeStore.ts
│   ├── styles/              # Global styles
│   │   └── global.css
│   ├── test/                # Test utilities
│   │   └── setup.ts
│   ├── theme/               # Theme configuration
│   │   └── theme.ts
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Root application component
│   └── main.tsx             # Application entry point
├── index.html               # HTML template
├── package.json
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── vitest.config.ts         # Vitest configuration
```

## Environment Variables

Configure through `.env` files in the root of this directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `http://localhost:3000` |
| `VITE_APP_NAME` | Application name | `Barber Booking` |
| `VITE_APP_VERSION` | Application version | `0.0.1` |
| `VITE_ENV` | Environment | `development` |

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Environment variables are validated at runtime using Zod. See `src/config/env.ts` for schema.

## Path Aliases

The following path aliases are configured for cleaner imports:

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@pages/*` → `src/pages/*`
- `@hooks/*` → `src/hooks/*`
- `@store/*` → `src/store/*`
- `@api/*` → `src/api/*`
- `@utils/*` → `src/utils/*`
- `@types/*` → `src/types/*`
- `@theme/*` → `src/theme/*`
- `@config/*` → `src/config/*`

Example usage:
```typescript
import { Button } from '@components/Button/Button';
import { useAuthStore } from '@store/authStore';
import { apiClient } from '@api/client';
```

## Key Features

### 🎨 UI Library (Mantine)

Mantine provides a comprehensive component library with built-in dark mode support, accessibility features, and TypeScript support.

```typescript
import { Button, Card, Title } from '@mantine/core';
```

### 🎭 Theming

Theme configuration is managed through:
- `src/theme/theme.ts` - Theme definitions
- `src/store/ui/themeStore.ts` - Theme state management (Zustand)
- Theme toggle component in header

Light/dark mode preference is persisted in localStorage.

### 🛣️ Routing

React Router v6 with nested routes:
- `/` - Home page
- `/appointments` - Appointments page
- `/settings` - Settings page
- `*` - 404 Not Found page

Routes are defined in `src/app/router.tsx` and use the `<MainLayout>` wrapper.

### 📡 API Client

Axios-based API client with:
- Request/response interceptors
- Automatic auth token injection
- Error handling
- Type-safe methods

```typescript
import { apiClient } from '@api/client';

const data = await apiClient.get<User>('/users/me');
```

### 🗃️ State Management

#### Server State (React Query)
For async data fetching and caching:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['users', id],
  queryFn: () => apiClient.get(`/users/${id}`),
});
```

#### Client State (Zustand)
For local application state:

```typescript
import { useAuthStore } from '@store/authStore';

const user = useAuthStore(state => state.user);
const logout = useAuthStore(state => state.logout);
```

### 🧪 Testing

Tests are co-located with components (`.test.tsx` files) and use:
- Vitest as the test runner
- React Testing Library for component testing
- @testing-library/jest-dom for custom matchers

Example:
```typescript
describe('Button', () => {
  it('renders correctly', () => {
    render(<Button label="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### 📚 Storybook

Component stories are co-located with components (`.stories.tsx` files):

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};

export const Primary: StoryObj = {
  args: { label: 'Primary' },
};

export default meta;
```

### 🔧 Custom Hooks

Create reusable hooks in `src/hooks/`:

```typescript
// useDebounce example
const debouncedValue = useDebounce(inputValue, 500);
```

## Development Workflow

1. **Create a new component**:
   ```bash
   # Create component directory
   mkdir src/components/MyComponent
   
   # Create files
   touch src/components/MyComponent/MyComponent.tsx
   touch src/components/MyComponent/MyComponent.test.tsx
   touch src/components/MyComponent/MyComponent.stories.tsx
   ```

2. **Write the component** with TypeScript and proper types

3. **Add tests** to ensure component works correctly

4. **Create stories** for visual development and documentation

5. **Run checks**:
   ```bash
   pnpm run lint
   pnpm run type-check
   pnpm run test
   ```

## API Integration

The API client is configured to:
- Proxy requests to `/api/*` to the backend (in development)
- Use `VITE_API_URL` environment variable for the base URL
- Automatically include auth tokens from localStorage
- Handle 401 responses by clearing tokens and redirecting to login

Example usage:
```typescript
import { apiClient } from '@api/client';

// GET request
const users = await apiClient.get<User[]>('/users');

// POST request
const newUser = await apiClient.post<User>('/users', { name: 'John' });

// Auth token management
apiClient.setAuthToken(token);
apiClient.clearAuthToken();
```

## Performance Considerations

- Vite provides fast HMR (Hot Module Replacement)
- React Query handles request deduplication and caching
- Components use React.memo where appropriate
- Path aliases reduce bundle size by avoiding deep imports
- Production builds are optimized with tree-shaking

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features required
- No IE11 support

## Deployment

Build the application for production:

```bash
pnpm run build
```

The `dist` directory contains the production-ready static files that can be served by any static hosting service or CDN.

Preview the production build locally:

```bash
pnpm run preview
```

## Troubleshooting

### Port already in use
If port 5173 is already in use, you can change it in `vite.config.ts`:

```typescript
server: {
  port: 3001, // Change to your preferred port
}
```

### Type errors with Mantine
Make sure to import CSS files in your `App.tsx`:

```typescript
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
```

### Environment variables not loading
Ensure your `.env` file is in the root of the `apps/web` directory and variables are prefixed with `VITE_`.

## Contributing

1. Follow the existing code structure and patterns
2. Write tests for new components
3. Create Storybook stories for UI components
4. Run linting and type checking before committing
5. Use semantic commit messages

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Mantine Documentation](https://mantine.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Router Documentation](https://reactrouter.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Storybook Documentation](https://storybook.js.org/)
