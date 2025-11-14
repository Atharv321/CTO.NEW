import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@components/dashboard/MetricCard';
import { SummaryMetric } from '@types/dashboard';

describe('MetricCard Component', () => {
  const mockMetric: SummaryMetric = {
    id: 'total-bookings',
    label: 'Total Bookings',
    value: 150,
    format: 'number',
  };

  it('should render metric label and value', () => {
    render(<MetricCard metric={mockMetric} />);

    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    expect(screen.getByLabelText('Total Bookings value')).toHaveTextContent('150');
  });

  it('should format currency values correctly', () => {
    const currencyMetric: SummaryMetric = {
      id: 'revenue',
      label: 'Total Revenue',
      value: 15000.5,
      format: 'currency',
    };

    render(<MetricCard metric={currencyMetric} />);
    expect(screen.getByLabelText('Total Revenue value')).toHaveTextContent('$15,000.50');
  });

  it('should format percentage values correctly', () => {
    const percentageMetric: SummaryMetric = {
      id: 'rate',
      label: 'Success Rate',
      value: 87.5,
      format: 'percentage',
    };

    render(<MetricCard metric={percentageMetric} />);
    expect(screen.getByLabelText('Success Rate value')).toHaveTextContent('87.5%');
  });

  it('should format duration values correctly', () => {
    const durationMetric: SummaryMetric = {
      id: 'avg-time',
      label: 'Average Time',
      value: 45,
      format: 'duration',
    };

    render(<MetricCard metric={durationMetric} />);
    expect(screen.getByLabelText('Average Time value')).toHaveTextContent('45 min');
  });

  it('should display positive change with up arrow', () => {
    const metricWithChange: SummaryMetric = {
      ...mockMetric,
      change: 12.5,
      changeDirection: 'up',
    };

    render(<MetricCard metric={metricWithChange} />);
    expect(screen.getByText('↑')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('should display negative change with down arrow', () => {
    const metricWithChange: SummaryMetric = {
      ...mockMetric,
      change: 8.3,
      changeDirection: 'down',
    };

    render(<MetricCard metric={metricWithChange} />);
    expect(screen.getByText('↓')).toBeInTheDocument();
    expect(screen.getByText('8.3%')).toBeInTheDocument();
  });

  it('should display helper text when provided', () => {
    const metricWithHelper: SummaryMetric = {
      ...mockMetric,
      helperText: 'Compared to last month',
    };

    render(<MetricCard metric={metricWithHelper} />);
    expect(screen.getByText('Compared to last month')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(<MetricCard metric={mockMetric} />);
    
    const card = screen.getByRole('article', { name: /Total Bookings metric/i });
    expect(card).toBeInTheDocument();
  });

  it('should not display change when not provided', () => {
    render(<MetricCard metric={mockMetric} />);
    
    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
  });
});
