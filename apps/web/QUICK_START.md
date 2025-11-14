# Quick Start Guide

Get the frontend running in 3 minutes!

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Start Development Server

```bash
pnpm dev
```

The app will be available at **http://localhost:5173**

## 3. Verify Everything Works

### Check Tests Pass
```bash
pnpm test
```

### Check Linting Passes
```bash
pnpm lint
```

### Check Type Safety
```bash
pnpm type-check
```

## Next: Explore the App

### View Components in Storybook
```bash
pnpm storybook
```

Visit **http://localhost:6006**

### View Dashboard
1. Open http://localhost:5173
2. You'll see the Barber Booking System dashboard
3. Click navigation items in the sidebar (they're connected to routes)

## Common Tasks

### Write a New Component

1. Create folder: `src/components/MyComponent/`
2. Create files:
   - `MyComponent.tsx` - Component code
   - `MyComponent.test.tsx` - Tests
   - `MyComponent.stories.tsx` - Storybook story

### Add a New Page

1. Create file: `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx`
3. Add to navigation in `src/components/layouts/Navbar.tsx`

### Connect to API

1. Create service: `src/services/myService.ts`
2. Use hooks in components:
   ```typescript
   import { useFetch, useCreate } from '@/hooks/useApi';
   ```

### Manage Global State

1. Create store: `src/stores/useMyStore.ts`
2. Use in components:
   ```typescript
   import { useMyStore } from '@/stores/useMyStore';
   const { state, action } = useMyStore();
   ```

## Environment Variables

1. Copy `.env.example` to `.env`
2. Update values as needed:
   ```bash
   VITE_API_URL=http://localhost:3001
   VITE_ENV=development
   ```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Watch tests |
| `pnpm test:coverage` | Coverage report |
| `pnpm lint` | Check linting |
| `pnpm lint:fix` | Fix linting issues |
| `pnpm type-check` | Check types |
| `pnpm storybook` | Start Storybook |

## Project Structure

```
src/
├── App.tsx                 # Main app component
├── main.tsx                # Entry point
├── components/             # Reusable components
│   └── layouts/           # Layout components
├── pages/                  # Route pages
├── hooks/                  # Custom hooks
├── stores/                 # Global state (Zustand)
├── services/               # API services
├── lib/                    # Utilities
├── config/                 # Configuration
├── theme/                  # Theming
├── types/                  # Type definitions
└── test/                   # Testing utilities
```

## Tech Stack Overview

- **Framework**: React 18 + TypeScript
- **Build**: Vite 5
- **UI**: Mantine 7
- **Routing**: React Router v6
- **State**: Zustand + React Query
- **Testing**: Vitest + React Testing Library
- **Components**: Storybook 7

## Troubleshooting

### Port 5173 in use?
Vite will automatically use the next available port.

### Dependencies not installing?
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors?
```bash
pnpm type-check
```

### Tests failing?
```bash
pnpm test:ui  # Visual debugging
```

## Need More Help?

- **Detailed Docs**: See `README.md`
- **Development Guide**: See `DEVELOPMENT.md`
- **Setup Info**: See `SETUP_COMPLETE.md`

## Let's Build! 🚀

You're all set! Start developing:

```bash
pnpm dev
```

Then open http://localhost:5173 in your browser!
