# Admin Dashboard Testing Guide

## Overview

This document describes the testing strategy for the Admin Dashboard, including automated UI tests for primary workflows.

## Test Structure

```
src/__tests__/
├── lib/
│   └── admin-api-client.test.ts       # API client tests
├── contexts/
│   └── AdminAuthContext.test.tsx      # Authentication context tests
└── components/
    └── admin/
        └── (UI component tests)
```

## Test Categories

### 1. Unit Tests

#### API Client Tests (`admin-api-client.test.ts`)
Tests for the admin API client covering:
- **Authentication**: Login, logout, token management
- **Services CRUD**: Create, read, update, delete operations
- **Barbers CRUD**: Full CRUD operations
- **Availability Management**: Calendar and slot operations
- **Bookings**: Filtering and status updates

#### Context Tests (`AdminAuthContext.test.tsx`)
Tests for authentication state management:
- Initial authentication state
- Login flow with token persistence
- Logout flow and cleanup
- Token expiration handling

### 2. Integration Tests

Integration tests verify complete workflows:

#### Admin Login Workflow
1. User navigates to `/admin/login`
2. Enters valid credentials
3. Submits form
4. Token is stored in localStorage
5. User is redirected to `/admin`

#### Service Management Workflow
1. Admin logs in
2. Navigates to Services page
3. Creates new service
4. Edits service details
5. Deletes service with confirmation

#### Booking Management Workflow
1. Admin views bookings list
2. Applies filters (status, barber, service)
3. Searches by customer name
4. Updates booking status (optimistic update)
5. Verifies changes persist

### 3. End-to-End Tests

Comprehensive flows testing the entire admin dashboard:

#### Complete Admin Session
1. **Login**: Authenticate with credentials
2. **Dashboard**: View overview metrics
3. **Services**: Create, edit, delete service
4. **Barbers**: Add new barber profile
5. **Availability**: Configure barber schedule
6. **Bookings**: Filter and update booking status
7. **Logout**: Clear session and redirect

## Testing Best Practices

### 1. Mocking Strategy

```typescript
// Mock API client
jest.mock('@/lib/admin-api-client', () => ({
  adminApiClient: {
    login: jest.fn(),
    getServices: jest.fn(),
    createService: jest.fn(),
    // ... other methods
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/admin/services',
}));
```

### 2. Test Data

```typescript
const mockService = {
  id: '1',
  name: 'Haircut',
  description: 'Professional haircut',
  price: 25.00,
  durationMinutes: 30,
};

const mockBooking = {
  bookingId: '1',
  serviceName: 'Haircut',
  barberName: 'John Doe',
  customerName: 'Jane Smith',
  status: 'pending',
  scheduledTime: '2024-01-15T10:00:00Z',
};
```

### 3. Async Testing

```typescript
it('creates a new service', async () => {
  render(<ServicesPage />);
  
  // Wait for initial data load
  await waitFor(() => {
    expect(screen.getByText('Services Management')).toBeInTheDocument();
  });
  
  // Perform action
  fireEvent.click(screen.getByText('Add Service'));
  
  // Verify result
  await waitFor(() => {
    expect(mockCreateService).toHaveBeenCalled();
  });
});
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Admin Tests Only
```bash
npm test admin
```

### Run Specific Test File
```bash
npm test admin-api-client.test
```

### Watch Mode
```bash
npm test:watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| API Client | 90%+ |
| Auth Context | 85%+ |
| UI Components | 80%+ |
| Integration | 75%+ |

## Primary Workflows Tested

### 1. Authentication Flow
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Token persistence across sessions
- ✅ Logout and session cleanup
- ✅ Protected route redirection

### 2. Services Management
- ✅ List all services
- ✅ Create new service
- ✅ Edit existing service
- ✅ Delete service with confirmation
- ✅ Form validation
- ✅ Error handling

### 3. Barbers Management
- ✅ List all barbers
- ✅ Create new barber profile
- ✅ Edit barber details
- ✅ Delete barber with confirmation
- ✅ Avatar and bio support

### 4. Availability Calendar
- ✅ View barber schedules
- ✅ Create availability slots
- ✅ Configure time ranges
- ✅ Toggle slot active/inactive
- ✅ Delete slots

### 5. Bookings Management
- ✅ List all bookings
- ✅ Filter by status
- ✅ Filter by barber
- ✅ Filter by service
- ✅ Search by customer
- ✅ Update booking status
- ✅ Optimistic updates
- ✅ Error rollback

## Accessibility Testing

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys for menus

### Screen Reader Testing
- Proper ARIA labels
- Semantic HTML structure
- Form field associations
- Status announcements

## Performance Testing

### Metrics to Monitor
- Initial page load time
- API response times
- Optimistic update performance
- Component re-render count

### Tools
- React DevTools Profiler
- Lighthouse CI
- Performance API

## Error Handling Tests

### Network Errors
```typescript
it('handles network errors gracefully', async () => {
  mockCreateService.mockRejectedValue({
    message: 'Network error',
  });
  
  // Attempt to create service
  // Verify error toast is shown
  // Verify UI remains functional
});
```

### Validation Errors
```typescript
it('shows validation errors', async () => {
  // Submit form with invalid data
  // Verify inline error messages
  // Verify form cannot be submitted
});
```

### Authentication Errors
```typescript
it('redirects on 401 errors', async () => {
  mockGetServices.mockRejectedValue({
    code: '401',
  });
  
  // Verify redirect to login
  // Verify session cleared
});
```

## Continuous Integration

### Pre-commit Hooks
- Run linter
- Run type checking
- Run unit tests

### CI Pipeline
```yaml
- name: Run Tests
  run: |
    npm install
    npm run test
    npm run test -- --coverage
```

### Test Reports
- Jest HTML Reporter
- Coverage reports to Codecov
- Failed test notifications

## Troubleshooting

### Common Issues

#### Tests Timing Out
- Increase timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Verify mocks are properly configured

#### Chakra UI Rendering Issues
- Ensure all providers are wrapped
- Mock `window.matchMedia`
- Mock `ResizeObserver`

#### State Updates Not Reflected
- Use `waitFor` for async updates
- Wrap updates in `act()`
- Check React Query cache

## Future Enhancements

- [ ] Visual regression testing (Percy, Chromatic)
- [ ] Load testing for high-traffic scenarios
- [ ] A/B testing framework
- [ ] Real user monitoring (RUM)
- [ ] Automated accessibility audits

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [React Query Testing](https://tanstack.com/query/latest/docs/guides/testing)
- [Chakra UI Testing](https://chakra-ui.com/getting-started/with-testing)
