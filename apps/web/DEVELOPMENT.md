# Frontend Development Guide

This guide provides detailed information for developing the Barber Booking System frontend application.

## Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start development server**:
   ```bash
   pnpm dev
   ```

3. **Run tests**:
   ```bash
   pnpm test
   ```

4. **Start Storybook**:
   ```bash
   pnpm storybook
   ```

## Development Workflow

### Adding a New Feature

1. **Create component structure**:
   ```
   src/components/MyFeature/
   ├── MyFeature.tsx          # Main component
   ├── MyFeature.test.tsx     # Component tests
   ├── MyFeature.stories.tsx  # Storybook stories
   └── MyFeature.module.css   # Component styles (optional)
   ```

2. **Write tests first** (TDD):
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { render, screen } from '@/test/utils';
   import { MyComponent } from './MyComponent';

   describe('MyComponent', () => {
     it('renders correctly', () => {
       render(<MyComponent />);
       expect(screen.getByText('expected text')).toBeInTheDocument();
     });
   });
   ```

3. **Implement component**:
   ```typescript
   import React from 'react';

   export const MyComponent: React.FC = () => {
     return <div>expected text</div>;
   };
   ```

4. **Create Storybook story**:
   ```typescript
   import type { Meta, StoryObj } from '@storybook/react';
   import { MyComponent } from './MyComponent';

   const meta: Meta<typeof MyComponent> = {
     component: MyComponent,
     title: 'Components/MyComponent',
   };

   export default meta;
   type Story = StoryObj<typeof MyComponent>;

   export const Default: Story = {};
   ```

### Adding a New API Endpoint

1. **Define types** in `src/types/index.ts`:
   ```typescript
   export interface MyData {
     id: string;
     name: string;
   }
   ```

2. **Create service** in `src/services/myService.ts`:
   ```typescript
   import { useFetch, useCreate } from '@/hooks/useApi';

   export function useMyData() {
     return useFetch<MyData[]>('/api/my-data');
   }

   export function useCreateMyData() {
     return useCreate<MyData, Omit<MyData, 'id'>>();
   }
   ```

3. **Use in component**:
   ```typescript
   import { useMyData, useCreateMyData } from '@/services/myService';

   export function MyList() {
     const { data, isLoading } = useMyData();
     const createMutation = useCreateMyData();

     return (
       // Component JSX
     );
   }
   ```

### Managing Global State

Use Zustand for global state:

```typescript
// src/stores/useMyStore.ts
import { create } from 'zustand';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useMyStore = create<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

Use in components:

```typescript
import { useMyStore } from '@/stores/useMyStore';

export function Counter() {
  const { count, increment, decrement } = useMyStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

## Code Style and Conventions

### Component Naming

- Use PascalCase for component names
- Use meaningful names: `UserList` not `List`
- Use descriptive file names matching component names

### Import Organization

```typescript
// 1. React and external libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Mantine components
import { Button, Stack } from '@mantine/core';

// 3. Local imports - utilities
import { formatDate } from '@/lib/date';

// 4. Local imports - components
import { ErrorMessage } from '@/components/ErrorMessage';

// 5. Local imports - hooks
import { useFetch } from '@/hooks/useApi';

// 6. Local imports - stores
import { useAuthStore } from '@/stores/useAuthStore';

// 7. CSS/styles
import styles from './MyComponent.module.css';
```

### TypeScript Best Practices

1. **Avoid `any`** - Use specific types or `unknown` if needed
2. **Use explicit return types** on functions:
   ```typescript
   function getData(): Promise<Data[]> {
     // ...
   }
   ```

3. **Use interfaces for props**:
   ```typescript
   interface MyComponentProps {
     title: string;
     onClick: () => void;
   }

   export const MyComponent: React.FC<MyComponentProps> = ({
     title,
     onClick,
   }) => {
     // ...
   };
   ```

## Testing Guidelines

### Unit Tests

Test isolated functions:

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/date';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toBe('January 15, 2024');
  });
});
```

### Component Tests

Test component behavior:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <Button onClick={onClick}>Click me</Button>
    );
    
    await userEvent.click(getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### API Tests

Test API integration:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test/utils';
import { useFetch } from '@/hooks/useApi';

describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useFetch('/api/data'));
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

## Debugging

### Browser DevTools

1. **React DevTools**:
   - Install: Chrome/Firefox extension
   - Inspect component tree and props
   - Modify state directly for testing

2. **Redux DevTools** (Zustand):
   - Install: Chrome/Firefox extension
   - Track state changes
   - Time travel debugging

### VS Code

1. **Debug in terminal**:
   ```bash
   npm run dev -- --debug
   ```

2. **Set breakpoints** in VS Code
3. **Attach debugger** to running process

### Vitest Debugging

```bash
node --inspect-brk ./node_modules/.bin/vitest
```

Open `chrome://inspect` in Chrome browser.

## Performance Tips

1. **Memoize expensive components**:
   ```typescript
   export const MyComponent = React.memo(({ items }) => {
     return <div>{items.length}</div>;
   });
   ```

2. **Use React Query caching**:
   - Default: 5 minutes stale time
   - Customize in `src/config/env.ts`

3. **Code splitting**:
   ```typescript
   import { lazy } from 'react';
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

4. **Image optimization**:
   - Use WebP format
   - Lazy load images
   - Use appropriate sizes

## Common Issues

### Port Already in Use

Vite will automatically use the next available port.

### Module Not Found

1. Check import paths - use `@/` aliases
2. Check TypeScript config - ensure paths are mapped
3. Clear `node_modules` and reinstall

### Tests Failing

1. Check test setup in `src/test/setup.ts`
2. Use `pnpm test:ui` for visual debugging
3. Check mock implementations

### Build Errors

1. Run `pnpm type-check` to find TypeScript errors
2. Run `pnpm lint` to find code issues
3. Check Vite config if build errors persist

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Mantine Documentation](https://mantine.dev)
- [React Router Documentation](https://reactrouter.com)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vitest Documentation](https://vitest.dev)
- [React Testing Library Guide](https://testing-library.com/docs/react-testing-library/intro/)
- [Storybook Documentation](https://storybook.js.org)

## Getting Help

1. Check existing documentation
2. Search GitHub issues
3. Ask in team chat/discussions
4. Create an issue with reproduction steps
