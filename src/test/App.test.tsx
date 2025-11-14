import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

// Mock the components to focus on navigation testing
vi.mock('../components/InventoryManager', () => ({
  InventoryManager: () => <div data-testid="inventory-manager">Inventory Manager</div>
}))

vi.mock('../components/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard</div>
}))

describe('App Navigation', () => {
  it('should render navigation with brand and menu items', () => {
    render(<App />)
    
    expect(screen.getByText('Inventory System')).toBeInTheDocument()
    expect(screen.getByText('📦 Inventory')).toBeInTheDocument()
    expect(screen.getByText('📊 Dashboard')).toBeInTheDocument()
  })

  it('should show inventory manager by default', () => {
    render(<App />)
    
    expect(screen.getByTestId('inventory-manager')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
  })

  it('should switch to dashboard when dashboard button is clicked', () => {
    render(<App />)
    
    const dashboardButton = screen.getByText('📊 Dashboard')
    fireEvent.click(dashboardButton)
    
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    expect(screen.queryByTestId('inventory-manager')).not.toBeInTheDocument()
  })

  it('should switch back to inventory when inventory button is clicked', () => {
    render(<App />)
    
    // First switch to dashboard
    const dashboardButton = screen.getByText('📊 Dashboard')
    fireEvent.click(dashboardButton)
    
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    
    // Then switch back to inventory
    const inventoryButton = screen.getByText('📦 Inventory')
    fireEvent.click(inventoryButton)
    
    expect(screen.getByTestId('inventory-manager')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
  })

  it('should apply active styling to current view', () => {
    render(<App />)
    
    const inventoryButton = screen.getByText('📦 Inventory')
    const dashboardButton = screen.getByText('📊 Dashboard')
    
    // Initially inventory should be active
    expect(inventoryButton).toHaveClass('navigation__item--active')
    expect(dashboardButton).not.toHaveClass('navigation__item--active')
    
    // Click dashboard
    fireEvent.click(dashboardButton)
    
    expect(dashboardButton).toHaveClass('navigation__item--active')
    expect(inventoryButton).not.toHaveClass('navigation__item--active')
  })
})