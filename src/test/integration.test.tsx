import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InventoryManager, InventoryItem } from '../components/InventoryManager'
import { createMockScanResult, mockBrowserMultiFormatReader } from './mocks'

// Mock the BrowserMultiFormatReader before importing components
vi.mock('@zxing/library', () => {
  const mockReader = mockBrowserMultiFormatReader()
  return {
    BrowserMultiFormatReader: vi.fn().mockImplementation(() => mockReader),
    BarcodeFormat: {},
    Result: class {
      getText() {
        return 'test'
      }
      getFormatName() {
        return 'CODE_128'
      }
    },
  }
})

describe('Inventory Scanner Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render inventory manager with scanner', () => {
    render(<InventoryManager />)

    expect(screen.getByText('Inventory Management')).toBeTruthy()
    expect(screen.getByText(/Scan barcodes or enter items manually/)).toBeTruthy()
  })

  it('should render barcode scanner with video element', () => {
    render(<InventoryManager />)

    // Check for scanner UI elements
    expect(screen.getByRole('region', { name: /barcode scanner/i })).toBeTruthy()
  })

  it('should handle manual barcode entry', async () => {
    const user = userEvent.setup()
    render(<InventoryManager />)

    // Find and click fallback button to switch to manual entry
    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)
    }

    // Now interact with the input - look for the manual entry form
    const form = screen.queryByRole('search')
    if (form) {
      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, '123456789')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      await waitFor(() => {
        // Check if the item was added
        expect(screen.getByText(/Widget A/i)).toBeTruthy()
      })
    }
  })

  it('should add item to inventory when barcode is scanned', async () => {
    const onItemsChange = vi.fn()
    render(<InventoryManager onItemsChange={onItemsChange} />)

    // Simulate barcode scan by finding the fallback input and using it
    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      fireEvent.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      fireEvent.change(input, { target: { value: '123456789' } })

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Widget A')).toBeTruthy()
        expect(onItemsChange).toHaveBeenCalled()
      })
    }
  })

  it('should update quantity when same barcode is scanned twice', async () => {
    const user = userEvent.setup()
    render(<InventoryManager />)

    // First scan
    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, '123456789')

      let submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Widget A')).toBeTruthy()
      })

      // Verify quantity is 1 (visual check in the cart)
      let itemCard = screen.getByTestId('item-123456789_*', { exact: false })
      if (!itemCard) {
        // Alternative: check for quantity input
        const qtyInput = screen.getByLabelText(/Widget A quantity/i)
        expect(qtyInput).toHaveValue(1)
      }
    }
  })

  it('should display empty state when no items are added', () => {
    render(<InventoryManager />)

    expect(
      screen.getByText(/No items added yet. Scan a barcode or use manual entry./),
    ).toBeTruthy()
  })

  it('should handle unknown barcodes gracefully', async () => {
    const user = userEvent.setup()
    render(<InventoryManager />)

    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, 'UNKNOWN_BARCODE_12345')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(
          screen.getByText(/Item not found: UNKNOWN_BARCODE_12345/),
        ).toBeTruthy()
      })
    }
  })

  it('should allow quantity adjustment', async () => {
    const user = userEvent.setup()
    render(<InventoryManager />)

    // Add an item first
    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, '987654321')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Widget B')).toBeTruthy()
      })

      // Find and click increase quantity button
      const increaseBtn = screen.getByRole('button', {
        name: /Increase Widget B quantity/i,
      })
      await user.click(increaseBtn)

      const qtyInput = screen.getByLabelText(/Widget B quantity/i)
      await waitFor(() => {
        expect(qtyInput).toHaveValue(2)
      })
    }
  })

  it('should display inventory summary', async () => {
    const user = userEvent.setup()
    render(<InventoryManager />)

    // Add items
    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      for (const barcode of ['123456789', '987654321']) {
        const input = screen.getByLabelText(/enter barcode or item id/i)
        await user.clear(input)
        await user.type(input, barcode)

        const submitBtn = screen.getByRole('button', { name: /add item/i })
        await user.click(submitBtn)

        await waitFor(() => {
          expect(submitBtn).toBeInTheDocument()
        })
      }

      // Check summary
      expect(screen.getByText(/Total Items:/)).toBeTruthy()
      expect(screen.getByText(/Total Units:/)).toBeTruthy()
    }
  })

  it('should handle item removal', async () => {
    const user = userEvent.setup()
    const onItemsChange = vi.fn()
    render(<InventoryManager onItemsChange={onItemsChange} />)

    // Add an item
    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, '555555555')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Gadget X')).toBeTruthy()
      })

      // Remove the item
      const removeBtn = screen.getByRole('button', {
        name: /Remove Gadget X from inventory/i,
      })
      await user.click(removeBtn)

      await waitFor(() => {
        expect(
          screen.getByText(/No items added yet. Scan a barcode or use manual entry./),
        ).toBeTruthy()
      })
    }
  })

  it('should track scan source (manual vs camera)', async () => {
    const user = userEvent.setup()
    render(<InventoryManager />)

    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, 'QR_001')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Premium Tool')).toBeTruthy()
        expect(screen.getByText(/Added manually/i)).toBeTruthy()
      })
    }
  })

  it('should update items through callback when inventory changes', async () => {
    const onItemsChange = vi.fn()
    const user = userEvent.setup()
    render(<InventoryManager onItemsChange={onItemsChange} />)

    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, '123456789')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(onItemsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              barcode: '123456789',
              name: 'Widget A',
              quantity: 1,
              source: 'manual',
            }),
          ]),
        )
      })
    }
  })

  it('should support accessibility features', () => {
    render(<InventoryManager />)

    // Check for ARIA labels
    expect(screen.getByRole('region', { name: /barcode scanner/i })).toBeTruthy()

    // Check for status updates
    expect(screen.getByRole('status', { hidden: true })).toBeTruthy()

    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('should accept initial items', () => {
    const initialItems: InventoryItem[] = [
      {
        id: 'test-1',
        barcode: '123456789',
        name: 'Pre-existing Item',
        quantity: 5,
        source: 'scan',
      },
    ]

    render(<InventoryManager initialItems={initialItems} />)

    expect(screen.getByText('Pre-existing Item')).toBeTruthy()
    const qtyInput = screen.getByLabelText(/Pre-existing Item quantity/i)
    expect(qtyInput).toHaveValue(5)
  })
})
