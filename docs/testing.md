# Testing Guide

This document provides a comprehensive guide to the testing strategy and best practices for this monorepo.

## Overview

The project uses a multi-layered testing approach:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test components/modules working together
- **E2E Tests**: Test complete user workflows across the application
- **Coverage Thresholds**: Enforce minimum coverage standards

## Technology Stack

- **Backend**: Vitest for unit and integration tests
- **Frontend**: Vitest with React Testing Library for component tests
- **E2E**: Playwright for end-to-end testing

## Running Tests

### Run All Tests

```bash
# Unit tests only
pnpm run test:unit

# E2E tests only
pnpm run test:e2e

# All tests (unit + E2E)
pnpm run test

# With coverage report
pnpm run test:coverage
```

### Run Tests by Scope

```bash
# API tests
cd apps/api
pnpm run test

# Web app tests
cd apps/web
pnpm run test

# Customer booking UI tests
cd apps/customer-booking-ui
pnpm run test
```

### Watch Mode

```bash
# Watch mode for development
cd apps/api
pnpm run test:watch

# UI mode for Vitest
cd apps/web
pnpm run test:watch
```

### E2E Tests

```bash
# Run all E2E tests
pnpm run test:e2e

# Run tests in UI mode (interactive)
pnpm run test:e2e:ui

# Debug mode
pnpm run test:e2e:debug

# Run specific test file
pnpm run test:e2e e2e/health.spec.ts
```

## Project Structure

### Test Files Location

```
apps/
├── api/
│   └── src/
│       └── test/
│           ├── fixtures/         # Test data fixtures
│           ├── utils.ts          # Test utilities
│           └── *.test.ts         # Unit/integration tests
├── web/
│   └── src/
│       └── test/
│           ├── fixtures/         # Component prop fixtures
│           ├── utils.tsx         # React testing utilities
│           └── *.test.tsx        # Component tests
└── customer-booking-ui/
    └── src/
        └── __tests__/            # Jest test files
e2e/
├── health.spec.ts               # Health check E2E tests
├── api.spec.ts                  # API integration E2E tests
└── *.spec.ts                    # Other E2E test scenarios
```

## Coverage Thresholds

The project enforces the following coverage thresholds:

| Metric | Threshold |
|--------|-----------|
| Lines | 70% |
| Functions | 70% |
| Branches | 65% |
| Statements | 70% |

View coverage reports:

```bash
# After running tests with coverage
open apps/api/coverage/index.html
open apps/web/coverage/index.html
```

## Writing Unit Tests

### Backend (Vitest)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockUser } from './fixtures/user.fixture';

describe('User Service', () => {
  let user: any;

  beforeEach(() => {
    user = createMockUser();
  });

  it('should create a user', () => {
    expect(user).toBeDefined();
    expect(user.email).toBe('john@example.com');
  });

  it('should allow custom user data', () => {
    const customUser = createMockUser({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(customUser.name).toBe('Jane Doe');
  });
});
```

### Frontend (Vitest + React Testing Library)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Writing Integration Tests

Integration tests verify that multiple components or services work together:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestSuite } from './utils';

describe('User API Integration', () => {
  let db: any;

  beforeEach(async () => {
    db = await setupTestDB();
  });

  it('should create and retrieve a user', async () => {
    const user = await db.users.create(mockUser);
    const retrieved = await db.users.findById(user.id);
    
    expect(retrieved.email).toBe(mockUser.email);
  });
});
```

## Writing E2E Tests

E2E tests verify complete user workflows:

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Booking Flow', () => {
  test('should complete booking from start to finish', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking');
    
    // Fill form
    await page.fill('input[name="service"]', 'Haircut');
    await page.fill('input[name="date"]', '2024-01-20');
    
    // Submit
    await page.click('button:has-text("Book Now")');
    
    // Verify confirmation
    await expect(page).toHaveURL(/.*confirmation/);
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });
});
```

## Test Fixtures

Fixtures provide consistent mock data for tests:

### Using API Fixtures

```typescript
import { createMockUser, createMockBooking } from './fixtures';

const user = createMockUser();
const booking = createMockBooking({
  userId: user.id,
  status: 'pending',
});
```

### Using Component Fixtures

```typescript
import { createMockProps } from './fixtures/component.fixture';

const buttonProps = createMockProps('button', {
  label: 'Custom Label',
});
```

## Best Practices

### ✅ Do

- Write tests that verify behavior, not implementation
- Use descriptive test names that explain what is being tested
- Keep tests focused and isolated
- Use fixtures for consistent test data
- Test error cases and edge conditions
- Aim for meaningful coverage (not just high percentages)
- Use beforeEach/afterEach for setup and cleanup
- Make assertions specific and clear

### ❌ Don't

- Write tests that depend on other tests
- Mock too early or too much (test real behavior when possible)
- Use hardcoded values instead of fixtures
- Ignore flaky tests
- Create tests that are difficult to understand
- Mock external APIs without proper documentation
- Write overly complex test setups

## Debugging Tests

### Debug Vitest Tests

```bash
# Run in debug mode with Node inspector
cd apps/api
node --inspect-brk ./node_modules/vitest/vitest.mjs

# Then open chrome://inspect in Chrome
```

### Debug Playwright Tests

```bash
# Interactive debugging
pnpm run test:e2e:debug

# Generates trace file for inspection
pnpm run test:e2e

# Open trace viewer
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

Tests run automatically in CI/CD pipeline:

1. Unit tests must pass before build
2. Coverage thresholds enforced
3. E2E tests run after deployment to staging
4. Failed tests block deployment

See `.github/workflows/ci.yml` for details.

## Troubleshooting

### Tests timeout
- Increase timeout in test config if needed
- Check for unresolved promises
- Use `vi.useFakeTimers()` for time-related tests

### Coverage not meeting threshold
- Add tests for uncovered branches
- Check for untestable code patterns
- Update threshold if appropriate

### E2E tests flaky
- Add explicit waits for dynamic elements
- Use retry logic for network requests
- Check for race conditions

### Module not found errors
- Verify paths in vitest.config.ts
- Check Jest/Vitest moduleNameMapper configuration
- Ensure imports match export structure

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://testingjavascript.com)

## Questions?

For questions or issues with testing setup, please:
1. Check existing test examples in the codebase
2. Review test configuration files
3. Create an issue with detailed reproduction steps
