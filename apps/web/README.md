# Supplier Portal Web Application
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