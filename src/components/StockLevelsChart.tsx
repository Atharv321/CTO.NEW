import { StockLevel } from '../hooks/useDashboardData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import '../styles/StockLevelsChart.css'

interface StockLevelsChartProps {
  data: StockLevel[]
  loading: boolean
  error: string | null
}

export function StockLevelsChart({ data, loading, error }: StockLevelsChartProps) {
  if (loading) {
    return (
      <div className="stock-levels-chart">
        <div className="stock-levels-chart__loading">Loading stock levels...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stock-levels-chart">
        <div className="stock-levels-chart__error">Error loading stock levels: {error}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="stock-levels-chart">
        <div className="stock-levels-chart__empty">No stock level data available</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="stock-levels-chart__tooltip">
          <p className="stock-levels-chart__tooltip-label">{label}</p>
          <p className="stock-levels-chart__tooltip-value">
            Current: <strong>{data.currentStock}</strong>
          </p>
          <p className="stock-levels-chart__tooltip-value">
            Min: {data.minStock} | Max: {data.maxStock}
          </p>
          <p className="stock-levels-chart__tooltip-status">
            Status: <span className={`stock-levels-chart__status-indicator stock-levels-chart__status-indicator--${data.currentStock <= data.minStock ? 'low' : data.currentStock >= data.maxStock ? 'high' : 'normal'}`}>
              {data.currentStock <= data.minStock ? '⚠️ Low' : data.currentStock >= data.maxStock ? '📦 High' : '✅ Normal'}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  const getBarColor = (currentStock: number, minStock: number, maxStock: number) => {
    if (currentStock <= minStock) return '#ef5350' // error color
    if (currentStock >= maxStock) return '#ff9800' // warning color
    return '#4caf50' // success color
  }

  return (
    <div className="stock-levels-chart">
      <div className="stock-levels-chart__header">
        <h2 className="stock-levels-chart__title">Stock Levels by Category</h2>
      </div>

      <div className="stock-levels-chart__content">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="category" 
              stroke="#666"
              tick={{ fill: '#666' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#666"
              tick={{ fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="currentStock" 
              name="Current Stock"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.currentStock, entry.minStock, entry.maxStock)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="stock-levels-chart__legend">
        <div className="stock-levels-chart__legend-item">
          <div className="stock-levels-chart__legend-color stock-levels-chart__legend-color--low"></div>
          <span>Low Stock</span>
        </div>
        <div className="stock-levels-chart__legend-item">
          <div className="stock-levels-chart__legend-color stock-levels-chart__legend-color--normal"></div>
          <span>Normal</span>
        </div>
        <div className="stock-levels-chart__legend-item">
          <div className="stock-levels-chart__legend-color stock-levels-chart__legend-color--high"></div>
          <span>Overstocked</span>
        </div>
      </div>
    </div>
  )
}