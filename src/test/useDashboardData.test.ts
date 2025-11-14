import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  useDashboardSummary, 
  useTurnoverData, 
  useStockLevels, 
  useAlerts 
} from '../hooks/useDashboardData'

// Mock fetch
global.fetch = vi.fn()

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useDashboardSummary', () => {
    it('should fetch and return dashboard summary data', async () => {
      const mockData = {
        lowStockCount: 12,
        totalValuation: 45890.50,
        totalItems: 156,
        totalUnits: 1247,
        lastUpdated: '2023-12-01T10:00:00Z'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const { result } = renderHook(() => useDashboardSummary())

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBe(null)
    })

    it('should handle fetch error', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useDashboardSummary())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('Network error')
    })

    it('should handle HTTP error response', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const { result } = renderHook(() => useDashboardSummary())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('HTTP error! status: 500')
    })
  })

  describe('useTurnoverData', () => {
    it('should fetch and return turnover data', async () => {
      const mockData = [
        { month: 'Jan', turnover: 35000, itemsSold: 75 },
        { month: 'Feb', turnover: 42000, itemsSold: 89 }
      ]

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const { result } = renderHook(() => useTurnoverData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBe(null)
    })
  })

  describe('useStockLevels', () => {
    it('should fetch and return stock levels data', async () => {
      const mockData = [
        { category: 'Electronics', currentStock: 45, minStock: 20, maxStock: 100 },
        { category: 'Tools', currentStock: 8, minStock: 15, maxStock: 50 }
      ]

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const { result } = renderHook(() => useStockLevels())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBe(null)
    })
  })

  describe('useAlerts', () => {
    it('should fetch and return alerts data', async () => {
      const mockData = [
        {
          id: '1',
          type: 'low_stock',
          severity: 'high',
          message: 'Tools category is critically low on stock',
          category: 'Tools',
          currentStock: 8,
          minStock: 15,
          timestamp: '2023-12-01T08:00:00Z'
        }
      ]

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const { result } = renderHook(() => useAlerts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBe(null)
    })
  })
})