# Quick Start Guide

Get the Barber Booking UI up and running in minutes.

## Prerequisites

- Node.js 18+ 
- pnpm 8+

## 1. Install Dependencies

```bash
# From the root directory
pnpm install
```

## 2. Configure Environment

Create `.env.local` in `apps/customer-booking-ui`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 3. Start Development Server

```bash
# From the root directory
pnpm dev

# Or from the app directory
cd apps/customer-booking-ui
pnpm dev
```

Visit `http://localhost:3000`

## 4. Verify Setup

- [ ] Landing page with header loads
- [ ] Navigate through booking steps
- [ ] Form validation works (try invalid email)
- [ ] All buttons are clickable and respond

## Project Structure

```
apps/customer-booking-ui/
├── src/
│   ├── app/              # Next.js app directory & layout
│   ├── components/       # React components
│   ├── hooks/            # Custom React Query hooks
│   ├── lib/              # Utilities (API, validation, date)
│   ├── types/            # TypeScript types
│   └── __tests__/        # Tests
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── next.config.js        # Next.js config
└── jest.config.js        # Test config
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Home page entry point |
| `src/components/BookingPage.tsx` | Main booking flow orchestrator |
| `src/hooks/useBookingQueries.ts` | React Query hooks for API calls |
| `src/lib/api-client.ts` | API client wrapper |
| `src/lib/validation.ts` | Zod validation schemas |
| `API_INTEGRATION.md` | API endpoint documentation |
| `DEVELOPMENT.md` | Detailed development guide |

## Development Commands

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Check TypeScript errors
pnpm type-check

# Lint code
pnpm lint
pnpm lint:fix

# Format code
pnpm format

# Run tests
pnpm test
pnpm test:watch
```

## Common Tasks

### Add a New Service

1. Create component in `src/components/`
2. Add component styles as `*.module.css`
3. Export from `src/components/index.ts` (create if needed)
4. Import and use in page/layout

### Modify Validation

Edit `src/lib/validation.ts`:

```tsx
import { z } from 'zod';

export const MySchema = z.object({
  field: z.string().min(1, 'Required'),
});
```

### Make API Calls

1. Add method to `ApiClient` in `src/lib/api-client.ts`
2. Create hook in `src/hooks/useBookingQueries.ts`
3. Use hook in component:

```tsx
const { data, isLoading } = useMyData();
```

### Create a Test

Create `src/__tests__/path/MyComponent.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@components/MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript Errors
```bash
# Check for errors
pnpm type-check

# Clear cache
rm -rf .next
pnpm dev
```

### API Connection Issues
- Check API server is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check API CORS settings
- Check browser DevTools > Network tab for errors

## Next Steps

1. Read [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed guides
2. Check [API_INTEGRATION.md](./API_INTEGRATION.md) for API details
3. Review component code in `src/components/`
4. Run tests: `pnpm test`
5. Start implementing features!

## Getting Help

- Check error messages in terminal
- Look at existing component examples
- Review test files for usage patterns
- Check official docs:
  - [Next.js Docs](https://nextjs.org)
  - [React Query Docs](https://tanstack.com/query)
  - [Zod Docs](https://zod.dev)
