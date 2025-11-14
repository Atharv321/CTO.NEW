import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { authService } from '../services/authService';

vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render forgot password form', () => {
    renderForgotPasswordPage();

    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('should show validation error for empty email', async () => {
    renderForgotPasswordPage();

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await userEvent.click(submitButton);

    expect(screen.getByLabelText(/email address/i)).toBeInvalid();
  });

  it('should handle successful password reset request', async () => {
    mockAuthService.requestPasswordReset.mockResolvedValue();

    renderForgotPasswordPage();

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
    expect(screen.getByText(/we've sent a password reset link to/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should handle password reset request error', async () => {
    const errorMessage = 'Email not found';
    mockAuthService.requestPasswordReset.mockRejectedValue(new Error(errorMessage));

    renderForgotPasswordPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await userEvent.type(emailInput, 'nonexistent@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'nonexistent@example.com',
    });
  });

  it('should disable form while loading', async () => {
    mockAuthService.requestPasswordReset.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderForgotPasswordPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
  });

  it('should show loading spinner while submitting', async () => {
    mockAuthService.requestPasswordReset.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderForgotPasswordPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should have link back to login on success page', async () => {
    mockAuthService.requestPasswordReset.mockResolvedValue();

    renderForgotPasswordPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    const backToLoginLink = screen.getByText(/back to login/i);
    expect(backToLoginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should have correct link to login page', () => {
    renderForgotPasswordPage();

    const backToLoginLink = screen.getByText(/back to login/i);
    expect(backToLoginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should show check icon on success', async () => {
    mockAuthService.requestPasswordReset.mockResolvedValue();

    renderForgotPasswordPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      const checkIcon = screen.getByText('Check your email')
        .closest('div')
        ?.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });
});
