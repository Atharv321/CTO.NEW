'use client';

import React, { useMemo } from 'react';
import { ChartSeries } from '@types/dashboard';
import styles from './BarChart.module.css';

interface BarChartProps {
  series: ChartSeries[];
  height?: number;
  showLegend?: boolean;
}

export function BarChart({ series, height = 300, showLegend = true }: BarChartProps) {
  const chartData = useMemo(() => {
    if (!series || series.length === 0) {
      return { maxValue: 0, bars: [] };
    }

    const allValues = series.flatMap(s => s.data.map(d => d.value));
    const maxValue = Math.max(...allValues, 0) || 1;

    const bars = series[0]?.data.map((point, idx) => ({
      label: point.label,
      values: series.map((s, seriesIdx) => ({
        value: s.data[idx]?.value || 0,
        percentage: ((s.data[idx]?.value || 0) / maxValue) * 100,
        color: s.color || `hsl(${seriesIdx * 60 + 220}, 70%, 55%)`,
        seriesLabel: s.label,
      })),
    })) || [];

    return { maxValue, bars };
  }, [series]);

  if (!series || series.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper} style={{ height }}>
        <div className={styles.chart}>
          {chartData.bars.map((bar, idx) => (
            <div key={idx} className={styles.barGroup}>
              <div className={styles.bars}>
                {bar.values.map((v, vIdx) => (
                  <div
                    key={vIdx}
                    className={styles.bar}
                    style={{ 
                      height: `${v.percentage}%`,
                      backgroundColor: v.color,
                    }}
                    role="img"
                    aria-label={`${v.seriesLabel}: ${v.value}`}
                  >
                    <div className={styles.barTooltip}>
                      {v.seriesLabel}: {v.value}
                    </div>
                  </div>
                ))}
              </div>
              <span className={styles.barLabel}>{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {showLegend && series.length > 1 && (
        <div className={styles.legend}>
          {series.map((s, idx) => (
            <div key={s.id || idx} className={styles.legendItem}>
              <span
                className={styles.legendColor}
                style={{ backgroundColor: s.color || `hsl(${idx * 60 + 220}, 70%, 55%)` }}
                aria-hidden="true"
              />
              <span className={styles.legendLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
