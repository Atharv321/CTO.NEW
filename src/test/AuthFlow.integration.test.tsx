import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { authService } from '../services/authService';

vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

function renderApp(initialPath: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div data-testid="admin-page">Admin Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute requiredRole="manager">
                <div data-testid="manager-page">Manager Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Auth Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login Flow', () => {
    it('should complete full login flow', async () => {
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

      mockAuthService.getStoredTokens.mockReturnValue(null);
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      renderApp('/login');

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
      });
    });

    it('should redirect to dashboard after successful login', async () => {
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

      mockAuthService.getStoredTokens.mockReturnValue(null);
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      renderApp('/login');

      const emailInput = await screen.findByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/welcome to the dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should navigate from login to forgot password', async () => {
      mockAuthService.getStoredTokens.mockReturnValue(null);

      renderApp('/login');

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      const forgotPasswordLink = screen.getByText(/forgot your password/i);
      await userEvent.click(forgotPasswordLink);

      expect(screen.getByText('Reset your password')).toBeInTheDocument();
    });

    it('should complete password reset request flow', async () => {
      mockAuthService.requestPasswordReset.mockResolvedValue();

      renderApp('/forgot-password');

      await waitFor(() => {
        expect(screen.getByText('Reset your password')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });

      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    it('should complete password reset flow', async () => {
      mockAuthService.resetPassword.mockResolvedValue();

      renderApp('/reset-password?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Set new password')).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await userEvent.type(newPasswordInput, 'NewPassword123');
      await userEvent.type(confirmPasswordInput, 'NewPassword123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.resetPassword).toHaveBeenCalledWith({
          token: 'valid-token',
          newPassword: 'NewPassword123',
        });
      });

      expect(screen.getByText('Password reset successful')).toBeInTheDocument();
    });
  });

  describe('Protected Route Flow', () => {
    it('should redirect to login when accessing protected route without auth', async () => {
      mockAuthService.getStoredTokens.mockReturnValue(null);

      renderApp('/dashboard');

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });
    });

    it('should access protected route when authenticated', async () => {
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

      renderApp('/dashboard');

      await waitFor(() => {
        expect(screen.getByText(/welcome to the dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Flow', () => {
    it('should allow admin to access admin routes', async () => {
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

      renderApp('/admin');

      await waitFor(() => {
        expect(screen.getByTestId('admin-page')).toHaveTextContent('Admin Page');
      });
    });

    it('should redirect user to unauthorized when accessing admin routes', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderApp('/admin');

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should allow manager to access manager routes', async () => {
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

      renderApp('/manager');

      await waitFor(() => {
        expect(screen.getByTestId('manager-page')).toHaveTextContent('Manager Page');
      });
    });

    it('should redirect user to unauthorized when accessing manager routes', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderApp('/manager');

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Session Management Flow', () => {
    it('should restore session on app load with valid tokens', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderApp('/dashboard');

      await waitFor(() => {
        expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
        expect(screen.getByText(/welcome to the dashboard/i)).toBeInTheDocument();
      });
    });

    it('should refresh expired token and maintain session', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
      });
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
      });
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderApp('/dashboard');

      await waitFor(() => {
        expect(mockAuthService.refreshToken).toHaveBeenCalled();
        expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
        expect(screen.getByText(/welcome to the dashboard/i)).toBeInTheDocument();
      });
    });

    it('should logout and redirect to login when token refresh fails', async () => {
      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'invalid-refresh-token',
      });
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      renderApp('/dashboard');

      await waitFor(() => {
        expect(mockAuthService.refreshToken).toHaveBeenCalled();
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });
    });
  });

  describe('Logout Flow', () => {
    it('should logout and redirect to login', async () => {
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

      renderApp('/dashboard');

      await waitFor(() => {
        expect(screen.getByText(/welcome to the dashboard/i)).toBeInTheDocument();
      });

      const signOutButton = screen.getByText('Sign out');
      await userEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
      });
    });
  });
});
