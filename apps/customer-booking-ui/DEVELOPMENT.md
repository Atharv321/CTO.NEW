# Development Guide

## Project Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd <project-directory>

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

## Development Workflow

### Running the Development Server

```bash
cd apps/customer-booking-ui
pnpm dev
```

### Building for Production

```bash
pnpm build
pnpm start
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
# Check linting issues
pnpm lint

# Fix linting issues automatically
pnpm lint:fix
```

### Formatting

```bash
# Check formatting
pnpm format:check

# Format code
pnpm format
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Code Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # React Query provider
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── BookingForm.tsx
│   ├── BookingForm.module.css
│   └── ...
├── hooks/                 # Custom React hooks
│   └── useBookingQueries.ts
├── lib/                   # Utility functions
│   ├── api-client.ts
│   ├── validation.ts
│   └── date-utils.ts
├── types/                 # TypeScript types
│   └── booking.ts
└── __tests__/            # Test files
    ├── components/
    └── lib/
```

## Creating New Components

### Component Template

```tsx
'use client';

import React from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // Props here
}

export function ComponentName({ /* props */ }: ComponentNameProps) {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
}
```

### Component Styles Template

```css
.container {
  /* Your styles */
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .container {
    /* Mobile styles */
  }
}
```

## Working with React Query

### Using Query Hooks

```tsx
import { useServices } from '@hooks/useBookingQueries';

export function MyComponent() {
  const { data, isLoading, error } = useServices();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

### Creating New Queries

```tsx
export function useMyData() {
  return useQuery<MyDataType, Error>({
    queryKey: ['myData'],
    queryFn: () => apiClient.getMyData(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### Creating Mutations

```tsx
export function useMyMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: (data) => apiClient.postMyData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myData'] });
    },
  });
}
```

## Form Validation

### Using React Hook Form with Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MySchema } from '@lib/validation';

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(MySchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('fieldName')} />
      {errors.fieldName && <span>{errors.fieldName.message}</span>}
    </form>
  );
}
```

### Creating Validation Schemas

```tsx
import { z } from 'zod';

export const MySchema = z.object({
  name: z
    .string()
    .min(2, 'Too short')
    .max(100, 'Too long'),
  email: z
    .string()
    .email('Invalid email'),
});

export type MySchemaType = z.infer<typeof MySchema>;
```

## API Integration

### Making API Calls

```tsx
import { apiClient } from '@lib/api-client';

// Direct calls
const services = await apiClient.getServices();

// Via React Query (recommended)
const { data } = useServices();
```

### Adding New API Endpoints

1. Add method to `ApiClient` class in `src/lib/api-client.ts`
2. Create corresponding hook in `src/hooks/useBookingQueries.ts`
3. Use the hook in components

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests matching a pattern
pnpm test validation

# Run in watch mode
pnpm test:watch
```

### Writing Unit Tests

```tsx
describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});
```

### Writing Validation Tests

```tsx
describe('MySchema', () => {
  it('should validate correct data', () => {
    const result = MySchema.safeParse({ /* valid data */ });
    expect(result.success).toBe(true);
  });
});
```

## Accessibility

### Guidelines

- Use semantic HTML elements (`<button>`, `<form>`, etc.)
- Add `aria-label` to interactive elements without visible labels
- Include `role` attributes for complex widgets
- Ensure keyboard navigation works
- Maintain color contrast ratios
- Test with screen readers

### Example

```tsx
<button
  onClick={handleClick}
  aria-label="Close dialog"
  aria-pressed={isOpen}
>
  Close
</button>
```

## Mobile Responsiveness

### Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Media Query Template

```css
/* Mobile first */
.container {
  /* Mobile styles */
}

@media (min-width: 640px) {
  .container {
    /* Tablet and up */
  }
}

@media (min-width: 1024px) {
  .container {
    /* Desktop and up */
  }
}
```

## Performance Tips

1. **Use React Query**: For efficient data fetching and caching
2. **Lazy Load**: Use `dynamic()` for large components
3. **Image Optimization**: Use Next.js Image component
4. **Code Splitting**: Let Next.js handle automatic splitting
5. **Minimize Bundle**: Tree-shake unused imports

## Debugging

### Using React Developer Tools

1. Install React Developer Tools browser extension
2. Open DevTools (F12)
3. Navigate to React tab
4. Inspect components and props

### Using React Query DevTools

```tsx
// In providers.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Environment Variables

### Development

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Production

Set environment variables in your deployment platform.

## Common Issues

### API Connection Errors

- Ensure API server is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings on API server

### Build Errors

- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `pnpm install`
- Check TypeScript errors: `pnpm type-check`

### Hot Reload Not Working

- Restart dev server
- Check file permissions
- Ensure files are saved

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [React Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev)
