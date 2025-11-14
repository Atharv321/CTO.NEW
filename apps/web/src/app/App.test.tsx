import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { appRoutes } from './router';

const renderWithRouter = (initialRoute = '/') => {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialRoute],
  });

  return render(
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
};

describe('App routing', () => {
  it('renders the home page by default', () => {
    renderWithRouter('/');
    expect(screen.getByText(/welcome to barber booking/i)).toBeInTheDocument();
  });

  it('renders the appointments page', () => {
    renderWithRouter('/appointments');
    expect(screen.getByText(/appointments/i)).toBeInTheDocument();
  });

  it('renders the settings page', () => {
    renderWithRouter('/settings');
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });
});
