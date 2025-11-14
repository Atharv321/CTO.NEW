# Inventory Management UI Components

This directory contains React components for inventory management functionality, including item listings, stock tracking, audit history, and multi-location views.

## Components

### AuditHistoryTable
Displays stock movement history in a table format with:
- Movement type badges (inbound, outbound, adjustment, etc.)
- Quantity with directional indicators
- Reference IDs and notes
- User who made the adjustment
- Formatted timestamps

**Props:**
- `movements` - Array of StockMovement objects
- `isLoading` - Optional loading state
- `error` - Optional error object

### StockMovementModal
Modal dialog for recording stock movements with:
- Quantity input
- Movement type selection
- Optional notes
- Loading state during submission

**Props:**
- `opened` - Boolean to show/hide modal
- `onClose` - Callback when modal closes
- `onSubmit` - Callback with form data
- `isLoading` - Optional loading state
- `locationId` - Optional pre-selected location

### MultiLocationStockView
Component for viewing stock across multiple locations with:
- Summary cards (total quantity, low stock count, location count)
- Filterable stock table
- Location selection
- Low stock highlighting and filtering

**Props:**
- `itemId` - Item ID to fetch stock for
- `onLocationSelect` - Callback when location is selected
- `selectedLocationId` - Currently selected location
- `isLoading` - Optional loading state

### PermissionGuard
Wrapper component for role-based UI rendering. Shows content only if user has one of the specified roles.

**Props:**
- `roles` - Array of allowed user roles
- `children` - Content to display if authorized
- `fallback` - Optional content to show if not authorized

### ScanningEntry
Placeholder component for barcode/QR code scanning with:
- Manual barcode entry
- Item lookup by barcode
- Scanned item display
- Location context

**Props:**
- `onItemScanned` - Callback when item is scanned
- `locationId` - Optional location context

### SupplierLink
Displays supplier information with cross-links to:
- Supplier details page
- Purchase orders for that supplier

**Props:**
- `supplierId` - ID of supplier to display
- `supplierName` - Optional fallback supplier name

## Usage Examples

### Viewing Audit History
```tsx
import { AuditHistoryTable } from '@/components/inventory/AuditHistoryTable';

<AuditHistoryTable 
  movements={stockMovements} 
  isLoading={isLoading}
  error={error}
/>
```

### Multi-Location Stock View
```tsx
import { MultiLocationStockView } from '@/components/inventory/MultiLocationStockView';

<MultiLocationStockView 
  itemId={itemId}
  onLocationSelect={(locId) => setSelectedLocation(locId)}
  selectedLocationId={selectedLocationId}
/>
```

### Recording Stock Movement
```tsx
import { StockMovementModal } from '@/components/inventory/StockMovementModal';

const [opened, setOpened] = useState(false);

<StockMovementModal
  opened={opened}
  onClose={() => setOpened(false)}
  onSubmit={async (data) => {
    await inventoryService.adjustStock(itemId, locationId, data);
  }}
  isLoading={isSubmitting}
  locationId={currentLocation}
/>
```

### Permission-Based UI
```tsx
import { PermissionGuard } from '@/components/inventory/PermissionGuard';

<PermissionGuard roles={['manager', 'admin']}>
  <button>Edit Item</button>
</PermissionGuard>
```

## Hooks

The `useInventory` hook in `@/hooks/useInventory.ts` provides convenient access to inventory data:

```tsx
import {
  useItems,
  useItem,
  useStockByItem,
  useStockLevel,
  useAdjustStock,
  usePermission
} from '@/hooks/useInventory';

// Get items with pagination
const { data, isLoading } = useItems(page, limit, filters);

// Get single item
const { data: item } = useItem(itemId);

// Adjust stock with optimistic updates
const mutation = useAdjustStock();
await mutation.mutate({ itemId, locationId, data });

// Check permissions
const { isManager, canAdjustStock } = usePermission();
```

## Integration with Services

All components use the `inventoryService` from `@/services/inventoryService.ts` which provides:
- Item CRUD operations
- Stock level management
- Stock movement history
- Category and location lookups
- Supplier information

## Styling

Components use Mantine UI components with the application's theme configuration. All styling is consistent with the design system.

## Testing

Unit tests are located in the `__tests__` directory:
- `AuditHistoryTable.test.tsx` - Table display and data rendering
- More tests can be added as needed

## Future Enhancements

- Barcode scanner device integration
- QR code scanning
- Advanced filtering and search
- Export functionality
- Real-time stock updates via WebSocket
- Batch operations
- Stock transfer workflows
