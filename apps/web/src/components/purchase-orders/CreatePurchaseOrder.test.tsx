import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { CreatePurchaseOrder } from './CreatePurchaseOrder';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Save: () => <div data-testid="save-icon">Save</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Trash2: () => <div data-testid="trash2-icon">Trash2</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  DollarSign: () => <div data-testid="dollar-sign-icon">DollarSign</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CreatePurchaseOrder', () => {
  it('renders the create purchase order page', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    expect(screen.getByText('Create Purchase Order')).toBeInTheDocument();
    expect(screen.getByText('Create a new purchase order')).toBeInTheDocument();
  });

  it('has save draft and submit order buttons', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
    expect(screen.getByText('Submit Order')).toBeInTheDocument();
  });

  it('displays order details form', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    expect(screen.getByText('Order Details')).toBeInTheDocument();
    expect(screen.getByText('Supplier *')).toBeInTheDocument();
    expect(screen.getByText('Location *')).toBeInTheDocument();
    expect(screen.getByText('Expected Delivery Date *')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('has supplier selection dropdown', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    const supplierSelect = screen.getByDisplayValue('Select a supplier');
    expect(supplierSelect).toBeInTheDocument();
  });

  it('has location selection dropdown', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    const locationSelect = screen.getByDisplayValue('Select a location');
    expect(locationSelect).toBeInTheDocument();
  });

  it('displays order items section', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    expect(screen.getByText('Order Items')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('shows empty state when no items added', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    expect(screen.getByText('No items added yet. Click "Add Item" to start building your order.')).toBeInTheDocument();
  });

  it('displays order summary', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Items:')).toBeInTheDocument();
    expect(screen.getByText('Total Quantity:')).toBeInTheDocument();
    expect(screen.getByText('Total Amount:')).toBeInTheDocument();
  });

  it('submit button is disabled when form is incomplete', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    const submitButton = screen.getByText('Submit Order');
    expect(submitButton).toBeDisabled();
  });

  it('opens product search when add item is clicked', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    const addItemButton = screen.getByText('Add Item');
    fireEvent.click(addItemButton);
    
    expect(screen.getByText('Search Products')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('has notes textarea', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    const notesTextarea = screen.getByPlaceholderText('Add any notes or special instructions...');
    expect(notesTextarea).toBeInTheDocument();
  });

  it('displays back navigation', () => {
    renderWithRouter(<CreatePurchaseOrder />);
    
    const backButton = screen.getByTestId('arrow-left-icon');
    expect(backButton).toBeInTheDocument();
  });
});