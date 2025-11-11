# Web Application

Frontend web application built with React and Vite.

## Getting Started

```bash
# Install dependencies
pnpm install

# Development
pnpm run dev

# Build
pnpm run build

# Preview
pnpm run preview

# Tests
pnpm run test

# Type checking
pnpm run type-check
```

## Environment Variables

Configure through `.env` files:

- `VITE_API_URL` - API base URL (default: http://localhost:3000)

## Development

The development server runs on port 5173 with hot module replacement enabled.

API requests to `/api/*` are proxied to the backend API.
