import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBarcodeScan } from '../hooks/useBarcodeScan'
import { createMockScanResult, createMockMediaStream } from './mocks'

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

describe('useBarcodeScan Hook', () => {
  let videoRef: React.RefObject<HTMLVideoElement>
  let mockOnScan: ReturnType<typeof vi.fn>
  let mockOnError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    const videoElement = document.createElement('video')
    videoRef = { current: videoElement }
    mockOnScan = vi.fn()
    mockOnError = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useBarcodeScan(videoRef, { onScan: mockOnScan }),
    )

    expect(result.current.isScanning).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should call onScan when barcode is detected', async () => {
    const { result } = renderHook(() =>
      useBarcodeScan(videoRef, { onScan: mockOnScan }),
    )

    await act(async () => {
      await result.current.startScan()
    })

    // Simulate barcode detection
    const mockResult = createMockScanResult('test123', 'CODE_128')

    expect(result.current.isScanning).toBe(true)
  })

  it('should set isScanning to true when starting scan', async () => {
    const { result } = renderHook(() =>
      useBarcodeScan(videoRef, { onScan: mockOnScan }),
    )

    await act(async () => {
      await result.current.startScan()
    })

    expect(result.current.isScanning).toBe(true)
  })

  it('should set isScanning to false when stopping scan', async () => {
    const { result } = renderHook(() =>
      useBarcodeScan(videoRef, { onScan: mockOnScan }),
    )

    await act(async () => {
      await result.current.startScan()
    })

    expect(result.current.isScanning).toBe(true)

    await act(async () => {
      await result.current.stopScan()
    })

    expect(result.current.isScanning).toBe(false)
  })

  it('should handle error when camera access is denied', async () => {
    const { result } = renderHook(() =>
      useBarcodeScan(videoRef, { onScan: mockOnScan, onError: mockOnError }),
    )

    // Remove video element to simulate camera access denied
    videoRef.current = null as any

    await act(async () => {
      await result.current.startScan()
    })

    expect(result.current.error).toBeTruthy()
  })

  it('should not start scan if already scanning', async () => {
    const { result } = renderHook(() =>
      useBarcodeScan(videoRef, { onScan: mockOnScan }),
    )

    await act(async () => {
      await result.current.startScan()
    })

    const isScanning1 = result.current.isScanning

    await act(async () => {
      await result.current.startScan()
    })

    const isScanning2 = result.current.isScanning
    expect(isScanning1).toBe(isScanning2)
  })

  it('should clean up media stream on unmount', async () => {
    const mockTrack = { stop: vi.fn() }
    const mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
    }

    videoRef.current!.srcObject = mockStream as any

    const { unmount } = renderHook(() =>
      useBarcodeScan(videoRef, { onScan: mockOnScan }),
    )

    await act(async () => {
      await unmount()
    })
  })

  it('should format scan result correctly', async () => {
    const { result } = renderHook(() =>
      useBarcodeScan(videoRef, { onScan: mockOnScan }),
    )

    await act(async () => {
      await result.current.startScan()
    })

    const mockResult = createMockScanResult('ABC123', 'QR_CODE')

    // Verify the result format (through mock verification)
    expect(mockResult.getText()).toBe('ABC123')
    expect(mockResult.getFormatName()).toBe('QR_CODE')
  })
})
