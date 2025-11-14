import { vi } from 'vitest'
import { Result, BarcodeFormat } from '@zxing/library'

export function createMockScanResult(
  text: string,
  format: string = 'CODE_128',
): Result {
  const result = vi.fn() as any
  result.getText = vi.fn(() => text)
  result.getFormatName = vi.fn(() => format)
  result.getRawBytes = vi.fn(() => new Uint8Array())
  result.getResultPoints = vi.fn(() => [])
  result.getNumRawDataModules = vi.fn(() => 0)
  result.getResultMetadata = vi.fn(() => new Map())
  return result as Result
}

export function createMockMediaStream() {
  const mockTrack = {
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }

  const mockStream = {
    getTracks: vi.fn(() => [mockTrack]),
    getVideoTracks: vi.fn(() => [mockTrack]),
    getAudioTracks: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }

  return mockStream as any
}

export function mockBrowserMultiFormatReader() {
  const mockReader = {
    reset: vi.fn(async () => {}),
    decodeFromVideoElement: vi.fn(
      async (
        _deviceId: string,
        _videoElement: HTMLVideoElement,
        callback: (result: Result | null, error: Error | null) => void,
      ) => {
        // Store callback for manual triggering in tests
        mockReader._callback = callback
      },
    ),
    _callback: null as any,
  }

  return mockReader
}
