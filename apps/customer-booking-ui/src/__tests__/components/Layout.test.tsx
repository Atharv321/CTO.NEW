import React from 'react';
import { render, screen } from '@testing-library/react';
import { Layout } from '@components/Layout';

describe('Layout Component', () => {
  it('should render header with logo', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText(/Barber Booking/i)).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render footer', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });
});
