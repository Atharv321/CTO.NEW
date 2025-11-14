import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/authService';

vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  };
});

function renderProtectedRoute(
  requiredRole?: 'admin' | 'manager' | 'user',
  initialPath: string = '/protected'
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute requiredRole={requiredRole}>
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should show loading spinner when authentication is loading', () => {
    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderProtectedRoute();

    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    mockAuthService.getStoredTokens.mockReturnValue(null);

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
    });
  });

  it('should render protected content when authenticated', async () => {
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

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toHaveTextContent('Protected Content');
    });
  });

  it('should allow user with exact required role', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'manager' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderProtectedRoute('manager');

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toHaveTextContent('Protected Content');
    });
  });

  it('should allow admin to access manager routes', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderProtectedRoute('manager');

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toHaveTextContent('Protected Content');
    });
  });

  it('should allow admin to access user routes', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderProtectedRoute('user');

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toHaveTextContent('Protected Content');
    });
  });

  it('should redirect to unauthorized when user lacks required role', async () => {
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

    renderProtectedRoute('admin');

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toHaveTextContent('/unauthorized');
    });
  });

  it('should redirect to unauthorized when user tries to access manager route', async () => {
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

    renderProtectedRoute('manager');

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toHaveTextContent('/unauthorized');
    });
  });

  it('should allow manager to access user routes', async () => {
    const mockUser = {
      id: '1',
      email: 'manager@example.com',
      name: 'Manager User',
      role: 'manager' as const,
      locations: [],
    };

    mockAuthService.getStoredTokens.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderProtectedRoute('user');

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toHaveTextContent('Protected Content');
    });
  });

  it('should not require role check when requiredRole is not specified', async () => {
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

    renderProtectedRoute(undefined);

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toHaveTextContent('Protected Content');
    });
  });
});
