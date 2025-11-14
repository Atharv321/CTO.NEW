import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SummaryCards } from '../components/SummaryCards'

describe('SummaryCards', () => {
  const mockData = {
    lowStockCount: 12,
    totalValuation: 45890.50,
    totalItems: 156,
    totalUnits: 1247,
    lastUpdated: '2023-12-01T10:00:00Z'
  }

  it('should display loading state', () => {
    render(<SummaryCards data={null} loading={true} error={null} />)
    expect(screen.getByText('Loading dashboard metrics...')).toBeInTheDocument()
  })

  it('should display error state', () => {
    render(<SummaryCards data={null} loading={false} error="Failed to load" />)
    expect(screen.getByText('Error loading metrics: Failed to load')).toBeInTheDocument()
  })

  it('should display empty state', () => {
    render(<SummaryCards data={null} loading={false} error={null} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('should display summary cards with correct data', () => {
    render(<SummaryCards data={mockData} loading={false} error={null} />)

    expect(screen.getByText('Low Stock Items')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Items need restocking')).toBeInTheDocument()

    expect(screen.getByText('Total Valuation')).toBeInTheDocument()
    expect(screen.getByText('$45,890.50')).toBeInTheDocument()
    expect(screen.getByText('Current inventory value')).toBeInTheDocument()

    expect(screen.getByText('Total Items')).toBeInTheDocument()
    expect(screen.getByText('156')).toBeInTheDocument()
    expect(screen.getByText('Unique SKUs')).toBeInTheDocument()

    expect(screen.getByText('Total Units')).toBeInTheDocument()
    expect(screen.getByText('1,247')).toBeInTheDocument()
    expect(screen.getByText('All items combined')).toBeInTheDocument()
  })

  it('should format currency correctly', () => {
    const dataWithZeroValuation = { ...mockData, totalValuation: 0 }
    render(<SummaryCards data={dataWithZeroValuation} loading={false} error={null} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('should format large numbers correctly', () => {
    const dataWithLargeNumbers = { ...mockData, totalUnits: 1234567 }
    render(<SummaryCards data={dataWithLargeNumbers} loading={false} error={null} />)
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })
})