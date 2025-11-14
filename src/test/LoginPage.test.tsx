import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/authService';

// Mock the authService
vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

// Mock Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: () => <div data-testid="navigate">Navigated</div>,
  };
});

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getStoredTokens.mockReturnValue(null);
  });

  it('should render login form', () => {
    renderLoginPage();

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/create a new account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);

    // HTML5 validation should prevent submission
    expect(screen.getByLabelText(/email address/i)).toBeInvalid();
    expect(screen.getByLabelText(/password/i)).toBeInvalid();
  });

  it('should handle successful login', async () => {
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

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
    });
  });

  it('should handle login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockAuthService.login.mockRejectedValue(new Error(errorMessage));

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrong-password');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'wrong-password' });
  });

  it('should disable form while loading', async () => {
    mockAuthService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password');
    await userEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('should show loading spinner while submitting', async () => {
    mockAuthService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /sign in/i }).querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should navigate to dashboard when already authenticated', async () => {
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

    mockAuthService.getStoredTokens.mockReturnValue(mockTokens);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
  });

  it('should have correct links to other pages', () => {
    renderLoginPage();

    const registerLink = screen.getByText(/create a new account/i);
    const forgotPasswordLink = screen.getByText(/forgot your password/i);

    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('should have remember me checkbox', () => {
    renderLoginPage();

    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    expect(rememberMeCheckbox).toBeInTheDocument();
    expect(rememberMeCheckbox).not.toBeChecked();

    userEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });
});