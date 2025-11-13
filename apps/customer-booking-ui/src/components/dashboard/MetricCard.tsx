'use client';

import React from 'react';
import { SummaryMetric } from '@types/dashboard';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  metric: SummaryMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const formatValue = (value: number, format?: SummaryMetric['format']): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        return `${value} min`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const getChangeColor = () => {
    if (!metric.change) return '';
    if (metric.changeDirection === 'up') return styles.positive;
    if (metric.changeDirection === 'down') return styles.negative;
    return '';
  };

  return (
    <div className={styles.card} role="article" aria-label={`${metric.label} metric`}>
      <div className={styles.header}>
        <h3 className={styles.label}>{metric.label}</h3>
      </div>
      <div className={styles.body}>
        <p className={styles.value} aria-label={`${metric.label} value`}>
          {formatValue(metric.value, metric.format)}
        </p>
        {metric.change !== undefined && (
          <div className={`${styles.change} ${getChangeColor()}`}>
            <span className={styles.changeIcon} aria-hidden="true">
              {metric.changeDirection === 'up' ? '↑' : '↓'}
            </span>
            <span className={styles.changeValue}>
              {Math.abs(metric.change)}%
            </span>
          </div>
        )}
      </div>
      {metric.helperText && (
        <p className={styles.helperText}>{metric.helperText}</p>
      )}
    </div>
  );
}
