'use client';

import React from 'react';
import { DashboardAlert } from '@types/dashboard';
import styles from './AlertsWidget.module.css';

interface AlertsWidgetProps {
  alerts: DashboardAlert[];
  maxDisplay?: number;
}

export function AlertsWidget({ alerts, maxDisplay = 5 }: AlertsWidgetProps) {
  const displayedAlerts = alerts.slice(0, maxDisplay);

  const getSeverityClass = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return styles.critical;
      case 'warning':
        return styles.warning;
      case 'success':
        return styles.success;
      case 'info':
      default:
        return styles.info;
    }
  };

  const getSeverityIcon = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (alerts.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Recent Alerts</h3>
        <div className={styles.emptyState}>
          <p>No alerts at this time</p>
          <span className={styles.emptyIcon}>🎉</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Alerts</h3>
        {alerts.length > maxDisplay && (
          <span className={styles.badge}>{alerts.length}</span>
        )}
      </div>
      <div className={styles.alertsList} role="list">
        {displayedAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`${styles.alert} ${getSeverityClass(alert.severity)}`}
            role="listitem"
          >
            <div className={styles.alertIcon} aria-hidden="true">
              {getSeverityIcon(alert.severity)}
            </div>
            <div className={styles.alertContent}>
              <div className={styles.alertHeader}>
                <h4 className={styles.alertTitle}>{alert.title}</h4>
                <span className={styles.alertTime}>
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
              <p className={styles.alertMessage}>{alert.message}</p>
              {alert.ctaLabel && alert.ctaHref && (
                <a
                  href={alert.ctaHref}
                  className={styles.alertCta}
                  aria-label={`${alert.ctaLabel} for ${alert.title}`}
                >
                  {alert.ctaLabel} →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
