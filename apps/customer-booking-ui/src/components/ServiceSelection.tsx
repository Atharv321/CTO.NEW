'use client';

import React from 'react';
import { useServices } from '@hooks/useBookingQueries';
import { Service } from '@types/booking';
import styles from './ServiceSelection.module.css';

interface ServiceSelectionProps {
  selectedServiceId?: string;
  onServiceSelect: (service: Service) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function ServiceSelection({
  selectedServiceId,
  onServiceSelect,
  isLoading,
  error,
}: ServiceSelectionProps) {
  const { data: services, isLoading: isServicesLoading, error: servicesError } = useServices();

  const displayLoading = isLoading || isServicesLoading;
  const displayError = error || servicesError;

  if (displayLoading) {
    return (
      <div className={styles.container}>
        <h2>Select a Service</h2>
        <div className={styles.loading}>Loading services...</div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className={styles.container}>
        <h2>Select a Service</h2>
        <div className={styles.error} role="alert">
          Failed to load services. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Step 1: Select a Service</h2>
      <div
        className={styles.grid}
        role="listbox"
        aria-label="Available barber services"
      >
        {services?.map((service) => (
          <div
            key={service.id}
            className={`${styles.serviceCard} ${
              selectedServiceId === service.id ? styles.selected : ''
            }`}
            onClick={() => onServiceSelect(service)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onServiceSelect(service);
              }
            }}
            role="option"
            aria-selected={selectedServiceId === service.id}
            tabIndex={0}
          >
            {service.icon && (
              <div className={styles.icon} aria-hidden="true">
                {service.icon}
              </div>
            )}
            <h3 className={styles.serviceName}>{service.name}</h3>
            <p className={styles.description}>{service.description}</p>
            <div className={styles.meta}>
              <span className={styles.duration} aria-label={`Duration: ${service.durationMinutes} minutes`}>
                ⏱ {service.durationMinutes} min
              </span>
              <span className={styles.price} aria-label={`Price: $${service.price}`}>
                💰 ${service.price}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
