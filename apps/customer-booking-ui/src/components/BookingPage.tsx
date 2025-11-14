'use client';

import React, { useState } from 'react';
import { Service, Barber, TimeSlot, BookingFormSchemaType, BookingConfirmation } from '@types/booking';
import { ServiceSelection } from './ServiceSelection';
import { BarberDateSelection } from './BarberDateSelection';
import { TimeSlotSelection } from './TimeSlotSelection';
import { BookingForm } from './BookingForm';
import { BookingConfirmation as ConfirmationDisplay } from './BookingConfirmation';
import { useCreateBooking } from '@hooks/useBookingQueries';
import { toDateString } from '@lib/date-utils';
import styles from './BookingPage.module.css';

type BookingStep = 'service' | 'barber-date' | 'time-slot' | 'form' | 'confirmation';

export function BookingPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [selectedBarber, setSelectedBarber] = useState<Barber | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>();
  const [confirmation, setConfirmation] = useState<BookingConfirmation | undefined>();
  const [formError, setFormError] = useState<Error | null>(null);

  const { mutate: createBooking, isPending } = useCreateBooking();

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep('barber-date');
    scrollToTop();
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDateBarberConfirm = () => {
    if (selectedBarber && selectedDate) {
      setCurrentStep('time-slot');
      scrollToTop();
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setCurrentStep('form');
    scrollToTop();
  };

  const handleFormSubmit = async (data: BookingFormSchemaType) => {
    setFormError(null);

    createBooking(
      {
        serviceId: data.serviceId,
        barberId: data.barberId,
        timeSlotId: data.timeSlotId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        notes: data.notes,
      },
      {
        onSuccess: (result) => {
          setConfirmation(result);
          setCurrentStep('confirmation');
          scrollToTop();
        },
        onError: (error: Error) => {
          setFormError(error);
        },
      }
    );
  };

  const handleBookAnother = () => {
    setCurrentStep('service');
    setSelectedService(undefined);
    setSelectedBarber(undefined);
    setSelectedDate(undefined);
    setSelectedTimeSlot(undefined);
    setConfirmation(undefined);
    setFormError(null);
    scrollToTop();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${
              currentStep === 'service'
                ? '20%'
                : currentStep === 'barber-date'
                  ? '40%'
                  : currentStep === 'time-slot'
                    ? '60%'
                    : currentStep === 'form'
                      ? '80%'
                      : '100%'
            }`,
          }}
          aria-label={`Booking progress: ${
            currentStep === 'service'
              ? '20%'
              : currentStep === 'barber-date'
                ? '40%'
                : currentStep === 'time-slot'
                  ? '60%'
                  : currentStep === 'form'
                    ? '80%'
                    : '100%'
          } complete`}
        />
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {currentStep === 'service' && (
          <ServiceSelection onServiceSelect={handleServiceSelect} />
        )}

        {currentStep === 'barber-date' && (
          <div>
            <BarberDateSelection
              selectedBarberId={selectedBarber?.id}
              selectedDate={selectedDate}
              onBarberSelect={handleBarberSelect}
              onDateSelect={handleDateSelect}
            />
            {selectedBarber && selectedDate && (
              <div className={styles.nextButton}>
                <button onClick={handleDateBarberConfirm} className={styles.continueButton}>
                  Continue to Time Slots
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'time-slot' && (
          <div>
            <TimeSlotSelection
              barberId={selectedBarber?.id}
              date={selectedDate}
              selectedSlotId={selectedTimeSlot?.id}
              onSlotSelect={handleTimeSlotSelect}
            />
            {selectedTimeSlot && (
              <div className={styles.nextButton}>
                <button onClick={() => setCurrentStep('form')} className={styles.continueButton}>
                  Continue to Details
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'form' && (
          <BookingForm
            service={selectedService}
            barber={selectedBarber}
            timeSlot={selectedTimeSlot}
            onSubmit={handleFormSubmit}
            isSubmitting={isPending}
            error={formError}
          />
        )}

        {currentStep === 'confirmation' && confirmation && (
          <ConfirmationDisplay
            booking={confirmation}
            onBookAnother={handleBookAnother}
            isLoading={false}
          />
        )}
      </div>

      {/* Navigation buttons */}
      {currentStep !== 'confirmation' && (
        <div className={styles.navigation}>
          {currentStep !== 'service' && (
            <button
              onClick={() => {
                if (currentStep === 'barber-date') {
                  setCurrentStep('service');
                } else if (currentStep === 'time-slot') {
                  setCurrentStep('barber-date');
                } else if (currentStep === 'form') {
                  setCurrentStep('time-slot');
                }
                scrollToTop();
              }}
              className={styles.backButton}
            >
              ← Back
            </button>
          )}
        </div>
      )}
    </div>
  );
}
