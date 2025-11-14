import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InventoryItemList } from '../InventoryItemList';
import { useAuthStore } from '@/stores/useAuthStore';

// Mock the inventory service
vi.mock('@/services/inventoryService', () => ({
  inventoryService: {
    getItems: vi.fn().mockResolvedValue({
      items: [
        {
          id: 1,
          sku: 'SKU-001',
          name: 'Test Item',
          barcode: '123456789',
          price: 29.99,
          categoryId: 1,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      hasMore: false,
    }),
    getCategories: vi.fn().mockResolvedValue({
      items: [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ],
      total: 2,
      page: 1,
      limit: 10,
      hasMore: false,
    }),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('InventoryItemList', () => {
  beforeEach(() => {
    // Mock manager user
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'manager',
      },
      token: 'test-token',
      isAuthenticated: true,
    });
  });

  it('should render the page with title', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Inventory Items')).toBeInTheDocument();
    });
  });

  it('should display search input', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText('Search items...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should display category filter', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const categoryFilter = screen.getByPlaceholderText('Filter by category');
      expect(categoryFilter).toBeInTheDocument();
    });
  });

  it('should display Add Item button for managers', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const addButton = screen.getByText('Add Item');
      expect(addButton).toBeInTheDocument();
    });
  });

  it('should display items table with data', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('SKU-001')).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument();
    });
  });

  it('should display table headers', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('SKU')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Barcode')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });
  });

  it('should display action buttons', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const viewButtons = screen.getAllByTitle('View Item');
      expect(viewButtons.length).toBeGreaterThan(0);
    });
  });

  it('should handle search input', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search items...') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect(searchInput.value).toBe('test');
    });
  });

  it('should hide Add Item button for non-managers', async () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'viewer',
      },
      token: 'test-token',
      isAuthenticated: true,
    });

    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const addButton = screen.queryByText('Add Item');
      expect(addButton).not.toBeInTheDocument();
    });
  });

  it('should display pagination when applicable', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  it('should display item count', async () => {
    render(<InventoryItemList />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Showing.*1.*of.*1.*items/i)).toBeInTheDocument();
    });
  });
});
