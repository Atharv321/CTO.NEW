import { TurnoverData } from '../hooks/useDashboardData'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import '../styles/TurnoverChart.css'

interface TurnoverChartProps {
  data: TurnoverData[]
  loading: boolean
  error: string | null
}

export function TurnoverChart({ data, loading, error }: TurnoverChartProps) {
  if (loading) {
    return (
      <div className="turnover-chart">
        <div className="turnover-chart__loading">Loading turnover data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="turnover-chart">
        <div className="turnover-chart__error">Error loading turnover data: {error}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="turnover-chart">
        <div className="turnover-chart__empty">No turnover data available</div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="turnover-chart__tooltip">
          <p className="turnover-chart__tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="turnover-chart__tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Turnover' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="turnover-chart">
      <div className="turnover-chart__header">
        <h2 className="turnover-chart__title">Monthly Turnover</h2>
        <div className="turnover-chart__legend">
          <div className="turnover-chart__legend-item">
            <div className="turnover-chart__legend-color" style={{ backgroundColor: '#4caf50' }}></div>
            <span>Turnover ($)</span>
          </div>
          <div className="turnover-chart__legend-item">
            <div className="turnover-chart__legend-color" style={{ backgroundColor: '#2196f3' }}></div>
            <span>Items Sold</span>
          </div>
        </div>
      </div>

      <div className="turnover-chart__content">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="month" 
              stroke="#666"
              tick={{ fill: '#666' }}
            />
            <YAxis 
              yAxisId="turnover"
              orientation="left"
              stroke="#666"
              tick={{ fill: '#666' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="items"
              orientation="right"
              stroke="#666"
              tick={{ fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="turnover"
              type="monotone"
              dataKey="turnover"
              stroke="#4caf50"
              strokeWidth={2}
              dot={{ fill: '#4caf50', r: 4 }}
              activeDot={{ r: 6 }}
              name="Turnover"
            />
            <Line
              yAxisId="items"
              type="monotone"
              dataKey="itemsSold"
              stroke="#2196f3"
              strokeWidth={2}
              dot={{ fill: '#2196f3', r: 4 }}
              activeDot={{ r: 6 }}
              name="Items Sold"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}