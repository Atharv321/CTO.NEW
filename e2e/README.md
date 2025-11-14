# E2E Tests

End-to-end tests verify complete user workflows and system integration using Playwright.

## Setup

Tests are configured in `playwright.config.ts` and run against the application at `http://localhost:3000`.

## Running E2E Tests

```bash
# Run all tests
pnpm run test:e2e

# Run in UI mode (recommended for development)
pnpm run test:e2e:ui

# Debug mode with inspector
pnpm run test:e2e:debug

# Run specific test file
npx playwright test e2e/health.spec.ts

# Run tests matching pattern
npx playwright test --grep "health"
```

## Test Structure

E2E tests are organized by feature/page:

- `health.spec.ts` - Basic health checks and page load
- `api.spec.ts` - API integration scenarios

## Writing E2E Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/path');
    
    // Interact
    await page.fill('input', 'value');
    await page.click('button');
    
    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## Best Practices

- Use semantic selectors (role, text) over CSS selectors
- Wait for elements to be ready
- Test complete user flows
- Keep tests independent
- Use fixtures for setup/teardown

## Reports

After running tests, view results:

```bash
# HTML Report
npx playwright show-report

# Trace for failed tests
npx playwright show-trace test-results/trace.zip
```

## Configuration

See `playwright.config.ts` for:
- Browser targets (Chromium, Firefox, WebKit)
- Timeouts and retries
- Screenshots/videos on failure
- Trace recording

## Debugging

```bash
# Run single test in debug mode
npx playwright test e2e/health.spec.ts --debug

# Stop at breakpoint with inspector
test.only('test name', async ({ page }) => {
  await page.pause();
  // Inspector opens here
});
```

## CI/CD

Tests run in CI after staging deployment. See `.github/workflows/ci.yml`.
