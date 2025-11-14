import { useState } from 'react'
import { BarcodeScanner, BarcodeScannerProps } from './BarcodeScanner'
import { BarcodeScanResult } from '../hooks/useBarcodeScan'
import '../styles/InventoryManager.css'

export interface InventoryItem {
  id: string
  barcode: string
  name: string
  quantity: number
  lastScanned?: number
  source: 'scan' | 'manual'
}

export interface InventoryManagerProps {
  onItemsChange?: (items: InventoryItem[]) => void
  initialItems?: InventoryItem[]
}

// Mock database of items
const ITEM_DATABASE: Record<string, Omit<InventoryItem, 'id' | 'quantity' | 'lastScanned' | 'source'>> = {
  '123456789': { barcode: '123456789', name: 'Widget A' },
  '987654321': { barcode: '987654321', name: 'Widget B' },
  '555555555': { barcode: '555555555', name: 'Gadget X' },
  'QR_001': { barcode: 'QR_001', name: 'Premium Tool' },
}

export function InventoryManager({
  onItemsChange,
  initialItems = [],
}: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [lastScanMessage, setLastScanMessage] = useState<string>('')

  const handleScan = (result: BarcodeScanResult) => {
    const barcode = result.data
    const existingItem = items.find((item) => item.barcode === barcode)

    if (existingItem) {
      const updatedItems = items.map((item) =>
        item.barcode === barcode
          ? {
              ...item,
              quantity: item.quantity + 1,
              lastScanned: result.timestamp,
            }
          : item,
      )
      setItems(updatedItems)
      onItemsChange?.(updatedItems)
      setLastScanMessage(`Updated ${existingItem.name}`)
    } else {
      const itemData = ITEM_DATABASE[barcode]
      if (itemData) {
        const newItem: InventoryItem = {
          id: `${barcode}_${Date.now()}`,
          ...itemData,
          quantity: 1,
          lastScanned: result.timestamp,
          source: result.format === 'MANUAL_ENTRY' ? 'manual' : 'scan',
        }
        const updatedItems = [...items, newItem]
        setItems(updatedItems)
        onItemsChange?.(updatedItems)
        setLastScanMessage(`Added ${itemData.name}`)
      } else {
        setLastScanMessage(`Item not found: ${barcode}`)
      }
    }
  }

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = items.filter((item) => item.id !== itemId)
    setItems(updatedItems)
    onItemsChange?.(updatedItems)
  }

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    const updatedItems = items
      .map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      )
      .filter((item) => item.quantity > 0)
    setItems(updatedItems)
    onItemsChange?.(updatedItems)
  }

  return (
    <div className="inventory-manager">
      <div className="inventory-header">
        <h1>Inventory Management</h1>
        <p className="subtitle">Scan barcodes or enter items manually</p>
      </div>

      <div className="inventory-content">
        <div className="scanner-section">
          <BarcodeScanner onScan={handleScan} ariaLabel="Add items by barcode" />
        </div>

        <div className="inventory-section">
          {lastScanMessage && (
            <div
              className="scan-message"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {lastScanMessage}
            </div>
          )}

          {items.length === 0 ? (
            <div className="empty-state">
              <p>No items added yet. Scan a barcode or use manual entry.</p>
            </div>
          ) : (
            <div className="items-list">
              <div className="items-header">
                <h2>Items ({items.length})</h2>
              </div>
              <div className="items-container">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="item-card"
                    data-testid={`item-${item.id}`}
                  >
                    <div className="item-content">
                      <div className="item-info">
                        <h3 className="item-name">{item.name}</h3>
                        <p className="item-barcode">
                          Barcode: <code>{item.barcode}</code>
                        </p>
                        {item.source === 'manual' && (
                          <p className="item-source">Added manually</p>
                        )}
                      </div>
                      <div className="item-quantity">
                        <button
                          type="button"
                          className="qty-btn qty-minus"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQty = Math.max(
                              0,
                              parseInt(e.target.value) || 0,
                            )
                            const currentQty = item.quantity
                            handleUpdateQuantity(
                              item.id,
                              newQty - currentQty,
                            )
                          }}
                          className="qty-input"
                          aria-label={`${item.name} quantity`}
                        />
                        <button
                          type="button"
                          className="qty-btn qty-plus"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`Remove ${item.name} from inventory`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="inventory-summary">
                <h3>Summary</h3>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Total Items:</span>
                    <span className="stat-value">{items.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Units:</span>
                    <span className="stat-value">
                      {items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
