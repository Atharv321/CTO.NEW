# Inventory Barcode/QR Code Scanner

A browser-based inventory management system with integrated barcode/QR code scanning capabilities, fallback manual entry, and mobile-friendly interface.

## Features

- **Browser-Based Scanning**: Uses `@zxing/library` for robust barcode and QR code detection
- **Multiple Format Support**: Recognizes CODE_128, QR codes, and other common formats
- **Fallback Manual Entry**: Graceful fallback when camera is unavailable
- **Mobile-Friendly**: Fully responsive design optimized for phones, tablets, and desktops
- **Accessibility**: WCAG 2.1 compliant with proper ARIA labels and keyboard navigation
- **Real-Time Inventory Management**: Add, update, and remove items instantly
- **Item Database**: Pre-configured inventory with automatic lookup
- **Comprehensive Testing**: Integration tests with mocked scanner input

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test:coverage

# UI dashboard
npm test:ui
```

## Architecture

### Components

#### `BarcodeScanner`
The main scanning component that handles:
- Video stream capture from device camera
- Real-time barcode/QR code detection
- Error handling and camera permission management
- Manual entry fallback form
- Accessibility features

**Props:**
- `onScan`: Callback when a barcode is scanned
- `onManualEntry`: Callback for manual barcode entry
- `isActive`: Boolean to control scanning state
- `ariaLabel`: Custom ARIA label for accessibility

#### `InventoryManager`
Main container component managing:
- Item inventory state
- Barcode scanning orchestration
- Item quantity adjustments
- Remove functionality
- Inventory summary display

### Hooks

#### `useBarcodeScan`
Custom React hook for barcode scanning logic:
- Manages camera stream and device access
- Handles `BrowserMultiFormatReader` lifecycle
- Provides scan result callbacks
- Cleans up resources on unmount

## Usage Example

```tsx
import { InventoryManager } from './components/InventoryManager'

export default function App() {
  return <InventoryManager />
}
```

Or use components individually:

```tsx
import { BarcodeScanner } from './components/BarcodeScanner'

function MyComponent() {
  const handleScan = (result) => {
    console.log('Scanned:', result.data, result.format)
  }

  return (
    <BarcodeScanner
      onScan={handleScan}
      ariaLabel="Item scanner"
    />
  )
}
```

## Scanner Database

The scanner comes with a pre-configured inventory database. Supported test barcodes:

| Barcode | Item Name |
|---------|-----------|
| 123456789 | Widget A |
| 987654321 | Widget B |
| 555555555 | Gadget X |
| QR_001 | Premium Tool |

Manual entries for unknown barcodes will display a "not found" message but can be extended by modifying the database in `InventoryManager.tsx`.

## Browser Support

- **Chrome/Edge**: Full support including camera access
- **Firefox**: Full support including camera access
- **Safari**: Full support with iOS 14.5+
- **Mobile Browsers**: Optimized for both Android and iOS

**Required Permissions:**
- Camera access (HTTPS required in production)

## Accessibility

The application implements WCAG 2.1 Level AA standards:

- **Keyboard Navigation**: All controls are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Color Contrast**: Meets WCAG AA contrast requirements
- **Focus Management**: Clear focus indicators
- **Reduced Motion**: Respects `prefers-reduced-motion` preference
- **Touch Targets**: Minimum 44x44px for mobile
- **Form Labels**: Associated labels for all inputs

### Testing for Accessibility

Test keyboard navigation:
```bash
# Tab through all interactive elements
# Verify focus is visible and logical
```

Test with screen readers:
```bash
# Use NVDA (Windows), JAWS, or VoiceOver (macOS/iOS)
# Verify all content is announced properly
```

## Testing

### Test Coverage

The project includes comprehensive test suites:

1. **Integration Tests** (`integration.test.tsx`)
   - End-to-end scanning workflows
   - Manual entry fallback
   - Inventory management operations
   - Error handling

2. **Component Tests** (`BarcodeScanner.test.tsx`)
   - Scanner UI rendering
   - Manual entry form interaction
   - Accessibility features
   - State management

3. **Hook Tests** (`hooks.test.ts`)
   - Camera stream lifecycle
   - Scan result handling
   - Error scenarios
   - Resource cleanup

### Mock Scanner Input

Tests use mocked scanner results to simulate barcode detection:

```typescript
import { createMockScanResult } from './test/mocks'

const mockResult = createMockScanResult('123456789', 'CODE_128')
// Use in tests...
```

### Running Specific Tests

```bash
# Run integration tests only
npm test -- integration.test

# Run with pattern
npm test -- --grep "manual entry"

# Watch specific file
npm test -- --watch BarcodeScanner.test.tsx
```

## API Integration

The system supports API lookup endpoints for barcode validation. To add API support:

1. Create an API service module
2. Update `InventoryManager` to call the API on scan
3. Handle async item lookups

Example:

```typescript
async function lookupBarcode(barcode: string) {
  const response = await fetch(`/api/items/${barcode}`)
  return response.json()
}
```

## Mobile Optimization

### Touch Optimization
- Large touch targets (44x44px minimum)
- Optimized spacing for mobile devices
- Landscape/portrait orientation support

### Performance
- Efficient re-renders using React hooks
- Minimal camera stream operations
- Optimized CSS for mobile

### Responsiveness Breakpoints
- **Desktop**: 1200px and above
- **Tablet**: 768px to 1200px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## Styling

The application uses CSS with:
- CSS variables for theming
- Mobile-first responsive design
- Smooth animations and transitions
- Color-blind friendly palette

### Colors
- Primary: `#4caf50` (Green)
- Error: `#ef5350` (Red)
- Text Primary: `#333`
- Text Secondary: `#666`
- Background: `#fafafa`

## Error Handling

The scanner handles various error scenarios:

- **Camera Permission Denied**: Shows manual entry fallback
- **No Camera Available**: Displays error message with fallback option
- **Invalid Barcode Format**: Graceful handling with user feedback
- **Unknown Barcode**: Notifies user with scanned value
- **Network Errors**: Handled in API integration layer

## Performance Considerations

- Camera stream cleanup on component unmount
- Efficient state updates using React hooks
- Minimal re-renders with proper prop memoization
- Optimized CSS animations with `will-change` hints

## Known Limitations

- Requires HTTPS in production for camera access
- Some older browsers may have limited barcode format support
- Works best with adequate lighting for scanning
- Mobile browsers may have different camera permission UX

## Future Enhancements

- [ ] Batch import/export functionality
- [ ] Cloud sync and storage
- [ ] Advanced analytics and reporting
- [ ] Multi-user support with authentication
- [ ] Offline mode with sync
- [ ] Custom item database configuration
- [ ] Receipt printing
- [ ] Barcode generation

## Contributing

When contributing, ensure:

1. All tests pass: `npm test`
2. Code is properly typed: `npm run type-check`
3. Linting passes: `npm run lint`
4. Accessibility is maintained
5. Mobile responsiveness is tested

## License

[Add your license here]

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test files for usage examples
3. Inspect browser console for error messages
4. Verify camera permissions are granted

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Ensure HTTPS is used (required for camera access)
- Try a different browser
- Verify camera is available and not in use

### Scanning Not Detecting Codes
- Improve lighting conditions
- Ensure barcode/QR code is clear and not damaged
- Try different angles
- Use manual entry as fallback

### Manual Entry Not Appearing
- Ensure camera permission error occurred
- Or click "Use Manual Entry Instead" button
- Check browser console for errors

### Tests Failing
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version is 16+
- Check that all dependencies installed correctly
# Barber Booking System

A comprehensive barber booking platform with customer-facing UI and backend API.

## Project Structure

```
├── apps/
│   └── customer-booking-ui/     # Next.js customer-facing application
├── packages/
│   └── shared/                   # Shared types and utilities
└── package.json                  # Root monorepo package
```

## Technologies

- **Frontend**: Next.js 14, React 18, TypeScript
- **State Management**: TanStack React Query v5
- **Forms**: React Hook Form with Zod validation
- **Styling**: CSS Modules with mobile-responsive design
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

## Future Enhancements

- [ ] Storybook component documentation
- [ ] Playwright E2E tests
- [ ] Payment integration
- [ ] Calendar widget
- [ ] Notification system
- [ ] Booking management page
- [ ] Analytics tracking
- [ ] Multi-language support

## License

Private - All rights reserved
