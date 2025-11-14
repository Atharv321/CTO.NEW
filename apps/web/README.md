# Barber Booking System - Web Application

This is the main web application for the Barber Booking System, built with Vite, React, and TypeScript.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
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
```

## Environment Variables

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
