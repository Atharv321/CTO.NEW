'use client';

import React from 'react';
import { useAvailableSlots } from '@hooks/useBookingQueries';
import { TimeSlot } from '@types/booking';
import { formatTime, toDateString } from '@lib/date-utils';
import styles from './TimeSlotSelection.module.css';

interface TimeSlotSelectionProps {
  barberId?: string;
  date?: Date;
  selectedSlotId?: string;
  onSlotSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function TimeSlotSelection({
  barberId,
  date,
  selectedSlotId,
  onSlotSelect,
  isLoading,
  error,
}: TimeSlotSelectionProps) {
  const dateString = date ? toDateString(date) : '';
  const {
    data: slots,
    isLoading: isSlotsLoading,
    error: slotsError,
  } = useAvailableSlots(barberId || '', dateString);

  const displayLoading = isLoading || isSlotsLoading;
  const displayError = error || slotsError;
  const availableSlots = slots?.filter((slot) => slot.isAvailable) || [];

  if (!barberId || !date) {
    return (
      <div className={styles.container}>
        <h2>Step 3: Select a Time Slot</h2>
        <div className={styles.placeholder}>
          Please select a barber and date first.
        </div>
      </div>
    );
  }

  if (displayLoading) {
    return (
      <div className={styles.container}>
        <h2>Step 3: Select a Time Slot</h2>
        <div className={styles.loading}>Loading available time slots...</div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className={styles.container}>
        <h2>Step 3: Select a Time Slot</h2>
        <div className={styles.error} role="alert">
          Failed to load time slots. Please try again later.
        </div>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className={styles.container}>
        <h2>Step 3: Select a Time Slot</h2>
        <div className={styles.noSlots} role="status">
          No available time slots for this date and barber. Please choose a different date or barber.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Step 3: Select a Time Slot</h2>
      <div
        className={styles.slotsGrid}
        role="listbox"
        aria-label="Available time slots"
      >
        {availableSlots.map((slot) => (
          <button
            key={slot.id}
            className={`${styles.slotButton} ${
              selectedSlotId === slot.id ? styles.selected : ''
            }`}
            onClick={() => onSlotSelect(slot)}
            aria-pressed={selectedSlotId === slot.id}
            aria-label={`${formatTime(slot.startTime)} to ${formatTime(slot.endTime)}`}
          >
            <span className={styles.startTime}>{formatTime(slot.startTime)}</span>
            <span className={styles.separator}>—</span>
            <span className={styles.endTime}>{formatTime(slot.endTime)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
