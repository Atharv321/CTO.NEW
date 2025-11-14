'use client';

import React, { useMemo } from 'react';
import { ChartSeries } from '@types/dashboard';
import styles from './LineChart.module.css';

interface LineChartProps {
  series: ChartSeries[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}

export function LineChart({ 
  series, 
  height = 300, 
  showGrid = true, 
  showLegend = true 
}: LineChartProps) {
  const chartData = useMemo(() => {
    if (!series || series.length === 0) {
      return { maxValue: 0, minValue: 0, allSeries: [] };
    }

    const allValues = series.flatMap(s => s.data.map(d => d.value));
    const maxValue = Math.max(...allValues, 0);
    const minValue = Math.min(...allValues, 0);
    const range = maxValue - minValue || 1;

    const allSeries = series.map(s => ({
      ...s,
      points: s.data.map((point, idx) => {
        const x = (idx / Math.max(s.data.length - 1, 1)) * 100;
        const y = ((maxValue - point.value) / range) * 100;
        return { x, y, ...point };
      }),
    }));

    return { maxValue, minValue, allSeries };
  }, [series]);

  const generatePath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return '';
    
    const path = points.map((point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    }).join(' ');
    
    return path;
  };

  if (!series || series.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No data available</p>
      </div>
    );
  }

  const axisLabels = series[0]?.data ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper} style={{ height }}>
        <svg
          className={styles.chart}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label="Line chart visualization"
        >
          {showGrid && (
            <g className={styles.grid}>
              {[0, 25, 50, 75, 100].map(y => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  className={styles.gridLine}
                />
              ))}
            </g>
          )}

          {chartData.allSeries.map((s, idx) => (
            <g key={s.id || idx}>
              <path
                d={generatePath(s.points)}
                className={styles.line}
                style={{ stroke: s.color || `hsl(${idx * 60}, 70%, 50%)` }}
                fill="none"
                strokeWidth="0.5"
              />
              {s.points.map((point, pointIdx) => (
                <circle
                  key={pointIdx}
                  cx={point.x}
                  cy={point.y}
                  r="1"
                  className={styles.point}
                  style={{ fill: s.color || `hsl(${idx * 60}, 70%, 50%)` }}
                  role="presentation"
                >
                  <title>{`${point.label}: ${point.value}`}</title>
                </circle>
              ))}
            </g>
          ))}
        </svg>

        <div className={styles.xAxis}>
          {axisLabels.map((point, idx) => (
            <span key={idx} className={styles.xLabel}>
              {point.label}
            </span>
          ))}
        </div>
      </div>

      {showLegend && series.length > 1 && (
        <div className={styles.legend}>
          {series.map((s, idx) => (
            <div key={s.id || idx} className={styles.legendItem}>
              <span
                className={styles.legendColor}
                style={{ backgroundColor: s.color || `hsl(${idx * 60}, 70%, 50%)` }}
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
