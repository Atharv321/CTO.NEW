import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/authService';

vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

function renderDashboardPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render dashboard with user information', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
      ],
      currentLocation: { id: 'loc1', name: 'Location 1', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should display welcome message', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText(/welcome to the dashboard/i)).toBeInTheDocument();
    });
  });

  it('should show user profile information', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'manager' as const,
      locations: [
        { id: 'loc1', name: 'Warehouse A', address: '123 Main St' },
      ],
      currentLocation: { id: 'loc1', name: 'Warehouse A', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('manager')).toBeInTheDocument();
    });
  });

  it('should show current location', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Warehouse A', address: '123 Main St' },
      ],
      currentLocation: { id: 'loc1', name: 'Warehouse A', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Warehouse A')).toBeInTheDocument();
    });
  });

  it('should show "Not set" when no current location', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Not set')).toBeInTheDocument();
    });
  });

  it('should display available locations', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Warehouse A', address: '123 Main St' },
        { id: 'loc2', name: 'Warehouse B', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Warehouse A', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Available Locations')).toBeInTheDocument();
      expect(screen.getByText(/Warehouse A - 123 Main St/i)).toBeInTheDocument();
      expect(screen.getByText(/Warehouse B - 456 Oak Ave/i)).toBeInTheDocument();
    });
  });

  it('should show "No locations assigned" when user has no locations', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('No locations assigned')).toBeInTheDocument();
    });
  });

  it('should have sign out button', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  it('should call logout when sign out button is clicked', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.logout.mockResolvedValue();

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    const signOutButton = screen.getByText('Sign out');
    await userEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  it('should display quick actions', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Scan Items')).toBeInTheDocument();
      expect(screen.getByText('View Inventory')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });
  });

  it('should render UserSwitcher when user has multiple locations', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Warehouse A', address: '123 Main St' },
        { id: 'loc2', name: 'Warehouse B', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Warehouse A', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const hasLocationButton = buttons.some(button => 
        button.textContent?.includes('Warehouse A')
      );
      expect(hasLocationButton).toBe(true);
    });
  });

  it('should show user initials in avatar', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });
});
