import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Dashboard } from '../components/Dashboard'

// Mock the hooks
vi.mock('../hooks/useDashboardData', () => ({
  useDashboardSummary: () => ({
    data: {
      lowStockCount: 12,
      totalValuation: 45890.50,
      totalItems: 156,
      totalUnits: 1247,
      lastUpdated: '2023-12-01T10:00:00Z'
    },
    loading: false,
    error: null
  }),
  useTurnoverData: () => ({
    data: [
      { month: 'Jan', turnover: 35000, itemsSold: 75 },
      { month: 'Feb', turnover: 42000, itemsSold: 89 }
    ],
    loading: false,
    error: null
  }),
  useStockLevels: () => ({
    data: [
      { category: 'Electronics', currentStock: 45, minStock: 20, maxStock: 100 },
      { category: 'Tools', currentStock: 8, minStock: 15, maxStock: 50 }
    ],
    loading: false,
    error: null
  }),
  useAlerts: () => ({
    data: [
      {
        id: '1',
        type: 'low_stock' as const,
        severity: 'high' as const,
        message: 'Tools category is critically low on stock',
        category: 'Tools',
        currentStock: 8,
        minStock: 15,
        timestamp: '2023-12-01T08:00:00Z'
      }
    ],
    loading: false,
    error: null
  })
}))

// Mock the components to avoid recharts dependency in tests
vi.mock('../components/TurnoverChart', () => ({
  TurnoverChart: ({ loading, error }: any) => {
    if (loading) return <div>Loading turnover data...</div>
    if (error) return <div>Error: {error}</div>
    return <div>Turnover Chart Component</div>
  }
}))

vi.mock('../components/StockLevelsChart', () => ({
  StockLevelsChart: ({ loading, error }: any) => {
    if (loading) return <div>Loading stock levels...</div>
    if (error) return <div>Error: {error}</div>
    return <div>Stock Levels Chart Component</div>
  }
}))

vi.mock('../components/SummaryCards', () => ({
  SummaryCards: ({ loading, error }: any) => {
    if (loading) return <div>Loading dashboard metrics...</div>
    if (error) return <div>Error: {error}</div>
    return <div>Summary Cards Component</div>
  }
}))

vi.mock('../components/AlertsWidget', () => ({
  AlertsWidget: ({ loading, error }: any) => {
    if (loading) return <div>Loading alerts...</div>
    if (error) return <div>Error: {error}</div>
    return <div>Alerts Widget Component</div>
  }
}))

describe('Dashboard', () => {
  it('should render dashboard title and subtitle', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Real-time analytics and insights for your inventory management')).toBeInTheDocument()
  })

  it('should render all dashboard components', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Summary Cards Component')).toBeInTheDocument()
    expect(screen.getByText('Turnover Chart Component')).toBeInTheDocument()
    expect(screen.getByText('Stock Levels Chart Component')).toBeInTheDocument()
    expect(screen.getByText('Alerts Widget Component')).toBeInTheDocument()
  })

  it('should display last updated timestamp', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Last updated: 12/1/2023, 10:00:00 AM')).toBeInTheDocument()
  })
})