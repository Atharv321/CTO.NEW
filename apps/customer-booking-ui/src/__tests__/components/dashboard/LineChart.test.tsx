import React from 'react';
import { render, screen } from '@testing-library/react';
import { LineChart } from '@components/dashboard/LineChart';
import { ChartSeries } from '@types/dashboard';

describe('LineChart Component', () => {
  const mockSeries: ChartSeries[] = [
    {
      id: 'revenue',
      label: 'Revenue',
      color: '#667eea',
      data: [
        { label: 'Jan', value: 1200 },
        { label: 'Feb', value: 1500 },
        { label: 'Mar', value: 1800 },
        { label: 'Apr', value: 1600 },
      ],
    },
  ];

  it('should render chart with provided data', () => {
    render(<LineChart series={mockSeries} />);

    expect(screen.getByRole('img', { name: /Line chart visualization/i })).toBeInTheDocument();
  });

  it('should render x-axis labels', () => {
    render(<LineChart series={mockSeries} />);

    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Apr')).toBeInTheDocument();
  });

  it('should render grid lines when showGrid is true', () => {
    const { container } = render(<LineChart series={mockSeries} showGrid />);

    const gridLines = container.querySelectorAll('[class*=gridLine]');
    expect(gridLines.length).toBeGreaterThan(0);
  });

  it('should not render grid lines when showGrid is false', () => {
    const { container } = render(<LineChart series={mockSeries} showGrid={false} />);

    const gridLines = container.querySelectorAll('[class*=gridLine]');
    expect(gridLines.length).toBe(0);
  });

  it('should render legend when multiple series and showLegend is true', () => {
    const multiSeries: ChartSeries[] = [
      ...mockSeries,
      {
        id: 'expenses',
        label: 'Expenses',
        color: '#f59e0b',
        data: [
          { label: 'Jan', value: 800 },
          { label: 'Feb', value: 900 },
          { label: 'Mar', value: 1000 },
          { label: 'Apr', value: 950 },
        ],
      },
    ];

    render(<LineChart series={multiSeries} showLegend />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('should not render legend when showLegend is false', () => {
    const multiSeries: ChartSeries[] = [
      ...mockSeries,
      {
        id: 'expenses',
        label: 'Expenses',
        data: [{ label: 'Jan', value: 800 }],
      },
    ];

    render(<LineChart series={multiSeries} showLegend={false} />);

    expect(screen.queryByText('Revenue')).not.toBeInTheDocument();
  });

  it('should render empty state when no series provided', () => {
    render(<LineChart series={[]} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should apply custom height when provided', () => {
    const { container } = render(<LineChart series={mockSeries} height={400} />);

    const chartWrapper = container.querySelector('[class*=chartWrapper]');
    expect(chartWrapper).toHaveStyle({ height: '400px' });
  });
});
