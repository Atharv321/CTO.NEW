import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { Dashboard } from '../Dashboard';

describe('Dashboard', () => {
  it('renders the welcome title', () => {
    render(<Dashboard />);
    expect(
      screen.getByText('Welcome to Barber Booking System')
    ).toBeInTheDocument();
  });

  it('renders statistics cards', () => {
    render(<Dashboard />);
    expect(screen.getByText("Today's Bookings")).toBeInTheDocument();
    expect(screen.getByText('Total Customers')).toBeInTheDocument();
    expect(screen.getByText('Active Barbers')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders recent activity section', () => {
    render(<Dashboard />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});
