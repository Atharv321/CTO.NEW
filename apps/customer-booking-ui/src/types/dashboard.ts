export type MetricFormat = 'number' | 'currency' | 'percentage' | 'duration';

export interface SummaryMetric {
  id: string;
  label: string;
  value: number;
  format?: MetricFormat;
  change?: number;
  changeDirection?: 'up' | 'down';
  helperText?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  id: string;
  label: string;
  color?: string;
  data: ChartDataPoint[];
}

export interface DashboardChart {
  id: string;
  title: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  description?: string;
  type?: 'line' | 'bar';
  series: ChartSeries[];
}

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface DashboardData {
  summary: SummaryMetric[];
  turnover: DashboardChart[];
  alerts: DashboardAlert[];
  lastUpdated: string;
}
