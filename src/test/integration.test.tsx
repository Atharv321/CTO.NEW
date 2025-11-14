import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InventoryManager, InventoryItem } from '../components/InventoryManager'

const customInitialItems: InventoryItem[] = [
  {
    id: 'custom-item',
    name: 'Calibration Kit',
    sku: 'CAL-001',
    barcode: 'CAL001',
    category: 'Tooling',
    supplierId: 'sup-acme',
    status: 'active',
    uom: 'kits',
    safetyStock: 5,
    lastUpdated: '2024-02-15T10:00:00.000Z',
    locations: [
      { id: 'loc-main', name: 'Main Warehouse', quantity: 6, reorderPoint: 4 },
      { id: 'loc-service', name: 'Service Vans', quantity: 3, reorderPoint: 2 },
    ],
    audits: [
      {
        id: 'audit-custom-1',
        timestamp: '2024-02-15T10:00:00.000Z',
        user: 'Taylor Ortiz',
        action: 'Stock Increase',
        delta: 4,
        locationId: 'loc-main',
        closingBalance: 6,
        note: 'Initial stocking',
      },
    ],
  },
]

describe('InventoryManager UI flows', () => {
  it('renders inventory dashboard with summary metrics and list view', () => {
    render(<InventoryManager />)

    expect(
      screen.getByRole('heading', { level: 1, name: /inventory management/i }),
    ).toBeInTheDocument()

    const activeSummary = screen.getByTestId('summary-active').textContent ?? ''
    const unitsSummary = screen.getByTestId('summary-units').textContent ?? ''
    const lowSummary = screen.getByTestId('summary-low').textContent ?? ''

    expect(activeSummary).not.toHaveLength(0)
    expect(unitsSummary).not.toHaveLength(0)
    expect(lowSummary).not.toHaveLength(0)

    expect(screen.getByTestId('inventory-list')).toBeInTheDocument()
  })

  it('filters items by search term and supplier', async () => {
    const user = userEvent.setup()
    render(<InventoryManager />)

    const searchInput = screen.getByTestId('filter-search')
    await user.type(searchInput, 'legacy')

    await waitFor(() => {
      expect(screen.getByTestId('item-card-item-legacy-gear')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('item-card-item-smart-sensor')).not.toBeInTheDocument()

    await user.clear(searchInput)

    const supplierSelect = screen.getByTestId('filter-supplier')
    await user.selectOptions(supplierSelect, 'sup-brightline')

    await waitFor(() => {
      expect(screen.getByTestId('item-card-item-smart-sensor')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('item-card-item-precision-widget')).not.toBeInTheDocument()

    const resetFilters = screen.getByRole('button', { name: /reset filters/i })
    await user.click(resetFilters)

    expect(screen.getByTestId('item-card-item-precision-widget')).toBeInTheDocument()
    expect(screen.getByTestId('item-card-item-smart-sensor')).toBeInTheDocument()
    expect(screen.getByTestId('item-card-item-legacy-gear')).toBeInTheDocument()
  })

  it('displays item detail view with multi-location table and audit history', async () => {
    const user = userEvent.setup()
    render(<InventoryManager />)

    const detailsButton = screen.getByRole('button', {
      name: /view details for precision widget a1/i,
    })
    await user.click(detailsButton)

    expect(screen.getByTestId('item-detail')).toBeInTheDocument()
    expect(screen.getByTestId('location-row-loc-main')).toBeInTheDocument()
    expect(screen.getByTestId('location-row-loc-retail')).toBeInTheDocument()
    expect(screen.getByTestId('audit-table')).toBeInTheDocument()

    const supplierLink = screen.getByTestId('supplier-link')
    expect(supplierLink).toHaveAttribute('href', expect.stringContaining('acme'))
  })

  it('performs optimistic stock adjustment and records audit entry', async () => {
    const user = userEvent.setup()
    render(<InventoryManager optimisticDelayMs={400} />)

    const openDetails = screen.getByRole('button', {
      name: /view details for precision widget a1/i,
    })
    await user.click(openDetails)

    const adjustButtons = screen.getAllByRole('button', { name: /adjust stock/i })
    await user.click(adjustButtons[0])

    const quantityInput = screen.getByLabelText(/quantity/i)
    await user.clear(quantityInput)
    await user.type(quantityInput, '10')

    const reasonInput = screen.getByLabelText(/reason/i)
    await user.type(reasonInput, 'Cycle count reconciliation')

    const saveButton = screen.getByRole('button', { name: /save adjustment/i })
    await user.click(saveButton)

    expect(screen.getByText(/saving stock movement/i)).toBeInTheDocument()
    expect(screen.getByText(/saving…/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/stock movement saved/i)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.queryByText(/saving…/i)).not.toBeInTheDocument()
    })

    const row = screen.getByTestId('location-row-loc-main')
    expect(within(row).getByText(/152 units/i)).toBeInTheDocument()

    const auditRow = screen.getAllByRole('row', { name: /stock increase/i })[0]
    expect(within(auditRow).getByText(/you/i)).toBeInTheDocument()
    expect(within(auditRow).getByText(/\+10 units/i)).toBeInTheDocument()
    expect(within(auditRow).getByText(/cycle count reconciliation/i)).toBeInTheDocument()
  })

  it('respects permissions for stock adjustments, audit visibility, and scanner access', async () => {
    const user = userEvent.setup()
    render(
      <InventoryManager
        permissions={{
          canAdjustStock: false,
          canViewAuditLogs: false,
          canUseScanner: false,
        }}
      />,
    )

    const detailsButton = screen.getByRole('button', {
      name: /view details for precision widget a1/i,
    })
    await user.click(detailsButton)

    const adjustButton = screen.getAllByRole('button', { name: /adjust stock/i })[0]
    expect(adjustButton).toBeDisabled()

    expect(
      screen.getByText(/audit history is hidden because you do not have permission/i),
    ).toBeInTheDocument()

    const scannerButton = screen.getByTestId('scan-placeholder')
    expect(scannerButton).toBeDisabled()
    expect(scannerButton).toHaveTextContent(/scanner access restricted/i)
  })

  it('accepts external inventory data and displays audit logs', () => {
    render(
      <InventoryManager
        initialItems={customInitialItems}
        permissions={{ canAdjustStock: true, canViewAuditLogs: true, canUseScanner: true }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /view details for calibration kit/i }))

    expect(screen.getByTestId('audit-table')).toBeInTheDocument()
    expect(screen.getByText(/taylor ortiz/i)).toBeInTheDocument()
    expect(screen.getByText(/initial stocking/i)).toBeInTheDocument()
  })
})
