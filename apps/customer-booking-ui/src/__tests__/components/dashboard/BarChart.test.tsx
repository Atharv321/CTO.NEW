import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarChart } from '@components/dashboard/BarChart';
import { ChartSeries } from '@types/dashboard';

describe('BarChart Component', () => {
  const mockSeries: ChartSeries[] = [
    {
      id: 'turnover-weekly',
      label: 'Turnover',
      color: '#4f46e5',
      data: [
        { label: 'Week 1', value: 25 },
        { label: 'Week 2', value: 40 },
        { label: 'Week 3', value: 32 },
        { label: 'Week 4', value: 45 },
      ],
    },
  ];

  it('should render bars for each data point', () => {
    render(<BarChart series={mockSeries} />);

    expect(screen.getAllByRole('img').length).toBe(mockSeries[0].data.length);
  });

  it('should display labels for each bar group', () => {
    render(<BarChart series={mockSeries} />);

    mockSeries[0].data.forEach(point => {
      expect(screen.getByText(point.label)).toBeInTheDocument();
    });
  });

  it('should render legend when multiple series', () => {
    const multiSeries: ChartSeries[] = [
      ...mockSeries,
      {
        id: 'turnover-target',
        label: 'Target',
        color: '#34d399',
        data: [
          { label: 'Week 1', value: 30 },
          { label: 'Week 2', value: 35 },
          { label: 'Week 3', value: 33 },
          { label: 'Week 4', value: 36 },
        ],
      },
    ];

    render(<BarChart series={multiSeries} />);

    expect(screen.getByText('Turnover')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
  });

  it('should hide legend when showLegend is false', () => {
    render(<BarChart series={mockSeries} showLegend={false} />);

    expect(screen.queryByText('Turnover')).not.toBeInTheDocument();
  });

  it('should render empty state when no data provided', () => {
    render(<BarChart series={[]} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should apply custom height when provided', () => {
    const { container } = render(<BarChart series={mockSeries} height={350} />);

    const chartWrapper = container.querySelector('[class*=chartWrapper]');
    expect(chartWrapper).toHaveStyle({ height: '350px' });
  });
});
