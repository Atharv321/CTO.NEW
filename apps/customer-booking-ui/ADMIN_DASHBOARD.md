# Admin Dashboard Documentation

## Overview

The Admin Dashboard provides a comprehensive interface for managing the barber booking system. It includes protected authentication, CRUD operations for services and barbers, availability calendar management, and booking oversight with filtering capabilities.

## Features

### 1. Authentication
- **Protected Routes**: All admin pages require authentication
- **JWT Token Management**: Secure token-based authentication with auto-refresh
- **Session Persistence**: Tokens stored in localStorage for persistent sessions
- **Automatic Redirect**: Unauthenticated users redirected to login

### 2. Services Management
- **List Services**: View all available services with details
- **Create Service**: Add new services with name, description, price, and duration
- **Edit Service**: Update existing service details
- **Delete Service**: Remove services with confirmation dialog
- **Optimistic Updates**: Instant UI feedback while API requests process

### 3. Barbers Management
- **List Barbers**: View all barbers with avatars and ratings
- **Create Barber**: Add new barbers with profile information
- **Edit Barber**: Update barber details including bio and rating
- **Delete Barber**: Remove barbers with confirmation
- **Profile Display**: Shows avatar, rating badge, and bio

### 4. Availability Calendar Management
- **Weekly Schedule**: Manage barber availability by day of week
- **Time Slots**: Configure start/end times for availability
- **Active/Inactive Toggle**: Enable or disable specific time slots
- **Per-Barber Configuration**: Separate calendars for each barber
- **Tab Navigation**: Easy switching between barber schedules

### 5. Bookings Management
- **List Bookings**: View all bookings with customer and service details
- **Status Filtering**: Filter by pending, confirmed, cancelled, or completed
- **Barber/Service Filters**: Filter bookings by specific barber or service
- **Date Range Filter**: View bookings within specific date ranges
- **Search**: Find bookings by customer name or email
- **Status Updates**: Change booking status with optimistic updates
- **Bulk Actions**: Multiple status change options per booking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: Chakra UI
- **State Management**: TanStack React Query v5
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **HTTP Client**: Axios
- **Icons**: React Icons + Chakra UI Icons

## File Structure

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx              # Admin-specific layout with providers
│       ├── login/
│       │   └── page.tsx            # Login page
│       ├── page.tsx                # Dashboard overview
│       ├── services/
│       │   └── page.tsx            # Services management
│       ├── barbers/
│       │   └── page.tsx            # Barbers management
│       ├── availability/
│       │   └── page.tsx            # Availability calendar
│       └── bookings/
│           └── page.tsx            # Bookings with filters
├── components/
│   └── admin/
│       ├── AdminLayout.tsx         # Main admin layout wrapper
│       ├── AdminHeader.tsx         # Header with user menu
│       ├── AdminSidebar.tsx        # Navigation sidebar
│       ├── ProtectedRoute.tsx      # Auth protection HOC
│       └── index.ts                # Component exports
├── contexts/
│   └── AdminAuthContext.tsx        # Authentication context
├── lib/
│   └── admin-api-client.ts         # Admin API client
├── types/
│   └── admin.ts                    # TypeScript types
└── __tests__/
    ├── components/
    │   └── admin/
    │       ├── LoginPage.test.tsx
    │       ├── ServicesPage.test.tsx
    │       └── BookingsPage.test.tsx
    └── integration/
        └── admin-workflow.test.tsx
```

## Usage

### Accessing the Admin Dashboard

1. Navigate to `/admin/login`
2. Enter admin credentials
3. Upon successful login, redirected to `/admin`

### Default Test Credentials

For development/testing (configure in your API):
```
Email: admin@example.com
Password: password123
```

### Navigation

- **Dashboard**: Overview with key metrics
- **Services**: Manage service offerings
- **Barbers**: Manage staff profiles
- **Availability**: Configure weekly schedules
- **Bookings**: View and manage customer bookings

## API Integration

The admin dashboard expects the following API endpoints:

### Authentication
- `POST /api/admin/auth/login` - Login with credentials
- `POST /api/admin/auth/logout` - Logout current session
- `GET /api/admin/auth/me` - Get current user details

### Services
- `GET /api/admin/services` - List all services
- `GET /api/admin/services/:id` - Get service details
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service

### Barbers
- `GET /api/admin/barbers` - List all barbers
- `GET /api/admin/barbers/:id` - Get barber details
- `POST /api/admin/barbers` - Create barber
- `PUT /api/admin/barbers/:id` - Update barber
- `DELETE /api/admin/barbers/:id` - Delete barber

### Availability
- `GET /api/admin/availability` - Get all calendars
- `GET /api/admin/availability/:barberId` - Get barber calendar
- `PUT /api/admin/availability/:barberId` - Update calendar
- `POST /api/admin/availability/:barberId/slots` - Create slot
- `DELETE /api/admin/availability/:barberId/slots/:slotId` - Delete slot

### Bookings
- `GET /api/admin/bookings` - List bookings (with filters)
- `GET /api/admin/bookings/:id` - Get booking details
- `PATCH /api/admin/bookings/:id/status` - Update booking status

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Admin Tests Only
```bash
npm test admin
```

### Watch Mode
```bash
npm test:watch
```

### Test Coverage
- Login page authentication
- Services CRUD operations
- Barbers CRUD operations
- Bookings filtering and status updates
- Full admin workflow integration tests

## Features in Detail

### Optimistic Updates

The dashboard implements optimistic updates for better UX:
- **Booking Status**: Status changes show immediately, rolled back on error
- **Service/Barber Edits**: UI updates before server confirmation

### Error Handling

- **Network Errors**: Toast notifications with error details
- **Validation Errors**: Inline form validation with Zod
- **Authentication Errors**: Automatic redirect to login
- **API Errors**: User-friendly error messages

### Responsive Design

- **Desktop**: Full multi-column layout with sidebar
- **Tablet**: Collapsible sidebar, adjusted grid layouts
- **Mobile**: Hamburger menu, stacked layouts, touch-optimized

### Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG AA compliant

## Security Considerations

1. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Token Expiry**: Check token expiration before requests
3. **401 Handling**: Auto-logout on authentication failures
4. **HTTPS**: Required for production deployment
5. **CORS**: Configure API to allow admin domain

## Performance Optimizations

1. **React Query Caching**: 5-minute stale time for data
2. **Optimistic Updates**: Instant UI feedback
3. **Code Splitting**: Lazy-loaded routes
4. **Memoization**: Prevent unnecessary re-renders

## Troubleshooting

### Login Issues
- Check API endpoint configuration
- Verify credentials are correct
- Check browser console for errors
- Ensure CORS is configured properly

### Data Not Loading
- Verify authentication token is valid
- Check API endpoints are accessible
- Review network tab for failed requests

### Tests Failing
- Run `npm install` to ensure dependencies
- Clear Jest cache: `npm test -- --clearCache`
- Check mock implementations match API client

## Future Enhancements

- [ ] Multi-factor authentication
- [ ] Role-based permissions (admin vs super_admin)
- [ ] Audit logs for all actions
- [ ] Dashboard analytics with charts
- [ ] Bulk import/export functionality
- [ ] Email notifications for bookings
- [ ] Real-time updates via WebSockets
- [ ] Dark mode support
- [ ] Mobile app version

## Contributing

When adding new admin features:

1. Add API client methods in `admin-api-client.ts`
2. Create types in `admin.ts`
3. Build UI page in `app/admin/[feature]/page.tsx`
4. Add navigation link in `AdminSidebar.tsx`
5. Write comprehensive tests
6. Update this documentation

## Support

For issues or questions:
1. Check this documentation
2. Review test files for usage examples
3. Check browser console for errors
4. Review API logs for backend issues
