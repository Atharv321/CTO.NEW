import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

describe('UnauthorizedPage', () => {
  function renderUnauthorizedPage() {
    return render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>
    );
  }

  it('should render unauthorized message', () => {
    renderUnauthorizedPage();

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/you don't have permission to access this page/i)).toBeInTheDocument();
  });

  it('should show error icon', () => {
    renderUnauthorizedPage();

    const errorIcon = screen.getByText('Access Denied')
      .closest('div')
      ?.parentElement
      ?.querySelector('svg');
    
    expect(errorIcon).toBeInTheDocument();
  });

  it('should have link to dashboard', () => {
    renderUnauthorizedPage();

    const dashboardLink = screen.getByText('Go to Dashboard');
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('should have go back button', () => {
    renderUnauthorizedPage();

    const goBackButton = screen.getByText('Go Back');
    expect(goBackButton).toBeInTheDocument();
  });

  it('should call window.history.back when go back button is clicked', async () => {
    const mockBack = vi.fn();
    Object.defineProperty(window, 'history', {
      value: { back: mockBack },
      writable: true,
    });

    renderUnauthorizedPage();

    const goBackButton = screen.getByText('Go Back');
    await userEvent.click(goBackButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('should show contact administrator message', () => {
    renderUnauthorizedPage();

    expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument();
  });

  it('should have proper styling for error state', () => {
    renderUnauthorizedPage();

    const accessDeniedHeading = screen.getByText('Access Denied');
    expect(accessDeniedHeading).toHaveClass('text-3xl', 'font-extrabold', 'text-gray-900');
  });

  it('should render all action buttons', () => {
    renderUnauthorizedPage();

    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('should display red warning icon', () => {
    renderUnauthorizedPage();

    const iconContainer = screen.getByText('Access Denied')
      .closest('div')
      ?.parentElement
      ?.querySelector('.bg-red-100');
    
    expect(iconContainer).toBeInTheDocument();
  });
});
