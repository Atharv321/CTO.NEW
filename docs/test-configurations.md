# Test Configurations Reference

This document provides detailed reference for test configurations across the monorepo.

## Vitest Configuration (Backend & Frontend)

### Backend Configuration: `apps/api/vitest.config.ts`

```typescript
{
  test: {
    globals: true,                    // Use global describe/it/expect
    environment: 'node',               // Node.js environment (no DOM)
    coverage: {
      provider: 'v8',                 // Use V8 coverage
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
}
```

### Frontend Configuration: `apps/web/vitest.config.ts`

```typescript
{
  plugins: [react()],                 // React support
  test: {
    globals: true,
    environment: 'jsdom',              // Browser-like environment
    setupFiles: ['./src/test/setup.ts'], // Global test setup
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.tsx',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
}
```

## Jest Configuration (Next.js)

### Configuration: `apps/customer-booking-ui/jest.config.js`

```javascript
{
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThresholds: {
    global: {
      branches: 65,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

## Playwright Configuration

### Configuration: `playwright.config.ts`

```typescript
{
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,        // Fail if test.only() left in code
  retries: process.env.CI ? 2 : 0,     // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined,  // Single worker in CI
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',            // Record trace on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}
```

## Coverage Thresholds

All projects use consistent coverage thresholds:

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| **Lines** | 70% | Ensures most code paths are tested |
| **Functions** | 70% | Ensures functions are exercised |
| **Statements** | 70% | Ensures statements are executed |
| **Branches** | 65% | Slightly lower for complex conditionals |

### Adjusting Thresholds

To change thresholds per project:

**Backend (Vitest)**:
```typescript
// apps/api/vitest.config.ts
coverage: {
  thresholds: {
    lines: 75,
    functions: 75,
    branches: 70,
    statements: 75,
  },
}
```

**Frontend (Vitest)**:
```typescript
// apps/web/vitest.config.ts
coverage: {
  thresholds: {
    lines: 75,
    functions: 75,
    branches: 70,
    statements: 75,
  },
}
```

**Next.js (Jest)**:
```javascript
// apps/customer-booking-ui/jest.config.js
coverageThresholds: {
  global: {
    branches: 70,
    functions: 75,
    lines: 75,
    statements: 75,
  },
}
```

## Test Environment Setup

### Global Setup Files

**Backend** (`apps/api/`):
- No global setup (Node.js native)

**Frontend** (`apps/web/src/test/setup.ts`):
```typescript
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => cleanup());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**Next.js** (`apps/customer-booking-ui/jest.setup.js`):
- Typically includes global test configuration
- Set up by Next.js automatically

## Module Path Mapping

### Vitest (Auto-resolved)
- Uses TypeScript's `tsconfig.json` paths automatically
- Define in `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@app/*": ["apps/*"],
        "@shared/*": ["packages/*"]
      }
    }
  }
  ```

### Jest (Manual mapping)
```javascript
moduleNameMapper: {
  '^@components/(.*)$': '<rootDir>/src/components/$1',
  '^@lib/(.*)$': '<rootDir>/src/lib/$1',
  '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
  '^@types/(.*)$': '<rootDir>/src/types/$1',
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

## Environment Variables in Tests

### Setting Environment Variables

**Vitest**:
```typescript
import { beforeEach } from 'vitest';

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.API_URL = 'http://localhost:3000';
});
```

**Jest**:
```javascript
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
```

**Playwright**:
```typescript
// playwright.config.ts
use: {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
}
```

## Debugging Configuration

### Enable Debug Logging

```bash
# Vitest
DEBUG=* pnpm run test

# Playwright
DEBUG=pw:api npx playwright test

# Jest
NODE_DEBUG=* pnpm run test
```

### Watch Mode Configuration

**Vitest**:
```bash
pnpm run test:watch
```

Options in `vitest.config.ts`:
```typescript
test: {
  watch: true,
  reporters: 'verbose',
}
```

## CI/CD Integration

### GitHub Actions Configuration

Tests run in CI as part of the pipeline:

1. **Lint & Type Check** (before tests)
2. **Unit Tests** (with coverage)
3. **Build**
4. **E2E Tests** (after deployment to staging)

See `.github/workflows/ci.yml` for details.

## Performance Optimization

### Parallel Execution

**Vitest**:
```bash
# Already parallelizes by default
# Control with --threads flag
npx vitest --threads=4
```

**Playwright**:
```typescript
{
  fullyParallel: true,
  workers: 4,
}
```

**Jest**:
```bash
npx jest --maxWorkers=4
```

### Test Filtering

**Run tests by pattern**:
```bash
# Vitest
npx vitest run --grep "pattern"

# Jest
npx jest --testNamePattern="pattern"

# Playwright
npx playwright test --grep "pattern"
```

## Common Configuration Issues

### Issue: Tests Can't Find Modules

**Solution**: Verify module paths in config
```typescript
// vitest.config.ts - resolves from tsconfig.json
// jest.config.js - set moduleNameMapper
// playwright.config.ts - no mapping needed
```

### Issue: Coverage Not Generated

**Solution**: Ensure coverage provider is installed
```bash
pnpm add -D @vitest/coverage-v8
```

### Issue: E2E Tests Timeout

**Solution**: Increase timeout in config
```typescript
// playwright.config.ts
use: {
  navigationTimeout: 30000,
  actionTimeout: 10000,
}
```

## References

- [Vitest Configuration](https://vitest.dev/config/)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
