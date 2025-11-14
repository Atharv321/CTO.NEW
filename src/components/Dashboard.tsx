import { useDashboardSummary, useTurnoverData, useStockLevels, useAlerts } from '../hooks/useDashboardData'
import { SummaryCards } from './SummaryCards'
import { TurnoverChart } from './TurnoverChart'
import { StockLevelsChart } from './StockLevelsChart'
import { AlertsWidget } from './AlertsWidget'
import '../styles/Dashboard.css'

export function Dashboard() {
  const { data: summaryData, loading: summaryLoading, error: summaryError } = useDashboardSummary()
  const { data: turnoverData, loading: turnoverLoading, error: turnoverError } = useTurnoverData()
  const { data: stockLevelsData, loading: stockLevelsLoading, error: stockLevelsError } = useStockLevels()
  const { data: alertsData, loading: alertsLoading, error: alertsError } = useAlerts()

  const hasAnyLoading = summaryLoading || turnoverLoading || stockLevelsLoading || alertsLoading
  const hasAnyError = summaryError || turnoverError || stockLevelsError || alertsError

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Inventory Dashboard</h1>
        <p className="dashboard__subtitle">
          Real-time analytics and insights for your inventory management
        </p>
      </div>

      {hasAnyError && (
        <div className="dashboard__error-banner">
          <span className="dashboard__error-icon">⚠️</span>
          <span className="dashboard__error-message">
            Some dashboard data failed to load. Please refresh the page.
          </span>
        </div>
      )}

      {hasAnyLoading && (
        <div className="dashboard__loading-banner">
          <span className="dashboard__loading-icon">⟳</span>
          <span className="dashboard__loading-message">
            Updating dashboard data...
          </span>
        </div>
      )}

      <div className="dashboard__content">
        <div className="dashboard__section">
          <SummaryCards 
            data={summaryData} 
            loading={summaryLoading} 
            error={summaryError} 
          />
        </div>

        <div className="dashboard__grid">
          <div className="dashboard__grid-item dashboard__grid-item--chart">
            <TurnoverChart 
              data={turnoverData} 
              loading={turnoverLoading} 
              error={turnoverError} 
            />
          </div>

          <div className="dashboard__grid-item dashboard__grid-item--chart">
            <StockLevelsChart 
              data={stockLevelsData} 
              loading={stockLevelsLoading} 
              error={stockLevelsError} 
            />
          </div>
        </div>

        <div className="dashboard__section">
          <AlertsWidget 
            data={alertsData} 
            loading={alertsLoading} 
            error={alertsError} 
          />
        </div>
      </div>

      <div className="dashboard__footer">
        <p className="dashboard__last-updated">
          {summaryData?.lastUpdated && (
            <>Last updated: {new Date(summaryData.lastUpdated).toLocaleString()}</>
          )}
        </p>
      </div>
    </div>
  )
}