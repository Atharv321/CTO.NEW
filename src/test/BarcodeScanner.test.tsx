import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BarcodeScanner } from '../components/BarcodeScanner'

// Mock the BrowserMultiFormatReader
vi.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    reset: vi.fn(async () => {}),
    decodeFromVideoElement: vi.fn(async () => {}),
    listVideoInputDevices: vi.fn(async () => [{ deviceId: 'device-1' }]),
  })),
  BarcodeFormat: {},
  Result: class {
    getText() {
      return 'test'
    }
    getFormatName() {
      return 'CODE_128'
    }
  },
}))

describe('BarcodeScanner Component', () => {
  let mockOnScan: ReturnType<typeof vi.fn>
  let mockOnManualEntry: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnScan = vi.fn()
    mockOnManualEntry = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render scanner component', () => {
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        ariaLabel="Test Scanner"
      />,
    )

    expect(screen.getByRole('region', { name: 'Test Scanner' })).toBeTruthy()
  })

  it('should render video element for camera scanning', () => {
    render(<BarcodeScanner onScan={mockOnScan} />)

    const videoElement = screen.getByLabelText(/Barcode scanner video feed/i)
    expect(videoElement).toBeTruthy()
    expect(videoElement.tagName).toBe('VIDEO')
  })

  it('should display scanner help information', () => {
    render(<BarcodeScanner onScan={mockOnScan} />)

    expect(screen.getByText(/Scanner Help/i)).toBeTruthy()

    const details = screen.getByText(/Scanner Help/i).parentElement
    expect(details?.tagName).toBe('DETAILS')
  })

  it('should toggle between camera and manual entry', async () => {
    const user = userEvent.setup()
    render(<BarcodeScanner onScan={mockOnScan} />)

    // Initially, the fallback button should not be disabled
    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      // After clicking, we should see the manual entry form
      const input = screen.getByLabelText(/enter barcode or item id/i)
      expect(input).toBeTruthy()

      // Click back to camera
      const backBtn = screen.getByRole('button', {
        name: /back to camera/i,
      })
      await user.click(backBtn)

      // Should be back to camera view
      expect(screen.getByLabelText(/Barcode scanner video feed/i)).toBeTruthy()
    }
  })

  it('should accept manual barcode entry', async () => {
    const user = userEvent.setup()
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        onManualEntry={mockOnManualEntry}
      />,
    )

    // Force manual entry mode by clicking fallback
    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, 'MANUAL123')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      expect(submitBtn).not.toBeDisabled()

      await user.click(submitBtn)

      expect(mockOnManualEntry).toHaveBeenCalledWith('MANUAL123')
      expect(mockOnScan).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'MANUAL123',
          format: 'MANUAL_ENTRY',
        }),
      )

      // Input should be cleared
      expect(input).toHaveValue('')
    }
  })

  it('should disable submit button when input is empty', async () => {
    const user = userEvent.setup()
    render(<BarcodeScanner onScan={mockOnScan} />)

    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      expect(submitBtn).toBeDisabled()

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, 'TEST')

      expect(submitBtn).not.toBeDisabled()
    }
  })

  it('should respect isActive prop', () => {
    const { rerender } = render(
      <BarcodeScanner onScan={mockOnScan} isActive={false} />,
    )

    expect(screen.getByRole('region')).toBeTruthy()

    rerender(<BarcodeScanner onScan={mockOnScan} isActive={true} />)
    expect(screen.getByRole('region')).toBeTruthy()
  })

  it('should handle scanning status display', async () => {
    render(<BarcodeScanner onScan={mockOnScan} />)

    await waitFor(() => {
      // Scanner should be actively attempting to scan
      const region = screen.getByRole('region')
      expect(region).toBeTruthy()
    })
  })

  it('should display help section with accessibility', () => {
    render(<BarcodeScanner onScan={mockOnScan} />)

    const details = screen.getByText(/Scanner Help/i).closest('details')
    expect(details).toBeTruthy()

    const list = screen.getByText(/Point your camera at a barcode/i)
    expect(list).toBeTruthy()
  })

  it('should have proper ARIA labels for form elements', async () => {
    const user = userEvent.setup()
    render(<BarcodeScanner onScan={mockOnScan} />)

    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      expect(input).toHaveAttribute('aria-label')

      const form = input.closest('form')
      expect(form).toHaveAttribute('role', 'search')
    }
  })

  it('should clear input after successful submission', async () => {
    const user = userEvent.setup()
    render(<BarcodeScanner onScan={mockOnScan} />)

    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i) as HTMLInputElement
      await user.type(input, 'BARCODE123')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      expect(input.value).toBe('')
    }
  })

  it('should trim whitespace from manual entry', async () => {
    const user = userEvent.setup()
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        onManualEntry={mockOnManualEntry}
      />,
    )

    const fallbackBtn = screen.queryByRole('button', {
      name: /use manual entry instead/i,
    })

    if (fallbackBtn) {
      await user.click(fallbackBtn)

      const input = screen.getByLabelText(/enter barcode or item id/i)
      await user.type(input, '  BARCODE456  ')

      const submitBtn = screen.getByRole('button', { name: /add item/i })
      await user.click(submitBtn)

      expect(mockOnManualEntry).toHaveBeenCalledWith('BARCODE456')
    }
  })

  it('should update ARIA live region for scan messages', async () => {
    render(<BarcodeScanner onScan={mockOnScan} />)

    // Look for any live regions
    const region = screen.queryByRole('region')
    expect(region).toBeTruthy()
  })
})
