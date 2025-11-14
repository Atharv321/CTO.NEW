import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, Result } from '@zxing/library'

export interface BarcodeScanResult {
  data: string
  format: string
  timestamp: number
}

export interface UseBarcodeScanOptions {
  onScan: (result: BarcodeScanResult) => void
  onError?: (error: Error) => void
}

export function useBarcodeScan(
  videoRef: React.RefObject<HTMLVideoElement>,
  options: UseBarcodeScanOptions,
) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef(false)

  const startScan = async () => {
    if (scanningRef.current || !videoRef.current) {
      return
    }

    try {
      setError(null)
      scanningRef.current = true
      setIsScanning(true)

      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      if (devices.length === 0) {
        throw new Error('No video input devices found')
      }

      const codeReader = new BrowserMultiFormatReader()
      const selectedDeviceId = devices[0].deviceId

      await codeReader.decodeFromVideoElement(
        selectedDeviceId,
        videoRef.current,
        (result: Result | null, error: Error | null) => {
          if (result && result.getText()) {
            options.onScan({
              data: result.getText(),
              format: result.getFormatName(),
              timestamp: Date.now(),
            })
          }
          if (error && scanningRef.current) {
            // Ignore "not found" errors - they're normal during scanning
            if (!error.message?.includes('No barcode could be detected')) {
              console.debug('Barcode scan debug info:', error.message)
            }
          }
        },
      )

      readerRef.current = codeReader
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options.onError?.(error)
      scanningRef.current = false
      setIsScanning(false)
    }
  }

  const stopScan = async () => {
    scanningRef.current = false
    setIsScanning(false)

    if (readerRef.current) {
      await readerRef.current.reset()
      readerRef.current = null
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    return () => {
      stopScan()
    }
  }, [])

  return {
    isScanning,
    error,
    startScan,
    stopScan,
  }
}
