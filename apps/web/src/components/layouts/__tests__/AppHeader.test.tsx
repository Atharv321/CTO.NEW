import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { AppHeader } from '../AppHeader';
import { useAuthStore } from '@/stores/useAuthStore';

describe('AppHeader', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
    });
  });

  it('renders the header title', () => {
    render(<AppHeader opened={false} onToggle={() => {}} />);
    expect(screen.getByText('Barber Booking')).toBeInTheDocument();
  });

  it('renders login button when not authenticated', () => {
    render(<AppHeader opened={false} onToggle={() => {}} />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders user avatar when authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    });

    render(<AppHeader opened={false} onToggle={() => {}} />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
