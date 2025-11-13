# Dashboard UI Documentation

## Overview

The Dashboard UI provides a comprehensive view of inventory metrics, turnover charts, and system alerts. It is designed to be responsive, accessible, and highly reusable.

## Features

### 1. Summary Metrics (MetricCard)
- Display key metrics like low-stock count, total valuation, turnover rate
- Support for multiple format types:
  - `number`: Standard number formatting with locale
  - `currency`: USD currency formatting
  - `percentage`: Percentage with decimal precision
  - `duration`: Time duration in minutes
- Change indicators with up/down arrows
- Helper text for additional context

### 2. Charts

#### LineChart
- Multi-series line chart visualization
- SVG-based rendering for performance
- Configurable grid lines
- Interactive tooltips on hover
- Legend support for multiple series
- Responsive design

#### BarChart
- Grouped bar chart visualization
- Support for multiple series comparison
- Hover tooltips with exact values
- Legend for series identification
- Responsive bar sizing

### 3. Alerts Widget
- Displays recent alerts with severity levels:
  - `critical`: Red - Urgent action required
  - `warning`: Orange - Attention needed
  - `info`: Blue - Informational
  - `success`: Green - Positive updates
- Relative timestamp formatting
- Optional call-to-action links
- Configurable maximum display count
- Empty state handling

### 4. Dashboard Page
- Orchestrates all dashboard components
- Loading states with skeleton UI
- Error states with retry functionality
- Automatic data refresh every 10 minutes
- Last updated timestamp
- Fully responsive layout

## File Structure

```
src/
├── components/
│   └── dashboard/
│       ├── DashboardPage.tsx           # Main dashboard orchestrator
│       ├── DashboardPage.module.css
│       ├── MetricCard.tsx              # Summary metric cards
│       ├── MetricCard.module.css
│       ├── LineChart.tsx               # Line chart component
│       ├── LineChart.module.css
│       ├── BarChart.tsx                # Bar chart component
│       ├── BarChart.module.css
│       ├── AlertsWidget.tsx            # Alerts display widget
│       ├── AlertsWidget.module.css
│       └── index.ts
├── types/
│   └── dashboard.ts                    # TypeScript type definitions
├── hooks/
│   └── useDashboardQueries.ts          # React Query hooks
├── lib/
│   ├── api-client.ts                   # API client with dashboard endpoint
│   └── mock-dashboard-data.ts          # Mock data for development
└── __tests__/
    └── components/
        └── dashboard/
            ├── DashboardPage.test.tsx
            ├── MetricCard.test.tsx
            ├── LineChart.test.tsx
            ├── BarChart.test.tsx
            └── AlertsWidget.test.tsx
```

## Usage

### Basic Usage

```tsx
import { DashboardPage } from '@components/dashboard';
import { Layout } from '@components/Layout';

export default function Dashboard() {
  return (
    <Layout>
      <DashboardPage />
    </Layout>
  );
}
```

### Using Individual Components

```tsx
import { MetricCard, LineChart, AlertsWidget } from '@components/dashboard';

// Metric Card
<MetricCard metric={{
  id: 'revenue',
  label: 'Total Revenue',
  value: 45000,
  format: 'currency',
  change: 8.5,
  changeDirection: 'up'
}} />

// Line Chart
<LineChart 
  series={[{
    id: 'sales',
    label: 'Sales',
    data: [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 150 }
    ]
  }]}
  height={300}
  showGrid={true}
/>

// Alerts Widget
<AlertsWidget alerts={[
  {
    id: '1',
    severity: 'critical',
    title: 'Low Stock',
    message: 'Item XYZ is running low',
    timestamp: new Date().toISOString()
  }
]} />
```

## API Integration

The dashboard expects a `GET /api/analytics/dashboard` endpoint that returns:

```typescript
{
  summary: SummaryMetric[];
  turnover: DashboardChart[];
  alerts: DashboardAlert[];
  lastUpdated: string;
}
```

### Mock Data

For development without a backend, the dashboard uses mock data from `src/lib/mock-dashboard-data.ts`. This is automatically used as placeholder data while the real API is loading.

## Testing

All components have comprehensive unit tests:

```bash
# Run all dashboard tests
pnpm test dashboard

# Run specific component test
pnpm test MetricCard

# Run in watch mode
pnpm test:watch
```

## Accessibility

- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Friendly**: Semantic HTML and descriptive labels
- **Color Contrast**: Meets WCAG AA standards
- **Focus Management**: Visible focus indicators

## Responsive Design

- **Desktop**: Multi-column grid layout
- **Tablet** (≤1024px): Simplified chart grid
- **Mobile** (≤768px): Single column stacked layout
- **Touch-Friendly**: Adequate touch target sizes

## Performance

- **React Query Caching**: 5-minute stale time, 10-minute refetch interval
- **SVG Charts**: Lightweight vector graphics
- **CSS Modules**: Scoped styles prevent conflicts
- **Code Splitting**: Components can be lazy-loaded

## Customization

### Styling

All components use CSS Modules. Override styles by:
1. Creating a custom CSS module
2. Importing and merging class names
3. Using CSS variables for theme colors

### Chart Colors

Default colors use HSL values that can be customized:
```css
/* In your CSS Module */
.customChart {
  --chart-primary: #667eea;
  --chart-secondary: #764ba2;
}
```

## Future Enhancements

- [ ] Date range picker for custom time periods
- [ ] Export dashboard to PDF/CSV
- [ ] Real-time WebSocket updates
- [ ] More chart types (pie, scatter, area)
- [ ] Dashboard customization/drag-and-drop
- [ ] Dark mode support
- [ ] Alert filtering and sorting

## Troubleshooting

### Dashboard not loading
- Check that the API endpoint is accessible
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check browser console for errors

### Charts not rendering
- Ensure series data is properly formatted
- Check that data values are valid numbers
- Verify CSS modules are loading correctly

### Tests failing
- Run `pnpm install` to ensure dependencies are up to date
- Clear Jest cache: `pnpm test --clearCache`
- Check mock implementations in test files
