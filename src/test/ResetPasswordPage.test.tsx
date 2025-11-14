import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { authService } from '../services/authService';

vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

function renderResetPasswordPage(token?: string) {
  const path = token ? `/reset-password?token=${token}` : '/reset-password';
  
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render reset password form with valid token', () => {
    renderResetPasswordPage('valid-token');

    expect(screen.getByText('Set new password')).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('should show error when token is missing', () => {
    renderResetPasswordPage();

    expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument();
  });

  it('should show password requirements', () => {
    renderResetPasswordPage('valid-token');

    expect(screen.getByText(/password must:/i)).toBeInTheDocument();
    expect(screen.getByText(/be at least 8 characters long/i)).toBeInTheDocument();
    expect(screen.getByText(/include both letters and numbers/i)).toBeInTheDocument();
  });

  it('should handle successful password reset', async () => {
    mockAuthService.resetPassword.mockResolvedValue();

    renderResetPasswordPage('valid-token');

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
    expect(screen.getByText(/your password has been successfully reset/i)).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    renderResetPasswordPage('valid-token');

    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await userEvent.type(newPasswordInput, 'NewPassword123');
    await userEvent.type(confirmPasswordInput, 'DifferentPassword123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', async () => {
    renderResetPasswordPage('valid-token');

    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await userEvent.type(newPasswordInput, 'Short1');
    await userEvent.type(confirmPasswordInput, 'Short1');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    });

    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
  });

  it('should handle password reset error from API', async () => {
    const errorMessage = 'Invalid or expired token';
    mockAuthService.resetPassword.mockRejectedValue(new Error(errorMessage));

    renderResetPasswordPage('invalid-token');

    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await userEvent.type(newPasswordInput, 'NewPassword123');
    await userEvent.type(confirmPasswordInput, 'NewPassword123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith({
      token: 'invalid-token',
      newPassword: 'NewPassword123',
    });
  });

  it('should disable form while loading', async () => {
    mockAuthService.resetPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderResetPasswordPage('valid-token');

    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await userEvent.type(newPasswordInput, 'NewPassword123');
    await userEvent.type(confirmPasswordInput, 'NewPassword123');
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(newPasswordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
  });

  it('should show loading spinner while submitting', async () => {
    mockAuthService.resetPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderResetPasswordPage('valid-token');

    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await userEvent.type(newPasswordInput, 'NewPassword123');
    await userEvent.type(confirmPasswordInput, 'NewPassword123');
    await userEvent.click(submitButton);

    expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should have link to sign in on success page', async () => {
    mockAuthService.resetPassword.mockResolvedValue();

    renderResetPasswordPage('valid-token');

    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await userEvent.type(newPasswordInput, 'NewPassword123');
    await userEvent.type(confirmPasswordInput, 'NewPassword123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password reset successful')).toBeInTheDocument();
    });

    const signInLink = screen.getByText(/sign in with new password/i);
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should disable submit button when token is missing', () => {
    renderResetPasswordPage();

    const submitButton = screen.getByRole('button', { name: /reset password/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show check icon on success', async () => {
    mockAuthService.resetPassword.mockResolvedValue();

    renderResetPasswordPage('valid-token');

    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await userEvent.type(newPasswordInput, 'NewPassword123');
    await userEvent.type(confirmPasswordInput, 'NewPassword123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      const checkIcon = screen.getByText('Password reset successful')
        .closest('div')
        ?.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });
});
