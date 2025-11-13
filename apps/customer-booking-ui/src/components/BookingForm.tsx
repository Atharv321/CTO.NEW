'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookingFormSchema, BookingFormSchemaType } from '@lib/validation';
import { Service, Barber, TimeSlot } from '@types/booking';
import styles from './BookingForm.module.css';

interface BookingFormProps {
  service?: Service;
  barber?: Barber;
  timeSlot?: TimeSlot;
  onSubmit: (data: BookingFormSchemaType) => Promise<void>;
  isSubmitting?: boolean;
  error?: Error | null;
  isLoading?: boolean;
}

export function BookingForm({
  service,
  barber,
  timeSlot,
  onSubmit,
  isSubmitting = false,
  error,
  isLoading = false,
}: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormSchemaType>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      serviceId: service?.id || '',
      barberId: barber?.id || '',
      timeSlotId: timeSlot?.id || '',
    },
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2>Step 4: Your Details</h2>
        <div className={styles.loading}>Loading form...</div>
      </div>
    );
  }

  if (!service || !barber || !timeSlot) {
    return (
      <div className={styles.container}>
        <h2>Step 4: Your Details</h2>
        <div className={styles.placeholder}>
          Please complete the previous steps first.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Step 4: Your Details</h2>

      <div className={styles.summary}>
        <h3>Booking Summary</h3>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Service:</span>
          <span className={styles.value}>{service.name}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Barber:</span>
          <span className={styles.value}>{barber.name}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Duration:</span>
          <span className={styles.value}>{service.durationMinutes} minutes</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Price:</span>
          <span className={styles.value}>${service.price}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <input type="hidden" {...register('serviceId')} value={service.id} />
        <input type="hidden" {...register('barberId')} value={barber.id} />
        <input type="hidden" {...register('timeSlotId')} value={timeSlot.id} />

        <div className={styles.formGroup}>
          <label htmlFor="customerName">Full Name *</label>
          <input
            id="customerName"
            type="text"
            placeholder="John Doe"
            {...register('customerName')}
            className={errors.customerName ? styles.inputError : ''}
            aria-describedby={errors.customerName ? 'customerName-error' : undefined}
          />
          {errors.customerName && (
            <span id="customerName-error" className={styles.error} role="alert">
              {errors.customerName.message}
            </span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="customerEmail">Email *</label>
          <input
            id="customerEmail"
            type="email"
            placeholder="john@example.com"
            {...register('customerEmail')}
            className={errors.customerEmail ? styles.inputError : ''}
            aria-describedby={errors.customerEmail ? 'customerEmail-error' : undefined}
          />
          {errors.customerEmail && (
            <span id="customerEmail-error" className={styles.error} role="alert">
              {errors.customerEmail.message}
            </span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="customerPhone">Phone Number *</label>
          <input
            id="customerPhone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...register('customerPhone')}
            className={errors.customerPhone ? styles.inputError : ''}
            aria-describedby={errors.customerPhone ? 'customerPhone-error' : undefined}
          />
          {errors.customerPhone && (
            <span id="customerPhone-error" className={styles.error} role="alert">
              {errors.customerPhone.message}
            </span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes">Additional Notes (Optional)</label>
          <textarea
            id="notes"
            placeholder="Any special requests or allergies? Let us know!"
            rows={4}
            {...register('notes')}
            className={errors.notes ? styles.inputError : ''}
            aria-describedby={errors.notes ? 'notes-error' : undefined}
          />
          {errors.notes && (
            <span id="notes-error" className={styles.error} role="alert">
              {errors.notes.message}
            </span>
          )}
        </div>

        {error && (
          <div className={styles.apiError} role="alert">
            {error.message || 'An error occurred while creating your booking. Please try again.'}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
