import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupplierDirectory } from './SupplierDirectory';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  MapPin: () => <div data-testid="map-pin-icon">MapPin</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon">MoreHorizontal</div>,
}));

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'admin' },
    hasPermission: () => true
  })
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SupplierDirectory', () => {
  it('renders the supplier directory page', () => {
    renderWithRouter(<SupplierDirectory />);
    
    expect(screen.getByText('Suppliers')).toBeInTheDocument();
    expect(screen.getByText('Manage your supplier directory')).toBeInTheDocument();
  });

  it('displays supplier list with mock data', () => {
    renderWithRouter(<SupplierDirectory />);
    
    expect(screen.getByText('ABC Food Supplies')).toBeInTheDocument();
    expect(screen.getByText('Fresh Produce Co')).toBeInTheDocument();
    expect(screen.getByText('Global Ingredients Ltd')).toBeInTheDocument();
  });

  it('shows search functionality', () => {
    renderWithRouter(<SupplierDirectory />);
    
    const searchInput = screen.getByPlaceholderText('Search suppliers by name or email...');
    expect(searchInput).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: 'ABC' } });
    expect(searchInput).toHaveValue('ABC');
  });

  it('has filter button', () => {
    renderWithRouter(<SupplierDirectory />);
    
    const filterButton = screen.getByText('Filters');
    expect(filterButton).toBeInTheDocument();
  });

  it('has export button', () => {
    renderWithRouter(<SupplierDirectory />);
    
    const exportButton = screen.getByText('Export');
    expect(exportButton).toBeInTheDocument();
  });

  it('has add supplier button', () => {
    renderWithRouter(<SupplierDirectory />);
    
    const addButton = screen.getByText('Add Supplier');
    expect(addButton).toBeInTheDocument();
  });

  it('displays supplier information correctly', () => {
    renderWithRouter(<SupplierDirectory />);
    
    expect(screen.getByText('contact@abcfoods.com')).toBeInTheDocument();
    expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('shows supplier status badges', () => {
    renderWithRouter(<SupplierDirectory />);
    
    // Look for status badges with more specific queries
    const activeStatus = screen.getByText('Active');
    const inactiveStatus = screen.getByText('Inactive');
    
    expect(activeStatus).toBeInTheDocument();
    expect(inactiveStatus).toBeInTheDocument();
  });

  it('displays rating stars', () => {
    renderWithRouter(<SupplierDirectory />);
    
    const starIcons = screen.getAllByTestId('star-icon');
    expect(starIcons.length).toBeGreaterThan(0);
  });
});