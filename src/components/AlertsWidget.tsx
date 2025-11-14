import { Alert } from '../hooks/useDashboardData'
import '../styles/AlertsWidget.css'

interface AlertsWidgetProps {
  data: Alert[]
  loading: boolean
  error: string | null
}

export function AlertsWidget({ data, loading, error }: AlertsWidgetProps) {
  if (loading) {
    return (
      <div className="alerts-widget">
        <div className="alerts-widget__loading">Loading alerts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alerts-widget">
        <div className="alerts-widget__error">Error loading alerts: {error}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="alerts-widget">
        <div className="alerts-widget__empty">No alerts at this time</div>
      </div>
    )
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🚨'
      case 'medium':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return '📦'
      case 'valuation':
        return '💰'
      case 'general':
        return '📋'
      default:
        return '📋'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const sortedAlerts = [...data].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, info: 2 }
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return (
    <div className="alerts-widget">
      <div className="alerts-widget__header">
        <h2 className="alerts-widget__title">Alerts & Notifications</h2>
        <span className="alerts-widget__count">{data.length} active</span>
      </div>

      <div className="alerts-widget__list">
        {sortedAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`alerts-widget__item alerts-widget__item--${alert.severity}`}
          >
            <div className="alerts-widget__icon">
              <span className="alerts-widget__type-icon">
                {getAlertIcon(alert.type)}
              </span>
              <span className="alerts-widget__severity-icon">
                {getSeverityIcon(alert.severity)}
              </span>
            </div>

            <div className="alerts-widget__content">
              <div className="alerts-widget__message">
                {alert.message}
              </div>

              <div className="alerts-widget__details">
                {alert.category && (
                  <span className="alerts-widget__category">
                    {alert.category}
                  </span>
                )}
                {alert.currentStock !== undefined && alert.minStock !== undefined && (
                  <span className="alerts-widget__stock-info">
                    {alert.currentStock} / {alert.minStock} units
                  </span>
                )}
                <span className="alerts-widget__timestamp">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="alerts-widget__footer">
        <button className="alerts-widget__view-all-btn">
          View all alerts
        </button>
      </div>
    </div>
  )
}