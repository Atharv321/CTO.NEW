import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

// Mock the authService
vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

// Test component to use the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, error, clearError } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      {error && <div data-testid="error">{error}</div>}
      <button
        onClick={() => login('test@example.com', 'password')}
        data-testid="login-button"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
      <button onClick={clearError} data-testid="clear-error-button">
        Clear Error
      </button>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial loading state', async () => {
    mockAuthService.getStoredTokens.mockReturnValue(null);

    renderWithProviders(<TestComponent />);

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });

  it('should authenticate user successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      tokens: mockTokens,
    });
    mockAuthService.getStoredTokens.mockReturnValue(null);

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    const loginButton = screen.getByTestId('login-button');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
  });

  it('should handle login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockAuthService.login.mockRejectedValue(new Error(errorMessage));
    mockAuthService.getStoredTokens.mockReturnValue(null);

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    const loginButton = screen.getByTestId('login-button');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });

  it('should clear error when clearError is called', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Login failed'));
    mockAuthService.getStoredTokens.mockReturnValue(null);

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    const loginButton = screen.getByTestId('login-button');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    const clearErrorButton = screen.getByTestId('clear-error-button');
    await userEvent.click(clearErrorButton);

    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should logout user successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      tokens: mockTokens,
    });
    mockAuthService.logout.mockResolvedValue();
    mockAuthService.getStoredTokens.mockReturnValue(null);

    renderWithProviders(<TestComponent />);

    // First login
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    const loginButton = screen.getByTestId('login-button');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    // Then logout
    const logoutButton = screen.getByTestId('logout-button');
    await userEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should initialize with existing valid session', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getStoredTokens.mockReturnValue(mockTokens);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  });

  it('should handle expired token refresh', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };
    const oldTokens = {
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
    };
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    mockAuthService.getStoredTokens.mockReturnValue(oldTokens);
    mockAuthService.isTokenExpired.mockReturnValue(true);
    mockAuthService.refreshToken.mockResolvedValue(newTokens);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    expect(mockAuthService.refreshToken).toHaveBeenCalled();
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});