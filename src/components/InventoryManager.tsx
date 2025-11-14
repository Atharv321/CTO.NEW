import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import '../styles/InventoryManager.css'

type StockHealth = 'healthy' | 'low' | 'out'

interface Supplier {
  id: string
  name: string
  website: string
  contactEmail: string
}

export interface InventoryLocation {
  id: string
  name: string
  quantity: number
  reorderPoint: number
}

export interface InventoryAuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  delta: number
  locationId: string
  closingBalance: number
  note?: string
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  supplierId: string
  status: 'active' | 'archived'
  uom: string
  safetyStock: number
  lastUpdated: string
  locations: InventoryLocation[]
  audits: InventoryAuditEntry[]
}

export interface InventoryManagerPermissions {
  canAdjustStock: boolean
  canViewAuditLogs: boolean
  canUseScanner: boolean
}

export interface InventoryManagerProps {
  onItemsChange?: (items: InventoryItem[]) => void
  initialItems?: InventoryItem[]
  permissions?: Partial<InventoryManagerPermissions>
  optimisticDelayMs?: number
}

type StockStateFilter = 'all' | StockHealth

type FilterState = {
  query: string
  supplierId: string
  stockState: StockStateFilter
}

type StockMovementMode = 'add' | 'remove'

interface StockMovementPayload {
  itemId: string
  locationId: string
  direction: StockMovementMode
  quantity: number
  reason: string
}

interface MovementModalState {
  itemId: string
  locationId: string
  mode: StockMovementMode
}

const SUPPLIERS: Record<string, Supplier> = {
  'sup-acme': {
    id: 'sup-acme',
    name: 'Acme Industrial Supply',
    website: 'https://suppliers.example.com/acme-industrial',
    contactEmail: 'orders@acme-industrial.example.com',
  },
  'sup-brightline': {
    id: 'sup-brightline',
    name: 'Brightline Distribution',
    website: 'https://suppliers.example.com/brightline',
    contactEmail: 'support@brightline.example.com',
  },
  'sup-northern': {
    id: 'sup-northern',
    name: 'Northern Manufacturing Co.',
    website: 'https://suppliers.example.com/northern-manufacturing',
    contactEmail: 'hello@northern.example.com',
  },
}

const DEFAULT_ITEMS: InventoryItem[] = [
  {
    id: 'item-precision-widget',
    name: 'Precision Widget A1',
    sku: 'PW-A1',
    barcode: '123456789',
    category: 'Widgets',
    supplierId: 'sup-acme',
    status: 'active',
    uom: 'units',
    safetyStock: 120,
    lastUpdated: '2024-02-14T09:30:00.000Z',
    locations: [
      { id: 'loc-main', name: 'Main Warehouse', quantity: 142, reorderPoint: 80 },
      { id: 'loc-retail', name: 'Downtown Retail', quantity: 24, reorderPoint: 20 },
    ],
    audits: [
      {
        id: 'audit-precision-1',
        timestamp: '2024-02-14T09:30:00.000Z',
        user: 'Sam Lee',
        action: 'Stock Increase',
        delta: 18,
        locationId: 'loc-main',
        closingBalance: 142,
        note: 'PO-4312 received',
      },
      {
        id: 'audit-precision-2',
        timestamp: '2024-02-12T16:10:00.000Z',
        user: 'Priya Patel',
        action: 'Stock Transfer Out',
        delta: -12,
        locationId: 'loc-main',
        closingBalance: 124,
        note: 'Transfer to Downtown Retail',
      },
      {
        id: 'audit-precision-3',
        timestamp: '2024-02-09T08:40:00.000Z',
        user: 'Naoko Ito',
        action: 'Cycle Count Adjustment',
        delta: 4,
        locationId: 'loc-retail',
        closingBalance: 24,
        note: 'Q1 cycle count',
      },
    ],
  },
  {
    id: 'item-smart-sensor',
    name: 'Smart Sensor Pack',
    sku: 'SSP-200',
    barcode: '987654321',
    category: 'Sensors',
    supplierId: 'sup-brightline',
    status: 'active',
    uom: 'kits',
    safetyStock: 60,
    lastUpdated: '2024-02-10T14:45:00.000Z',
    locations: [
      { id: 'loc-main', name: 'Main Warehouse', quantity: 38, reorderPoint: 40 },
      { id: 'loc-east', name: 'East Side Hub', quantity: 8, reorderPoint: 15 },
      { id: 'loc-service', name: 'Service Vans', quantity: 12, reorderPoint: 10 },
    ],
    audits: [
      {
        id: 'audit-sensor-1',
        timestamp: '2024-02-10T14:45:00.000Z',
        user: 'Jordan Mills',
        action: 'Stock Decrease',
        delta: -6,
        locationId: 'loc-east',
        closingBalance: 8,
        note: 'Service deployment',
      },
      {
        id: 'audit-sensor-2',
        timestamp: '2024-02-08T10:15:00.000Z',
        user: 'Sam Lee',
        action: 'Stock Increase',
        delta: 20,
        locationId: 'loc-main',
        closingBalance: 44,
        note: 'PO-1298 received',
      },
    ],
  },
  {
    id: 'item-legacy-gear',
    name: 'Legacy Gear Assembly',
    sku: 'LGA-42',
    barcode: '555555555',
    category: 'Mechanical',
    supplierId: 'sup-northern',
    status: 'archived',
    uom: 'sets',
    safetyStock: 30,
    lastUpdated: '2024-02-05T11:20:00.000Z',
    locations: [
      { id: 'loc-main', name: 'Main Warehouse', quantity: 12, reorderPoint: 25 },
      { id: 'loc-outlet', name: 'Outlet Store', quantity: 0, reorderPoint: 8 },
    ],
    audits: [
      {
        id: 'audit-legacy-1',
        timestamp: '2024-02-05T11:20:00.000Z',
        user: 'Priya Patel',
        action: 'Cycle Count Adjustment',
        delta: -3,
        locationId: 'loc-main',
        closingBalance: 12,
        note: 'Inventory recount variance',
      },
      {
        id: 'audit-legacy-2',
        timestamp: '2024-01-28T09:05:00.000Z',
        user: 'Sam Lee',
        action: 'Stock Transfer Out',
        delta: -5,
        locationId: 'loc-main',
        closingBalance: 15,
        note: 'Transfer to Outlet Store',
      },
    ],
  },
]

const DEFAULT_PERMISSIONS: InventoryManagerPermissions = {
  canAdjustStock: true,
  canViewAuditLogs: true,
  canUseScanner: true,
}

const STOCK_STATE_OPTIONS: Array<{ value: StockStateFilter; label: string }> = [
  { value: 'all', label: 'All stock states' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
]

const STOCK_STATUS_LABELS: Record<StockHealth, string> = {
  healthy: 'Healthy',
  low: 'Low stock',
  out: 'Out of stock',
}

const BADGE_VARIANTS: Record<StockHealth, string> = {
  healthy: 'badge--healthy',
  low: 'badge--warning',
  out: 'badge--danger',
}

const DEFAULT_FILTERS: FilterState = {
  query: '',
  supplierId: 'all',
  stockState: 'all',
}

const simulateNetwork = (delay: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delay)
  })

function createDefaultItems(): InventoryItem[] {
  return DEFAULT_ITEMS.map((item) => ({
    ...item,
    locations: item.locations.map((location) => ({ ...location })),
    audits: item.audits.map((audit) => ({ ...audit })),
  }))
}

function calculateTotalQuantity(item: InventoryItem) {
  return item.locations.reduce((sum, location) => sum + location.quantity, 0)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getStockHealth(item: InventoryItem): StockHealth {
  const total = calculateTotalQuantity(item)
  if (total === 0) {
    return 'out'
  }
  if (total <= item.safetyStock) {
    return 'low'
  }
  const hasLocationBelowThreshold = item.locations.some(
    (location) => location.quantity <= location.reorderPoint,
  )
  return hasLocationBelowThreshold ? 'low' : 'healthy'
}

function formatDelta(value: number) {
  if (value > 0) {
    return `+${formatNumber(value)}`
  }
  return formatNumber(value)
}

type FilterChangeHandler = <K extends keyof FilterState>(
  key: K,
  value: FilterState[K],
) => void

interface FilterBarProps {
  filters: FilterState
  supplierIds: string[]
  suppliers: Record<string, Supplier>
  onChange: FilterChangeHandler
  onReset: () => void
}

function FilterBar({ filters, supplierIds, suppliers, onChange, onReset }: FilterBarProps) {
  const hasActiveFilters =
    filters.query.trim() !== '' || filters.supplierId !== 'all' || filters.stockState !== 'all'

  return (
    <section className="filter-bar" aria-label="Inventory filters">
      <div className="filter-field">
        <label htmlFor="filter-search">Search</label>
        <input
          id="filter-search"
          type="search"
          placeholder="Search by item, SKU, or barcode"
          value={filters.query}
          onChange={(event) => onChange('query', event.target.value)}
          data-testid="filter-search"
        />
      </div>
      <div className="filter-field">
        <label htmlFor="filter-supplier">Supplier</label>
        <select
          id="filter-supplier"
          value={filters.supplierId}
          onChange={(event) => onChange('supplierId', event.target.value)}
          data-testid="filter-supplier"
        >
          <option value="all">All suppliers</option>
          {supplierIds.map((supplierId) => (
            <option key={supplierId} value={supplierId}>
              {suppliers[supplierId]?.name ?? supplierId}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-stock">Stock state</label>
        <select
          id="filter-stock"
          value={filters.stockState}
          onChange={(event) =>
            onChange('stockState', event.target.value as StockStateFilter)
          }
          data-testid="filter-stock"
        >
          {STOCK_STATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onReset}
          disabled={!hasActiveFilters}
        >
          Reset filters
        </button>
      </div>
    </section>
  )
}

interface ItemListViewProps {
  items: InventoryItem[]
  suppliers: Record<string, Supplier>
  onSelectItem: (itemId: string) => void
  summary: {
    totalUnits: number
    lowStock: number
    activeItems: number
  }
}

function ItemListView({ items, suppliers, onSelectItem, summary }: ItemListViewProps) {
  return (
    <>
      <section className="inventory-summary" data-testid="inventory-summary">
        <div className="summary-card">
          <span className="summary-label">Active items</span>
          <span className="summary-value" data-testid="summary-active">
            {formatNumber(summary.activeItems)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total units on hand</span>
          <span className="summary-value" data-testid="summary-units">
            {formatNumber(summary.totalUnits)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Items needing attention</span>
          <span className="summary-value" data-testid="summary-low">
            {formatNumber(summary.lowStock)}
          </span>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="empty-state" role="status">
          <h2>No items match the current filters</h2>
          <p>Try adjusting the filters or resetting them to see all inventory.</p>
        </div>
      ) : (
        <div className="item-grid" data-testid="inventory-list">
          {items.map((item) => {
            const supplier = suppliers[item.supplierId]
            const stockHealth = getStockHealth(item)
            const totalOnHand = calculateTotalQuantity(item)
            return (
              <article
                key={item.id}
                className="item-card"
                data-testid={`item-card-${item.id}`}
              >
                <header className="item-card-header">
                  <div>
                    <h2>{item.name}</h2>
                    <div className="item-metadata">
                      <span>SKU {item.sku}</span>
                      <span>Barcode {item.barcode}</span>
                    </div>
                    <span className={`badge ${BADGE_VARIANTS[stockHealth]}`}>
                      {STOCK_STATUS_LABELS[stockHealth]}
                    </span>
                  </div>
                  <div className="item-card-stats">
                    <span className="stat-value">
                      {formatNumber(totalOnHand)} {item.uom}
                    </span>
                    <span className="stat-label">Across {item.locations.length} locations</span>
                  </div>
                </header>

                <div className="item-card-body">
                  <p className="item-supplier">
                    Supplier:{' '}
                    {supplier ? (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {supplier.name}
                      </a>
                    ) : (
                      'Unknown supplier'
                    )}
                  </p>
                  <ul className="item-locations" aria-label="Stock by location">
                    {item.locations.map((location) => (
                      <li key={`${item.id}-${location.id}`}>
                        <span>{location.name}</span>
                        <span>{formatNumber(location.quantity)} {item.uom}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <footer className="item-card-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onSelectItem(item.id)}
                    aria-label={`View details for ${item.name}`}
                  >
                    View details
                  </button>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

interface ItemDetailViewProps {
  item: InventoryItem
  supplier?: Supplier
  onBack: () => void
  onOpenMovementModal: (locationId: string, mode: StockMovementMode) => void
  canAdjustStock: boolean
  canViewAuditLogs: boolean
  canUseScanner: boolean
  pendingAdjustments: Record<string, boolean>
}

function ItemDetailView({
  item,
  supplier,
  onBack,
  onOpenMovementModal,
  canAdjustStock,
  canViewAuditLogs,
  canUseScanner,
  pendingAdjustments,
}: ItemDetailViewProps) {
  const totalOnHand = calculateTotalQuantity(item)
  const stockHealth = getStockHealth(item)
  const locationNameLookup = item.locations.reduce<Record<string, string>>(
    (accumulator, location) => {
      return { ...accumulator, [location.id]: location.name }
    },
    {},
  )

  return (
    <section className="detail-view" data-testid="item-detail">
      <button type="button" className="link-button" onClick={onBack}>
        ← Back to list
      </button>

      <header className="detail-header">
        <div>
          <h2>{item.name}</h2>
          <p className="detail-meta">
            SKU {item.sku} • Barcode {item.barcode} • Category {item.category}
          </p>
          <span className={`badge ${BADGE_VARIANTS[stockHealth]}`}>
            {STOCK_STATUS_LABELS[stockHealth]}
          </span>
        </div>
        <div className="detail-actions">
          {supplier && (
            <a
              className="btn btn-link"
              href={supplier.website}
              target="_blank"
              rel="noreferrer"
              data-testid="supplier-link"
            >
              Visit {supplier.name}
            </a>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canUseScanner}
            data-testid="scan-placeholder"
          >
            {canUseScanner ? 'Launch scanner (coming soon)' : 'Scanner access restricted'}
          </button>
        </div>
      </header>

      {supplier && (
        <div className="supplier-panel" role="note">
          <h3>Supplier details</h3>
          <p>
            {supplier.name} • <a href={`mailto:${supplier.contactEmail}`}>{supplier.contactEmail}</a>
          </p>
        </div>
      )}

      <section className="detail-summary" aria-label="Item summary">
        <div className="detail-summary-card">
          <span className="summary-label">Total on hand</span>
          <span className="summary-value">{formatNumber(totalOnHand)} {item.uom}</span>
        </div>
        <div className="detail-summary-card">
          <span className="summary-label">Safety stock</span>
          <span className="summary-value">{formatNumber(item.safetyStock)} {item.uom}</span>
        </div>
        <div className="detail-summary-card">
          <span className="summary-label">Last updated</span>
          <span className="summary-value">{formatDate(item.lastUpdated)}</span>
        </div>
      </section>

      <section className="location-section" aria-label="Stock by location">
        <div className="section-header">
          <h3>Stock by location</h3>
          <p>Review and adjust on-hand quantities across all locations.</p>
        </div>
        <table className="location-table">
          <thead>
            <tr>
              <th scope="col">Location</th>
              <th scope="col">On hand</th>
              <th scope="col">Reorder point</th>
              <th scope="col">Status</th>
              <th scope="col" className="actions-column">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {item.locations.map((location) => {
              const pendingKey = `${item.id}:${location.id}`
              const isPending = Boolean(pendingAdjustments[pendingKey])
              const statusVariant = location.quantity === 0 ? 'badge--danger' : location.quantity <= location.reorderPoint ? 'badge--warning' : 'badge--healthy'
              const statusLabel = location.quantity === 0 ? 'Out of stock' : location.quantity <= location.reorderPoint ? 'Below reorder' : 'Healthy'
              return (
                <tr key={location.id} data-testid={`location-row-${location.id}`}>
                  <th scope="row">
                    <div className="location-cell">
                      <span>{location.name}</span>
                      {isPending && <span className="chip chip--pending">Saving…</span>}
                    </div>
                  </th>
                  <td>{formatNumber(location.quantity)} {item.uom}</td>
                  <td>{formatNumber(location.reorderPoint)} {item.uom}</td>
                  <td>
                    <span className={`badge ${statusVariant}`}>{statusLabel}</span>
                  </td>
                  <td className="actions-column">
                    <button
                      type="button"
                      className="btn btn-tertiary"
                      onClick={() => onOpenMovementModal(location.id, 'add')}
                      disabled={!canAdjustStock}
                      aria-label={`Adjust stock for ${item.name} at ${location.name}`}
                    >
                      Adjust stock
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!canAdjustStock && (
          <p className="hint" role="note">
            You do not have permission to adjust stock levels.
          </p>
        )}
      </section>

      <section className="audit-section" aria-label="Audit history">
        <div className="section-header">
          <h3>Audit history</h3>
          <p>Track every movement for full traceability.</p>
        </div>
        {canViewAuditLogs ? (
          item.audits.length === 0 ? (
            <p>No audit history available yet.</p>
          ) : (
            <table className="audit-table" data-testid="audit-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">User</th>
                  <th scope="col">Action</th>
                  <th scope="col">Location</th>
                  <th scope="col">Change</th>
                  <th scope="col">Balance</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {item.audits.map((audit) => (
                  <tr key={audit.id}>
                    <td>{formatDate(audit.timestamp)}</td>
                    <td>{audit.user}</td>
                    <td>{audit.action}</td>
                    <td>{locationNameLookup[audit.locationId] ?? audit.locationId}</td>
                    <td>{formatDelta(audit.delta)} {item.uom}</td>
                    <td>{formatNumber(audit.closingBalance)} {item.uom}</td>
                    <td>{audit.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <div className="alert" role="alert">
            Audit history is hidden because you do not have permission to view it.
          </div>
        )}
      </section>
    </section>
  )
}

interface StockMovementModalProps {
  item: InventoryItem
  locationId: string
  defaultMode: StockMovementMode
  onClose: () => void
  onSubmit: (payload: StockMovementPayload) => Promise<void>
}

function StockMovementModal({ item, locationId, defaultMode, onClose, onSubmit }: StockMovementModalProps) {
  const [selectedLocation, setSelectedLocation] = useState(locationId)
  const [mode, setMode] = useState<StockMovementMode>(defaultMode)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const location = item.locations.find((loc) => loc.id === selectedLocation) ?? item.locations[0]

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!location) {
      setError('Select a location to adjust stock.')
      return
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }
    if (reason.trim() === '') {
      setError('Reason is required for audit history.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        itemId: item.id,
        locationId: location.id,
        direction: mode,
        quantity,
        reason: reason.trim(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-movement-title"
      >
        <header className="modal-header">
          <h2 id="stock-movement-title">Adjust stock</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close stock movement modal">
            ×
          </button>
        </header>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <label htmlFor="movement-location">Location</label>
            <select
              id="movement-location"
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
            >
              {item.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="form-row">
            <legend>Movement type</legend>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle ${mode === 'add' ? 'toggle--active' : ''}`}
                onClick={() => setMode('add')}
              >
                Add stock
              </button>
              <button
                type="button"
                className={`toggle ${mode === 'remove' ? 'toggle--active' : ''}`}
                onClick={() => setMode('remove')}
              >
                Remove stock
              </button>
            </div>
          </fieldset>

          <div className="form-row">
            <label htmlFor="movement-quantity">Quantity ({item.uom})</label>
            <input
              id="movement-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
            {location && mode === 'remove' && (
              <p className="hint">Available: {formatNumber(location.quantity)} {item.uom}</p>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="movement-reason">Reason</label>
            <input
              id="movement-reason"
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Cycle count adjustment"
            />
          </div>

          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function InventoryManager({
  onItemsChange,
  initialItems,
  permissions: permissionOverrides,
  optimisticDelayMs = 600,
}: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems
    }
    return createDefaultItems()
  })
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [movementModal, setMovementModal] = useState<MovementModalState | null>(null)
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const permissions = useMemo<InventoryManagerPermissions>(
    () => ({ ...DEFAULT_PERMISSIONS, ...permissionOverrides }),
    [permissionOverrides],
  )

  const supplierIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.supplierId).filter(Boolean))),
    [items],
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = filters.query
        ? [item.name, item.sku, item.barcode]
            .join(' ')
            .toLowerCase()
            .includes(filters.query.toLowerCase())
        : true
      const matchesSupplier =
        filters.supplierId === 'all' || item.supplierId === filters.supplierId
      const stockHealth = getStockHealth(item)
      const matchesStock =
        filters.stockState === 'all' || stockHealth === filters.stockState
      return matchesQuery && matchesSupplier && matchesStock
    })
  }, [filters, items])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  )

  const summary = useMemo(() => {
    const totalUnits = filteredItems.reduce(
      (sum, item) => sum + calculateTotalQuantity(item),
      0,
    )
    const lowStockCount = filteredItems.filter(
      (item) => getStockHealth(item) !== 'healthy',
    ).length
    const activeItems = filteredItems.filter((item) => item.status === 'active').length
    return { totalUnits, lowStock: lowStockCount, activeItems }
  }, [filteredItems])

  const handleFilterChange: FilterChangeHandler = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId)
    setMovementModal(null)
  }

  const handleBackToList = () => {
    setSelectedItemId(null)
    setMovementModal(null)
  }

  const handleOpenMovementModal = (locationId: string, mode: StockMovementMode) => {
    if (!permissions.canAdjustStock || !selectedItemId) {
      return
    }
    setMovementModal({ itemId: selectedItemId, locationId, mode })
  }

  const handleMovementSubmit = async (payload: StockMovementPayload) => {
    setToast('Saving stock movement…')
    setError(null)
    const adjustmentKey = `${payload.itemId}:${payload.locationId}`
    const previousItems = items

    setPendingAdjustments((current) => ({ ...current, [adjustmentKey]: true }))

    let updatedItems: InventoryItem[] = []
    setItems((current) => {
      updatedItems = current.map((item) => {
        if (item.id !== payload.itemId) {
          return item
        }
        const now = new Date().toISOString()
        const delta = payload.direction === 'add' ? payload.quantity : -payload.quantity
        const locations = item.locations.map((location) => {
          if (location.id !== payload.locationId) {
            return { ...location }
          }
          return {
            ...location,
            quantity: Math.max(0, location.quantity + delta),
          }
        })
        const targetLocation = locations.find(
          (location) => location.id === payload.locationId,
        )
        const newAudit: InventoryAuditEntry | null = targetLocation
          ? {
              id: `audit-${Date.now()}`,
              timestamp: now,
              user: 'You',
              action: payload.direction === 'add' ? 'Stock Increase' : 'Stock Decrease',
              delta,
              locationId: payload.locationId,
              closingBalance: targetLocation.quantity,
              note: payload.reason,
            }
          : null
        return {
          ...item,
          locations,
          lastUpdated: now,
          audits: newAudit ? [newAudit, ...item.audits] : item.audits,
        }
      })
      return updatedItems
    })

    onItemsChange?.(updatedItems)
    setMovementModal(null)

    try {
      await simulateNetwork(optimisticDelayMs)
      setToast('Stock movement saved')
    } catch (err) {
      setItems(previousItems)
      onItemsChange?.(previousItems)
      setToast(null)
      setError('Unable to save stock movement. Changes were reverted.')
    } finally {
      setPendingAdjustments((current) => {
        const { [adjustmentKey]: _removed, ...rest } = current
        return rest
      })
    }
  }

  return (
    <div className="inventory-manager">
      <header className="inventory-header">
        <div className="header-inner">
          <h1>Inventory Management</h1>
          <p className="subtitle">
            Monitor multi-location stock, perform adjustments, and review audit history.
          </p>
        </div>
      </header>

      <main className="inventory-content">
        {toast && (
          <div className="notification notification--success" role="status">
            {toast}
          </div>
        )}
        {error && (
          <div className="notification notification--error" role="alert">
            {error}
          </div>
        )}

        <FilterBar
          filters={filters}
          supplierIds={supplierIds}
          suppliers={SUPPLIERS}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {selectedItem && (
          <ItemDetailView
            item={selectedItem}
            supplier={SUPPLIERS[selectedItem.supplierId]}
            onBack={handleBackToList}
            onOpenMovementModal={handleOpenMovementModal}
            canAdjustStock={permissions.canAdjustStock}
            canViewAuditLogs={permissions.canViewAuditLogs}
            canUseScanner={permissions.canUseScanner}
            pendingAdjustments={pendingAdjustments}
          />
        )}

        {!selectedItem && (
          <ItemListView
            items={filteredItems}
            suppliers={SUPPLIERS}
            onSelectItem={handleSelectItem}
            summary={summary}
          />
        )}
      </main>

      {movementModal && selectedItem && permissions.canAdjustStock && (
        <StockMovementModal
          item={selectedItem}
          locationId={movementModal.locationId}
          defaultMode={movementModal.mode}
          onClose={() => setMovementModal(null)}
          onSubmit={handleMovementSubmit}
        />
      )}
    </div>
  )
}
