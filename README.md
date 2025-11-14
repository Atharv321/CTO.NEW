# Barber Booking System

A comprehensive barber booking platform with customer-facing UI, web application, and backend API.

## Project Structure

```
├── apps/
│   ├── customer-booking-ui/     # Next.js customer-facing application
│   └── web/                     # Vite + React main web application
├── packages/
│   └── shared/                   # Shared types and utilities (future)
└── package.json                  # Root monorepo package
```

## Technologies

### Customer Booking UI
- **Framework**: Next.js 14, React 18, TypeScript
- **State Management**: TanStack React Query v5
- **Forms**: React Hook Form with Zod validation
- **Styling**: CSS Modules with mobile-responsive design
- **API Client**: Axios

### Web Application
- **Framework**: Vite 5 + React 18 + TypeScript
- **UI Library**: Mantine UI 7
- **State Management**: Zustand + TanStack React Query v5
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library
- **Documentation**: Storybook 7
- **API Client**: Axios

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build
pnpm build

# Type checking
pnpm type-check
```

## Features

### Customer Booking UI

- **Multi-step booking flow**:
  1. Service selection with pricing and duration
  2. Barber and date selection
  3. Time slot picker with real-time availability
  4. Customer details form with validation
  5. Booking confirmation screen

- **State Management**:
  - React Query for efficient caching of services, barbers, and time slots
  - Automatic cache invalidation on booking creation
  - Optimized re-fetching strategies

- **Validation**:
  - Client-side form validation with Zod schema
  - Email format validation
  - Phone number validation
  - Real-time error feedback

- **Accessibility**:
  - ARIA labels and descriptions
  - Keyboard navigation support
  - Focus management
  - Semantic HTML elements
  - Color contrast compliance
  - Screen reader compatibility

- **Mobile Responsive**:
  - Responsive grid layouts
  - Touch-friendly buttons and inputs
  - Optimized font sizes for mobile
  - Proper viewport meta tag

- **Error Handling**:
  - Loading states for all data fetches
  - User-friendly error messages
  - API error handling with proper feedback
  - Form submission error display

## Environment Variables

Create `.env.local` file in the `apps/customer-booking-ui` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Component Structure

### Main Components

- **Layout**: Application header and footer
- **BookingPage**: Multi-step booking orchestrator
- **ServiceSelection**: Service browsing and selection
- **BarberDateSelection**: Barber and date picker
- **TimeSlotSelection**: Available time slots
- **BookingForm**: Customer details form with validation
- **BookingConfirmation**: Success/pending confirmation screen

### Hooks

- `useServices()`: Fetch all services
- `useService(id)`: Fetch single service
- `useBarbers()`: Fetch all barbers
- `useBarber(id)`: Fetch single barber
- `useAvailableSlots(barberId, date)`: Fetch slots for barber/date
- `useCreateBooking()`: Create new booking
- `useBooking(id)`: Fetch booking details
- `useCancelBooking()`: Cancel booking

## API Endpoints

The application expects the following API endpoints:

```
GET    /api/services              # Get all services
GET    /api/services/:id          # Get service details
GET    /api/barbers               # Get all barbers
GET    /api/barbers/:id           # Get barber details
GET    /api/time-slots/available  # Get available slots (params: barberId, date)
POST   /api/bookings              # Create booking
GET    /api/bookings/:id          # Get booking details
DELETE /api/bookings/:id          # Cancel booking
```

## Types

All TypeScript types are defined in `src/types/booking.ts`:

- `Service`: Barber service information
- `Barber`: Barber professional information
- `TimeSlot`: Available booking slots
- `BookingFormData`: Customer booking form data
- `BookingConfirmation`: Booking confirmation response
- `ApiError`: API error structure

## Styling

The application uses CSS Modules for component styling with:

- CSS custom properties for theming
- Mobile-first responsive design
- Accessibility-focused styling
- Focus states for keyboard navigation

## Best Practices

1. **Accessibility**: All interactive elements are keyboard accessible
2. **Performance**: React Query caching reduces API calls
3. **Error Handling**: Comprehensive error states and user feedback
4. **Validation**: Zod schemas ensure data integrity
5. **Mobile First**: Responsive design starts from mobile screens
6. **Type Safety**: Full TypeScript coverage

## Web Application

The main web application is located at `apps/web/` and built with Vite for optimal development experience.

### Features

- **Modern Stack**: Vite 5 for lightning-fast HMR and optimal build performance
- **UI Components**: Mantine UI 7 with comprehensive component library
- **State Management**: Hybrid approach with Zustand for global state and React Query for server state
- **Routing**: React Router v6 for client-side navigation
- **Type Safety**: Full TypeScript support with strict mode
- **Testing**: Vitest + React Testing Library for unit and integration tests
- **Documentation**: Storybook 7 for component development and documentation
- **Code Quality**: ESLint + Prettier for consistent code style

### Quick Start

```bash
cd apps/web

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build

# Run Storybook
npm run storybook
```

### Architecture

- **Path Aliases**: Configured for clean imports (`@/`, `@components/`, `@lib/`, etc.)
- **API Client**: Centralized Axios instance with interceptors
- **Theme System**: Customizable Mantine theme
- **Environment Config**: `.env` based configuration with TypeScript support

For detailed documentation, see [apps/web/README.md](apps/web/README.md)

## Future Enhancements

- [ ] Playwright E2E tests
- [ ] Payment integration
- [ ] Calendar widget
- [ ] Notification system
- [ ] Booking management page
- [ ] Analytics tracking
- [ ] Multi-language support
- [ ] Mobile applications (React Native)

## License

Private - All rights reserved
