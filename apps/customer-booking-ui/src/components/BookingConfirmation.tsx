'use client';

import React from 'react';
import Link from 'next/link';
import { BookingConfirmation as BookingConfirmationType } from '@types/booking';
import { formatDateTime } from '@lib/date-utils';
import styles from './BookingConfirmation.module.css';

interface BookingConfirmationProps {
  booking: BookingConfirmationType;
  onBookAnother?: () => void;
  isLoading?: boolean;
}

export function BookingConfirmation({
  booking,
  onBookAnother,
  isLoading = false,
}: BookingConfirmationProps) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Processing your booking...</div>
      </div>
    );
  }

  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={`${styles.iconContainer} ${isConfirmed ? styles.success : styles.pending}`}>
          {isConfirmed ? '✓' : '⏳'}
        </div>

        <h1 className={styles.title}>
          {isConfirmed ? 'Booking Confirmed!' : 'Booking Submitted'}
        </h1>

        <p className={styles.subtitle}>
          {isConfirmed
            ? 'Your appointment has been confirmed.'
            : 'Your booking is being processed. You will receive a confirmation email shortly.'}
        </p>

        <div className={styles.details}>
          <div className={styles.detailsHeader}>
            <h2>Booking Details</h2>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>Booking ID</span>
            <span className={styles.value} aria-label={`Booking ID: ${booking.bookingId}`}>
              {booking.bookingId}
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>Scheduled Time</span>
            <span
              className={styles.value}
              aria-label={`Scheduled for ${formatDateTime(booking.scheduledTime)}`}
            >
              {formatDateTime(booking.scheduledTime)}
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>Customer Name</span>
            <span className={styles.value}>{booking.customerName}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{booking.customerEmail}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>Status</span>
            <span className={`${styles.value} ${styles.status} ${styles[booking.status]}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
        </div>

        <div className={styles.message}>
          <p>
            A confirmation email has been sent to <strong>{booking.customerEmail}</strong>. Please
            check your inbox (and spam folder) for further details.
          </p>
        </div>

        <div className={styles.actions}>
          {onBookAnother && (
            <button onClick={onBookAnother} className={styles.primaryButton}>
              Book Another Appointment
            </button>
          )}
          <Link href="/" className={styles.secondaryButton}>
            Back to Home
          </Link>
        </div>
      </div>

      <div className={styles.nextSteps}>
        <h3>Next Steps</h3>
        <ul>
          <li>
            <strong>Save your booking ID:</strong> You may need it for rescheduling or cancellations
          </li>
          <li>
            <strong>Arrive early:</strong> Please arrive 5-10 minutes before your appointment
          </li>
          <li>
            <strong>Questions?:</strong> Contact us via email or phone using the details in your
            confirmation email
          </li>
        </ul>
      </div>
    </div>
  );
}
