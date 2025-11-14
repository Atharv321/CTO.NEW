import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserSwitcher } from '../components/UserSwitcher';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/authService';

vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

function renderUserSwitcher() {
  return render(
    <AuthProvider>
      <UserSwitcher />
    </AuthProvider>
  );
}

describe('UserSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should not render when user has no locations', async () => {
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

    const { container } = renderUserSwitcher();

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should not render when user has only one location', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
      ],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { container } = renderUserSwitcher();

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render when user has multiple locations', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
        { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Location 1', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderUserSwitcher();

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });
  });

  it('should show dropdown when button is clicked', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
        { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Location 1', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderUserSwitcher();

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getAllByText('Location 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Location 2').length).toBeGreaterThan(0);
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
  });

  it('should highlight current location', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
        { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Location 1', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderUserSwitcher();

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await userEvent.click(button);

    const location1Elements = screen.getAllByText('Location 1');
    const location1Container = location1Elements
      .map(el => el.closest('button'))
      .find(btn => btn && btn.className.includes('bg-blue-50'));
    
    expect(location1Container).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('should switch location when location is selected', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
        { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Location 1', address: '123 Main St' },
    };

    const updatedUser = {
      ...mockUser,
      currentLocation: { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.switchLocation.mockResolvedValue(updatedUser);

    renderUserSwitcher();

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await userEvent.click(button);

    const location2Buttons = screen.getAllByText('Location 2');
    const location2Button = location2Buttons.find(el => el.closest('button'))?.closest('button');
    
    if (location2Button) {
      await userEvent.click(location2Button);
    }

    await waitFor(() => {
      expect(mockAuthService.switchLocation).toHaveBeenCalledWith('loc2');
    });
  });

  it('should close dropdown after switching location', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
        { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Location 1', address: '123 Main St' },
    };

    const updatedUser = {
      ...mockUser,
      currentLocation: { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.switchLocation.mockResolvedValue(updatedUser);

    renderUserSwitcher();

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(screen.getByText('Locations')).toBeInTheDocument();

    const location2Buttons = screen.getAllByText('Location 2');
    const location2Button = location2Buttons.find(el => el.closest('button'))?.closest('button');
    
    if (location2Button) {
      await userEvent.click(location2Button);
    }

    await waitFor(() => {
      expect(screen.queryByText('Locations')).not.toBeInTheDocument();
    });
  });

  it('should disable button when loading', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
        { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Location 1', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.switchLocation.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderUserSwitcher();

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons[0];
    await userEvent.click(toggleButton);

    const location2Buttons = screen.getAllByText('Location 2');
    const location2Button = location2Buttons.find(el => el.closest('button'))?.closest('button');
    
    if (location2Button) {
      await userEvent.click(location2Button);
    }

    expect(toggleButton).toBeDisabled();
  });

  it('should show loading spinner when switching location', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [
        { id: 'loc1', name: 'Location 1', address: '123 Main St' },
        { id: 'loc2', name: 'Location 2', address: '456 Oak Ave' },
      ],
      currentLocation: { id: 'loc1', name: 'Location 1', address: '123 Main St' },
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.switchLocation.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderUserSwitcher();

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons[0];
    await userEvent.click(toggleButton);

    const location2Buttons = screen.getAllByText('Location 2');
    const location2Button = location2Buttons.find(el => el.closest('button'))?.closest('button');
    
    if (location2Button) {
      await userEvent.click(location2Button);
    }

    expect(toggleButton.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
