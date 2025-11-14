import { DashboardSummary } from '../hooks/useDashboardData'
import '../styles/SummaryCards.css'

interface SummaryCardsProps {
  data: DashboardSummary | null
  loading: boolean
  error: string | null
}

export function SummaryCards({ data, loading, error }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="summary-cards">
        <div className="summary-cards__loading">Loading dashboard metrics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="summary-cards">
        <div className="summary-cards__error">Error loading metrics: {error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="summary-cards">
        <div className="summary-cards__empty">No data available</div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="summary-cards">
      <div className="summary-card">
        <div className="summary-card__icon summary-card__icon--low-stock">
          <span className="icon">⚠️</span>
        </div>
        <div className="summary-card__content">
          <h3 className="summary-card__title">Low Stock Items</h3>
          <p className="summary-card__value">{formatNumber(data.lowStockCount)}</p>
          <p className="summary-card__subtitle">Items need restocking</p>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-card__icon summary-card__icon--valuation">
          <span className="icon">💰</span>
        </div>
        <div className="summary-card__content">
          <h3 className="summary-card__title">Total Valuation</h3>
          <p className="summary-card__value">{formatCurrency(data.totalValuation)}</p>
          <p className="summary-card__subtitle">Current inventory value</p>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-card__icon summary-card__icon--items">
          <span className="icon">📦</span>
        </div>
        <div className="summary-card__content">
          <h3 className="summary-card__title">Total Items</h3>
          <p className="summary-card__value">{formatNumber(data.totalItems)}</p>
          <p className="summary-card__subtitle">Unique SKUs</p>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-card__icon summary-card__icon--units">
          <span className="icon">📊</span>
        </div>
        <div className="summary-card__content">
          <h3 className="summary-card__title">Total Units</h3>
          <p className="summary-card__value">{formatNumber(data.totalUnits)}</p>
          <p className="summary-card__subtitle">All items combined</p>
        </div>
      </div>
    </div>
  )
}