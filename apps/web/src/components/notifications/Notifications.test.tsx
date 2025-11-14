import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Notifications } from './Notifications';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Trash2: () => <div data-testid="trash2-icon">Trash2</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Package: () => <div data-testid="package-icon">Package</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Notifications', () => {
  it('renders the notifications page', () => {
    renderWithRouter(<Notifications />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Manage your supplier and purchase order activity')).toBeInTheDocument();
  });

  it('displays unread count', () => {
    renderWithRouter(<Notifications />);
    
    expect(screen.getByText(/unread notification/)).toBeInTheDocument();
  });

  it('shows mark all read button when there are unread notifications', () => {
    renderWithRouter(<Notifications />);
    
    const markAllReadButton = screen.getByText('Mark All Read');
    expect(markAllReadButton).toBeInTheDocument();
  });

  it('has settings button', () => {
    renderWithRouter(<Notifications />);
    
    const settingsButton = screen.getByText('Settings');
    expect(settingsButton).toBeInTheDocument();
  });

  it('displays search functionality', () => {
    renderWithRouter(<Notifications />);
    
    const searchInput = screen.getByPlaceholderText('Search notifications...');
    expect(searchInput).toBeInTheDocument();
  });

  it('has filter dropdown', () => {
    renderWithRouter(<Notifications />);
    
    const filterSelect = screen.getByDisplayValue('All Notifications');
    expect(filterSelect).toBeInTheDocument();
  });

  it('displays notification list', () => {
    renderWithRouter(<Notifications />);
    
    expect(screen.getByText('Purchase Order Approved')).toBeInTheDocument();
    expect(screen.getByText('Supplier Price Update')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
  });

  it('shows notification messages', () => {
    renderWithRouter(<Notifications />);
    
    expect(screen.getByText('Your purchase order PO-2023-001 has been approved by Manager.')).toBeInTheDocument();
    expect(screen.getByText('ABC Food Supplies has updated prices for tomatoes and lettuce.')).toBeInTheDocument();
  });

  it('displays action buttons for unread notifications', () => {
    renderWithRouter(<Notifications />);
    
    const checkIcons = screen.getAllByTestId('check-icon');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('has delete buttons for notifications', () => {
    renderWithRouter(<Notifications />);
    
    const xIcons = screen.getAllByTestId('x-icon');
    expect(xIcons.length).toBeGreaterThan(0);
  });

  it('shows relative time for notifications', () => {
    renderWithRouter(<Notifications />);
    
    expect(screen.getByText(/minutes ago/)).toBeInTheDocument();
    expect(screen.getByText(/hours ago/)).toBeInTheDocument();
  });

  it('displays notification type icons', () => {
    renderWithRouter(<Notifications />);
    
    const packageIcon = screen.getByTestId('package-icon');
    const userIcon = screen.getByTestId('user-icon');
    const alertIcon = screen.getByTestId('alert-triangle-icon');
    
    expect(packageIcon).toBeInTheDocument();
    expect(userIcon).toBeInTheDocument();
    expect(alertIcon).toBeInTheDocument();
  });

  it('shows action buttons for specific notification types', () => {
    renderWithRouter(<Notifications />);
    
    expect(screen.getByText('Create Purchase Order')).toBeInTheDocument();
    expect(screen.getByText('View Supplier')).toBeInTheDocument();
    expect(screen.getByText('View Order')).toBeInTheDocument();
  });

  it('filters notifications by type', () => {
    renderWithRouter(<Notifications />);
    
    const filterSelect = screen.getByDisplayValue('All Notifications');
    fireEvent.change(filterSelect, { target: { value: 'order_status_change' } });
    
    expect(filterSelect).toHaveValue('order_status_change');
  });

  it('searches notifications', () => {
    renderWithRouter(<Notifications />);
    
    const searchInput = screen.getByPlaceholderText('Search notifications...');
    fireEvent.change(searchInput, { target: { value: 'Approved' } });
    
    expect(searchInput).toHaveValue('Approved');
  });
});