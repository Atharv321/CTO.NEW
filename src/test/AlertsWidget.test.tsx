import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AlertsWidget } from '../components/AlertsWidget'

describe('AlertsWidget', () => {
  const mockAlerts = [
    {
      id: '1',
      type: 'low_stock' as const,
      severity: 'high' as const,
      message: 'Tools category is critically low on stock',
      category: 'Tools',
      currentStock: 8,
      minStock: 15,
      timestamp: '2023-12-01T08:00:00Z'
    },
    {
      id: '2',
      type: 'valuation' as const,
      severity: 'info' as const,
      message: 'Monthly valuation increased by 12%',
      category: 'General',
      timestamp: '2023-11-30T16:00:00Z'
    }
  ]

  it('should display loading state', () => {
    render(<AlertsWidget data={[]} loading={true} error={null} />)
    expect(screen.getByText('Loading alerts...')).toBeInTheDocument()
  })

  it('should display error state', () => {
    render(<AlertsWidget data={[]} loading={false} error="Failed to load" />)
    expect(screen.getByText('Error loading alerts: Failed to load')).toBeInTheDocument()
  })

  it('should display empty state', () => {
    render(<AlertsWidget data={[]} loading={false} error={null} />)
    expect(screen.getByText('No alerts at this time')).toBeInTheDocument()
  })

  it('should display alerts header with count', () => {
    render(<AlertsWidget data={mockAlerts} loading={false} error={null} />)
    
    expect(screen.getByText('Alerts & Notifications')).toBeInTheDocument()
    expect(screen.getByText('2 active')).toBeInTheDocument()
  })

  it('should display alert items with correct content', () => {
    render(<AlertsWidget data={mockAlerts} loading={false} error={null} />)

    // First alert
    expect(screen.getByText('Tools category is critically low on stock')).toBeInTheDocument()
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByText('8 / 15 units')).toBeInTheDocument()

    // Second alert
    expect(screen.getByText('Monthly valuation increased by 12%')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('should display view all button', () => {
    render(<AlertsWidget data={mockAlerts} loading={false} error={null} />)
    expect(screen.getByText('View all alerts')).toBeInTheDocument()
  })

  it('should sort alerts by severity and timestamp', () => {
    const unsortedAlerts = [
      {
        id: '1',
        type: 'valuation' as const,
        severity: 'info' as const,
        message: 'Info alert',
        category: 'General',
        timestamp: '2023-12-01T08:00:00Z'
      },
      {
        id: '2',
        type: 'low_stock' as const,
        severity: 'high' as const,
        message: 'High severity alert',
        category: 'Tools',
        currentStock: 5,
        minStock: 10,
        timestamp: '2023-12-01T09:00:00Z'
      },
      {
        id: '3',
        type: 'low_stock' as const,
        severity: 'medium' as const,
        message: 'Medium severity alert',
        category: 'Hardware',
        currentStock: 20,
        minStock: 25,
        timestamp: '2023-12-01T07:00:00Z'
      }
    ]

    render(<AlertsWidget data={unsortedAlerts} loading={false} error={null} />)

    const alertMessages = screen.getAllByText(/alert$/)
    expect(alertMessages[0]).toHaveTextContent('High severity alert')
    expect(alertMessages[1]).toHaveTextContent('Medium severity alert')
    expect(alertMessages[2]).toHaveTextContent('Info alert')
  })

  it('should format timestamps correctly', () => {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    const alertsWithTimestamps = [
      {
        id: '1',
        type: 'low_stock' as const,
        severity: 'high' as const,
        message: 'Recent alert',
        category: 'Tools',
        currentStock: 8,
        minStock: 15,
        timestamp: twoHoursAgo.toISOString()
      },
      {
        id: '2',
        type: 'valuation' as const,
        severity: 'info' as const,
        message: 'Old alert',
        category: 'General',
        timestamp: twoDaysAgo.toISOString()
      }
    ]

    render(<AlertsWidget data={alertsWithTimestamps} loading={false} error={null} />)

    expect(screen.getByText('2h ago')).toBeInTheDocument()
    expect(screen.getByText('2d ago')).toBeInTheDocument()
  })
})