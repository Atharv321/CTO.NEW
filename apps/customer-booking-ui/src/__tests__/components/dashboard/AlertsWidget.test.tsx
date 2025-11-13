import React from 'react';
import { render, screen } from '@testing-library/react';
import { AlertsWidget } from '@components/dashboard/AlertsWidget';
import { DashboardAlert } from '@types/dashboard';

describe('AlertsWidget Component', () => {
  const mockAlerts: DashboardAlert[] = [
    {
      id: '1',
      severity: 'critical',
      title: 'Low inventory threshold reached',
      message: 'Only 3 units remaining for Premium Clippers.',
      timestamp: new Date().toISOString(),
      ctaLabel: 'View item',
      ctaHref: '/inventory/1',
    },
    {
      id: '2',
      severity: 'warning',
      title: 'High turnover detected',
      message: 'Hair gel is selling faster than usual this week.',
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
  ];

  it('should render widget title', () => {
    render(<AlertsWidget alerts={mockAlerts} />);
    expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
  });

  it('should render all alerts by default', () => {
    render(<AlertsWidget alerts={mockAlerts} />);

    expect(screen.getByText('Low inventory threshold reached')).toBeInTheDocument();
    expect(screen.getByText('High turnover detected')).toBeInTheDocument();
  });

  it('should display custom CTA when provided', () => {
    render(<AlertsWidget alerts={mockAlerts} />);
    expect(screen.getByRole('link', { name: /View item/i })).toHaveAttribute('href', '/inventory/1');
  });

  it('should limit number of displayed alerts based on maxDisplay', () => {
    render(<AlertsWidget alerts={mockAlerts} maxDisplay={1} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText('High turnover detected')).not.toBeInTheDocument();
  });

  it('should render badge when more alerts exist than maxDisplay', () => {
    render(<AlertsWidget alerts={mockAlerts} maxDisplay={1} />);

    expect(screen.getByText('2').className).toMatch(/badge/);
  });

  it('should render empty state when no alerts provided', () => {
    render(<AlertsWidget alerts={[]} />);

    expect(screen.getByText('No alerts at this time')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('should apply correct styles based on severity', () => {
    render(<AlertsWidget alerts={mockAlerts} />);

    const criticalAlert = screen.getByText('Low inventory threshold reached').closest('div');
    expect(criticalAlert?.className).toMatch(/critical/);
  });

  it('should display formatted relative time', () => {
    render(<AlertsWidget alerts={mockAlerts} />);

    expect(screen.getAllByText(/ago|Just now/).length).toBeGreaterThan(0);
  });
});
