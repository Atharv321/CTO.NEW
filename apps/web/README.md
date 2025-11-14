# Supplier Portal Web Application

A comprehensive supplier management UI built with React, TypeScript, and Vite.

## Features

### Supplier Management
- **Supplier Directory**: View and search suppliers with advanced filtering
- **Supplier Details**: Comprehensive supplier information with performance metrics
- **Location-based Filtering**: Filter suppliers by geographic location
- **Rating System**: Visual supplier ratings with star display

### Purchase Order Management
- **Order Creation**: Draft, submit, and track purchase orders
- **Status Tracking**: Visual indicators for order status (Draft, Submitted, Approved, Received, etc.)
- **Item Management**: Add/remove items, adjust quantities and pricing
- **Receiving Workflow**: Track received quantities against ordered amounts

### Notifications Center
- **Real-time Updates**: Supplier updates, order status changes, low stock alerts
- **Actionable Notifications**: Direct links to relevant actions from notifications
- **Filtering & Search**: Filter by type and search through notifications
- **Read/Unread Management**: Mark notifications as read or delete them

### Export Functionality
- **Multiple Formats**: Export data as CSV, PDF, or Excel
- **Filtered Exports**: Export only the data matching your filters
- **Supplier & Order Exports**: Separate export options for suppliers and purchase orders

### Role-Based Access Control
- **Permission System**: UI adapts based on user roles (Admin, Manager, Staff)
- **Feature Restrictions**: Hide/disable features based on permissions
- **Secure Navigation**: Role-aware menu system

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI Components**: Custom components with Lucide React icons
- **Styling**: CSS with CSS custom properties
- **Testing**: Vitest with React Testing Library
- **State Management**: React hooks and context
- **API Client**: Custom fetch-based API client

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

5. Build for production:
   ```bash
   pnpm build
   ```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Layout.tsx      # Main app layout with navigation
│   ├── RoleGuard.tsx   # Role-based access control
│   ├── Dashboard.tsx    # Dashboard overview
│   ├── suppliers/       # Supplier-related components
│   ├── purchase-orders/ # Purchase order components
│   └── notifications/  # Notification components
├── hooks/              # Custom React hooks
│   └── useAuth.ts     # Authentication and permissions
├── utils/              # Utility functions
│   └── api.ts         # API client
└── test/               # Test configuration
    └── setup.ts
```

## API Integration

The application integrates with a RESTful API with the following endpoints:

- `GET /api/suppliers` - List suppliers with filtering
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create new supplier
- `PATCH /api/suppliers/:id` - Update supplier

- `GET /api/purchase-orders` - List purchase orders
- `GET /api/purchase-orders/:id` - Get order details
- `POST /api/purchase-orders` - Create new order
- `PATCH /api/purchase-orders/:id/status` - Update order status

- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

## Testing

The application includes comprehensive tests for critical components:

- Supplier Directory tests
- Purchase Order Creation tests  
- Notification Management tests

Run tests with:
```bash
pnpm test
```

## Role Permissions

### Admin
- Full access to all features
- Can create, edit, delete suppliers
- Can approve and manage all purchase orders
- Can manage notifications and exports

### Manager
- Can create and edit suppliers
- Can approve purchase orders
- Can view reports and export data
- Cannot delete suppliers or manage user permissions

### Staff
- Can view supplier information
- Can create purchase orders
- Can receive items
- Limited reporting access

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Ensure all tests pass before submitting
4. Use TypeScript for all new code

## License

MIT License