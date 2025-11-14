import { useEffect, useRef, useState } from 'react'
import { useBarcodeScan, BarcodeScanResult } from '../hooks/useBarcodeScan'
import '../styles/BarcodeScanner.css'

export interface BarcodeScannerProps {
  onScan: (result: BarcodeScanResult) => void
  onManualEntry?: (value: string) => void
  isActive?: boolean
  ariaLabel?: string
}

export function BarcodeScanner({
  onScan,
  onManualEntry,
  isActive = true,
  ariaLabel = 'Barcode Scanner',
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)
  const [showFallback, setShowFallback] = useState(false)
  const [manualValue, setManualValue] = useState('')

  const { isScanning, error, startScan, stopScan } = useBarcodeScan(videoRef, {
    onScan: (result) => {
      setManualValue('')
      onScan(result)
    },
    onError: (err) => {
      console.error('Scanner error:', err)
      setShowFallback(true)
    },
  })

  useEffect(() => {
    if (isActive && !isScanning) {
      startScan()
    }
    return () => {
      stopScan()
    }
  }, [isActive])

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (manualValue.trim()) {
      onManualEntry?.(manualValue.trim())
      onScan({
        data: manualValue.trim(),
        format: 'MANUAL_ENTRY',
        timestamp: Date.now(),
      })
      setManualValue('')
    }
  }

  const handleToggleFallback = () => {
    setShowFallback(!showFallback)
  }

  return (
    <div className="barcode-scanner" role="region" aria-label={ariaLabel}>
      {error && (
        <div className="scanner-error" role="alert">
          <p>Camera access denied or unavailable</p>
          <button
            type="button"
            onClick={handleToggleFallback}
            className="btn-primary"
            aria-label="Switch to manual entry"
          >
            Use Manual Entry Instead
          </button>
        </div>
      )}

      {!showFallback && !error && (
        <div className="scanner-container">
          <video
            ref={videoRef}
            className="scanner-video"
            playsInline
            aria-label="Barcode scanner video feed"
          />
          <div className="scanner-overlay">
            <div className="scanner-frame" aria-hidden="true" />
          </div>
          {isScanning && (
            <div className="scanner-status" aria-live="polite">
              <span className="status-indicator" />
              Scanning...
            </div>
          )}
        </div>
      )}

      {(showFallback || error) && (
        <form
          onSubmit={handleManualSubmit}
          className="manual-entry-form"
          role="search"
        >
          <div className="form-group">
            <label htmlFor="manual-barcode" className="form-label">
              Enter Barcode or Item ID
            </label>
            <input
              ref={manualInputRef}
              id="manual-barcode"
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="Scan or type barcode/item ID"
              className="form-input"
              aria-label="Barcode or item ID input"
              autoComplete="off"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!manualValue.trim()}
            className="btn-primary"
            aria-label="Submit barcode entry"
          >
            Add Item
          </button>
          {!error && (
            <button
              type="button"
              onClick={handleToggleFallback}
              className="btn-secondary"
              aria-label="Return to camera scanning"
            >
              Back to Camera
            </button>
          )}
        </form>
      )}

      <div className="scanner-info" role="complementary">
        <details>
          <summary>Scanner Help</summary>
          <ul>
            <li>Point your camera at a barcode or QR code</li>
            <li>Keep the code within the frame</li>
            <li>
              Items will be added automatically when a code is recognized
            </li>
            <li>Use manual entry if camera is unavailable</li>
            <li>Works best in good lighting conditions</li>
          </ul>
        </details>
      </div>
    </div>
  )
}
