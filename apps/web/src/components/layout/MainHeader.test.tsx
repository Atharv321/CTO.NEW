import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { ReactElement } from 'react';
import { MainHeader } from './MainHeader';

const renderWithMantine = (ui: ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('MainHeader', () => {
  it('renders the title', () => {
    renderWithMantine(<MainHeader />);
    expect(screen.getByText('Barber Booking')).toBeInTheDocument();
  });

  it('renders the theme toggle button', () => {
    renderWithMantine(<MainHeader />);
    const toggleButton = screen.getByLabelText('Toggle color scheme');
    expect(toggleButton).toBeInTheDocument();
  });
});
