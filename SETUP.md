# Local Development Setup Guide

This guide will help you set up the monorepo for local development.

## Prerequisites

- **Node.js**: Version 18 or higher
  - Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage versions
  - The project includes a `.nvmrc` file for automatic version management
- **pnpm**: Version 8 or higher
  - Install globally: `npm install -g pnpm`
  - Or use: `corepack enable` (if using Node 16.10+)
- **Docker & Docker Compose** (optional, for containerized dev environment)
  - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Verify Node Version

```bash
# Using nvm
nvm use

# Or manually
node --version  # Should be v18.x.x or higher
```

### 3. Install Dependencies

```bash
# Install all dependencies across workspaces
pnpm install

# Install a specific dependency
pnpm add <package-name>

# Install a dev dependency
pnpm add -D <package-name>
```

### 4. Setup Environment Variables

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your local configuration
# vim .env.local
```

### 5. Start Development Environment

#### Option A: Without Docker

```bash
# Install and start services manually, or use default ports:
# - API: http://localhost:3000
# - Web: http://localhost:5173

# Terminal 1: Start the API
pnpm --filter @app/api dev

# Terminal 2: Start the Web App
pnpm --filter @app/web dev

# Access the application at http://localhost:5173
```

#### Option B: With Docker

```bash
# Start all services (PostgreSQL, Redis, etc.)
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Common Commands

### Development

```bash
# Run all development servers
pnpm run dev

# Run dev for a specific app/package
pnpm --filter @app/api dev
pnpm --filter @app/web dev
pnpm --filter @shared/shared dev
```

### Building

```bash
# Build all packages
pnpm run build

# Build specific workspace
pnpm --filter @app/api run build
```

### Testing

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test -- --watch

# Run tests for specific package
pnpm --filter @app/api run test

# Run tests with coverage
pnpm run test -- --coverage
```

### Linting & Formatting

```bash
# Check code style
pnpm run lint

# Fix linting issues automatically
pnpm run lint:fix

# Check formatting
pnpm run format:check

# Format code
pnpm run format
```

### Type Checking

```bash
# Run TypeScript checks
pnpm run type-check

# In watch mode
pnpm run type-check -- --watch
```

### Clean Up

```bash
# Remove all node_modules and lock files
pnpm run clean

# Reinstall dependencies
pnpm install
```

## Project Structure

```
├── apps/
│   ├── api/              # Express API backend
│   └── web/              # React frontend with Vite
├── packages/
│   └── shared/           # Shared types and utilities
├── .github/
│   └── workflows/        # CI/CD workflows
├── docker-compose.yml    # Docker services configuration
├── package.json          # Root workspace configuration
└── tsconfig.json         # TypeScript configuration
```

## Environment Variables

See `.env.example` for all available variables:

- **Database**: `DATABASE_URL`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **Cache**: `REDIS_URL`, `REDIS_PORT`
- **API**: `API_PORT`, `NODE_ENV`
- **Web**: `WEB_PORT`, `VITE_API_URL`

## Git Workflow

The project uses:
- **Husky** for git hooks
- **lint-staged** for pre-commit checks
- **commitlint** for commit message validation

### Before Committing

Ensure:
1. Code is properly formatted: `pnpm run format`
2. Tests pass: `pnpm run test`
3. No linting errors: `pnpm run lint`
4. TypeScript checks pass: `pnpm run type-check`

Commit messages should follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Good commit message
git commit -m "feat(api): add user authentication endpoint"

# Types: feat, fix, docs, style, refactor, test, chore, ci, perf, revert
```

## Troubleshooting

### Dependencies not installing

```bash
# Clear pnpm cache
pnpm store prune

# Remove lock file and reinstall
rm pnpm-lock.yaml
pnpm install
```

### Port already in use

```bash
# Find and kill process using port 3000 (API)
lsof -i :3000
kill -9 <PID>

# Or use different ports in .env.local
API_PORT=3001
WEB_PORT=5174
```

### Docker issues

```bash
# Rebuild containers
docker-compose down -v
docker-compose up -d

# View logs
docker-compose logs <service-name>
```

### TypeScript errors

```bash
# Rebuild TypeScript
pnpm run type-check

# Check for configuration issues
cat tsconfig.json
```

## IDE Setup

### VS Code

1. Install ESLint extension: `dbaeumer.vscode-eslint`
2. Install Prettier extension: `esbenp.prettier-vscode`
3. Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### WebStorm / IntelliJ IDEA

1. Go to Settings → Languages & Frameworks → TypeScript
2. Set TypeScript Language Service to enable
3. Go to Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
4. Enable ESLint and set Node interpreter

## Need Help?

- Check existing issues: `git log --oneline`
- Review documentation: `README.md`, `CONTRIBUTING.md`
- See package-specific READMEs in `apps/*/README.md`

## Next Steps

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
2. Explore package-specific documentation in app directories
3. Review the architecture in [README.md](./README.md)
