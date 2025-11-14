import { useState, useEffect } from 'react'

export interface DashboardSummary {
  lowStockCount: number
  totalValuation: number
  totalItems: number
  totalUnits: number
  lastUpdated: string
}

export interface TurnoverData {
  month: string
  turnover: number
  itemsSold: number
}

export interface StockLevel {
  category: string
  currentStock: number
  minStock: number
  maxStock: number
}

export interface Alert {
  id: string
  type: 'low_stock' | 'valuation' | 'general'
  severity: 'high' | 'medium' | 'info'
  message: string
  category: string
  currentStock?: number
  minStock?: number
  timestamp: string
}

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/analytics/summary')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const summary = await response.json()
        setData(summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard summary')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

export function useTurnoverData() {
  const [data, setData] = useState<TurnoverData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/analytics/turnover')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const turnover = await response.json()
        setData(turnover)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch turnover data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

export function useStockLevels() {
  const [data, setData] = useState<StockLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/analytics/stock-levels')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const stockLevels = await response.json()
        setData(stockLevels)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stock levels')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

export function useAlerts() {
  const [data, setData] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/analytics/alerts')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const alerts = await response.json()
        setData(alerts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}