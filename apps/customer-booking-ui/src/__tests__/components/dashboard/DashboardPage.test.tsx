import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@components/dashboard/DashboardPage';
import { useDashboard } from '@hooks/useDashboardQueries';
import { DashboardData } from '@types/dashboard';

jest.mock('@hooks/useDashboardQueries');

const mockUseDashboard = useDashboard as jest.MockedFunction<typeof useDashboard>;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('DashboardPage Component', () => {
  const mockDashboardData: DashboardData = {
    summary: [
      {
        id: 'low-stock',
        label: 'Low Stock Items',
        value: 5,
        format: 'number',
        change: 2,
        changeDirection: 'up',
        helperText: 'Items below threshold',
      },
      {
        id: 'total-valuation',
        label: 'Total Valuation',
        value: 45000,
        format: 'currency',
        change: 8.5,
        changeDirection: 'up',
      },
    ],
    turnover: [
      {
        id: 'daily-turnover',
        title: 'Daily Turnover',
        period: 'daily',
        description: 'Daily inventory movement',
        type: 'line',
        series: [
          {
            id: 'turnover-series',
            label: 'Units Moved',
            data: [
              { label: 'Mon', value: 25 },
              { label: 'Tue', value: 30 },
              { label: 'Wed', value: 28 },
            ],
          },
        ],
      },
    ],
    alerts: [
      {
        id: 'alert-1',
        severity: 'critical',
        title: 'Low inventory alert',
        message: 'Premium Clippers below minimum threshold',
        timestamp: new Date().toISOString(),
        ctaLabel: 'View item',
        ctaHref: '/inventory/1',
      },
    ],
    lastUpdated: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseDashboard.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<DashboardPage />, { wrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render dashboard with data', async () => {
    mockUseDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<DashboardPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
    expect(screen.getByText('Total Valuation')).toBeInTheDocument();
  });

  it('should render metric cards for all summary metrics', () => {
    mockUseDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<DashboardPage />, { wrapper });

    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
    expect(screen.getByText('Total Valuation')).toBeInTheDocument();
  });

  it('should render charts section with all charts', () => {
    mockUseDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<DashboardPage />, { wrapper });

    expect(screen.getByText('Daily Turnover')).toBeInTheDocument();
    expect(screen.getByText('Daily inventory movement')).toBeInTheDocument();
  });

  it('should render alerts widget', () => {
    mockUseDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<DashboardPage />, { wrapper });

    expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
    expect(screen.getByText('Low inventory alert')).toBeInTheDocument();
  });

  it('should render error state when data fetch fails', () => {
    const mockError = new Error('Network error');
    mockUseDashboard.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: jest.fn(),
    } as any);

    render(<DashboardPage />, { wrapper });

    expect(screen.getByText('Unable to load dashboard')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should call refetch when retry button is clicked', () => {
    const mockRefetch = jest.fn();
    mockUseDashboard.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as any);

    render(<DashboardPage />, { wrapper });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('should display last updated timestamp', () => {
    mockUseDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<DashboardPage />, { wrapper });

    expect(screen.getByText('Last updated')).toBeInTheDocument();
  });
});
