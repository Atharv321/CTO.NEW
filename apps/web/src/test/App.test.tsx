import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('should render the app', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('should display welcome text', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to Monorepo Web App/i)).toBeInTheDocument();
  });

  it('should display description text', () => {
    render(<App />);
    expect(screen.getByText(/This is the frontend application/i)).toBeInTheDocument();
  });
});
