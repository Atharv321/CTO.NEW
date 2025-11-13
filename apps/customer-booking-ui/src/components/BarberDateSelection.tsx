'use client';

import React, { useState } from 'react';
import { useBarbers } from '@hooks/useBookingQueries';
import { Barber } from '@types/booking';
import { getNextDays, toDateString, formatDate, isSameDay } from '@lib/date-utils';
import styles from './BarberDateSelection.module.css';

interface BarberDateSelectionProps {
  selectedBarberId?: string;
  selectedDate?: string;
  onBarberSelect: (barber: Barber) => void;
  onDateSelect: (date: Date) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function BarberDateSelection({
  selectedBarberId,
  selectedDate,
  onBarberSelect,
  onDateSelect,
  isLoading,
  error,
}: BarberDateSelectionProps) {
  const { data: barbers, isLoading: isBarbersLoading, error: barbersError } = useBarbers();
  const [expandedBarber, setExpandedBarber] = useState<string | null>(null);

  const displayLoading = isLoading || isBarbersLoading;
  const displayError = error || barbersError;
  const nextDays = getNextDays(7);

  if (displayLoading) {
    return (
      <div className={styles.container}>
        <h2>Step 2: Choose Barber & Date</h2>
        <div className={styles.loading}>Loading barbers...</div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className={styles.container}>
        <h2>Step 2: Choose Barber & Date</h2>
        <div className={styles.error} role="alert">
          Failed to load barbers. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Step 2: Choose Barber & Date</h2>

      <div className={styles.barberSection}>
        <h3>Select a Barber</h3>
        <div className={styles.barberGrid} role="listbox" aria-label="Available barbers">
          {barbers?.map((barber) => (
            <div
              key={barber.id}
              className={`${styles.barberCard} ${
                selectedBarberId === barber.id ? styles.selected : ''
              }`}
              onClick={() => {
                onBarberSelect(barber);
                setExpandedBarber(barber.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBarberSelect(barber);
                  setExpandedBarber(barber.id);
                }
              }}
              role="option"
              aria-selected={selectedBarberId === barber.id}
              tabIndex={0}
            >
              {barber.avatar && (
                <img
                  src={barber.avatar}
                  alt={`${barber.name}'s avatar`}
                  className={styles.avatar}
                />
              )}
              <div className={styles.barberInfo}>
                <h4>{barber.name}</h4>
                <div className={styles.rating} aria-label={`Rating: ${barber.rating} out of 5`}>
                  ⭐ {barber.rating}/5
                </div>
                {barber.bio && <p className={styles.bio}>{barber.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBarberId && (
        <div className={styles.dateSection}>
          <h3>Select a Date</h3>
          <div
            className={styles.dateGrid}
            role="listbox"
            aria-label="Available dates"
          >
            {nextDays.map((date) => (
              <button
                key={toDateString(date)}
                className={`${styles.dateButton} ${
                  selectedDate && isSameDay(date, selectedDate) ? styles.dateSelected : ''
                }`}
                onClick={() => onDateSelect(date)}
                aria-pressed={selectedDate ? isSameDay(date, selectedDate) : false}
                aria-label={formatDate(date)}
              >
                <div className={styles.dateDay}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={styles.dateNum}>{date.getDate()}</div>
                <div className={styles.dateMonth}>
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
