# Monorepo

A comprehensive monorepo using pnpm workspaces for managing multiple applications and shared packages.

## Project Structure

```
├── apps/
│   ├── api/              # Backend API service
│   └── web/              # Frontend web application
├── packages/
│   └── shared/           # Shared utilities and types
├── docker-compose.yml    # Local development environment
└── package.json          # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ (see `.nvmrc` for the exact version)
- pnpm 8+ (or npm/yarn if configured)

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
