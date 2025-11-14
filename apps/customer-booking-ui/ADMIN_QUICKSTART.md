# Admin Dashboard Quick Start Guide

## Installation

The admin dashboard dependencies are already included. If you need to reinstall:

```bash
npm install
```

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Access the Admin Dashboard

Navigate to: `http://localhost:3000/admin/login`

### 3. Login

Use your admin credentials (configure these in your API):
```
Email: admin@example.com
Password: password123
```

## Project Structure

```
apps/customer-booking-ui/
├── src/
│   ├── app/
│   │   └── admin/                    # Admin routes
│   │       ├── layout.tsx            # Admin layout with providers
│   │       ├── login/page.tsx        # Login page
│   │       ├── page.tsx              # Dashboard overview
│   │       ├── services/page.tsx     # Services management
│   │       ├── barbers/page.tsx      # Barbers management
│   │       ├── availability/page.tsx # Availability calendar
│   │       └── bookings/page.tsx     # Bookings with filters
│   ├── components/
│   │   └── admin/                    # Admin components
│   ├── contexts/
│   │   └── AdminAuthContext.tsx      # Auth state management
│   ├── lib/
│   │   └── admin-api-client.ts       # API client
│   └── types/
│       └── admin.ts                  # TypeScript types
└── __tests__/                        # Test files
```

## Key Features

### 🔐 Authentication
- Protected routes with JWT tokens
- Auto-redirect for unauthenticated users
- Session persistence via localStorage

### 📋 Services Management
- Create, edit, and delete services
- Configure pricing and duration
- Real-time validation

### 👥 Barbers Management
- Manage barber profiles
- Set ratings and bios
- Avatar support

### 📅 Availability Calendar
- Configure weekly schedules
- Set availability by day and time
- Enable/disable time slots

### 📖 Bookings Management
- View all bookings
- Filter by status, barber, service
- Search by customer details
- Update booking status with optimistic updates

## API Configuration

Set your API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Required API Endpoints

Your backend API must implement these endpoints:

### Authentication
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

### Services
- `GET /api/admin/services`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`

### Barbers
- `GET /api/admin/barbers`
- `POST /api/admin/barbers`
- `PUT /api/admin/barbers/:id`
- `DELETE /api/admin/barbers/:id`

### Availability
- `GET /api/admin/availability`
- `GET /api/admin/availability/:barberId`
- `POST /api/admin/availability/:barberId/slots`
- `DELETE /api/admin/availability/:barberId/slots/:slotId`

### Bookings
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/:id/status`

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```

## Common Tasks

### Adding a New Admin Page

1. Create page in `src/app/admin/[page]/page.tsx`
2. Add route to sidebar in `src/components/admin/AdminSidebar.tsx`
3. Add necessary API methods to `admin-api-client.ts`
4. Add types to `src/types/admin.ts`
5. Write tests

### Customizing Styles

The dashboard uses Chakra UI. Customize theme in `src/app/admin/layout.tsx`:

```typescript
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      500: '#3182ce',
    },
  },
});

export default function AdminRootLayout({ children }) {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  );
}
```

## Troubleshooting

### "Not authenticated" error
- Check if admin token is valid
- Verify API endpoint is accessible
- Check browser console for errors

### Styles not loading
- Ensure Chakra UI is properly installed
- Check that providers are wrapped correctly

### Tests failing
- Run `npm install` to ensure dependencies
- Clear Jest cache: `npm test -- --clearCache`

## Next Steps

1. **Configure your API**: Implement the required endpoints
2. **Customize branding**: Update colors and logos
3. **Add features**: Extend with reports, analytics, etc.
4. **Deploy**: Build and deploy to production

## Resources

- [Full Documentation](./ADMIN_DASHBOARD.md)
- [Testing Guide](./ADMIN_TESTING.md)
- [API Integration](./API_INTEGRATION.md)

## Support

For issues or questions:
- Check documentation
- Review test files for examples
- Inspect browser console for errors
