'use client';

import React from 'react';
import { useDashboard } from '@hooks/useDashboardQueries';
import { SummaryMetric } from '@types/dashboard';
import { MetricCard } from './MetricCard';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { AlertsWidget } from './AlertsWidget';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className={styles.loadingState} role="status" aria-live="polite">
        <div className={styles.loadingHeader}>
          <div className={styles.loadingTitle} />
          <div className={styles.loadingSubtitle} />
        </div>
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className={styles.loadingCard} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.errorState} role="alert">
        <h2>Unable to load dashboard</h2>
        <p>{error?.message || 'Please try again later.'}</p>
        <button type="button" onClick={() => refetch()} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  const summaryMetrics: SummaryMetric[] = data.summary;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory Dashboard</h1>
          <p className={styles.subtitle}>
            Monitor stock health, valuation, and turnover performance in real-time.
          </p>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>Last updated</span>
          <time dateTime={data.lastUpdated} className={styles.metaValue}>
            {new Date(data.lastUpdated).toLocaleString()}
          </time>
        </div>
      </header>

      <section className={styles.metricsSection} aria-label="Key metrics">
        <div className={styles.metricsGrid}>
          {summaryMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      <section className={styles.chartsSection} aria-label="Turnover performance">
        <header className={styles.sectionHeader}>
          <h2>Turnover &amp; Valuation Trends</h2>
          <p>
            Understand how quickly inventory is moving and how valuation is evolving over different periods.
          </p>
        </header>
        <div className={styles.chartsGrid}>
          {data.turnover.map((chart) => (
            <article key={chart.id} className={styles.chartCard} aria-label={chart.title}>
              <div className={styles.chartHeader}>
                <div>
                  <h3>{chart.title}</h3>
                  {chart.description && <p>{chart.description}</p>}
                </div>
                <span className={styles.chartPeriod}>{chart.period}</span>
              </div>
              <div className={styles.chartContent}>
                {chart.type === 'bar' ? (
                  <BarChart series={chart.series} />
                ) : (
                  <LineChart series={chart.series} />
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.alertsSection} aria-label="Recent alerts">
        <AlertsWidget alerts={data.alerts} />
      </section>
    </div>
  );
}
