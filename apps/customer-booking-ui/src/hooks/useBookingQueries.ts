import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import {
  Service,
  Barber,
  TimeSlot,
  BookingFormData,
  BookingConfirmation,
} from '@types/booking';

const QUERY_KEYS = {
  services: ['services'],
  barbers: ['barbers'],
  timeSlots: (barberId: string, date: string) => ['timeSlots', barberId, date],
  booking: (id: string) => ['booking', id],
};

// Services
export function useServices() {
  return useQuery<Service[], Error>({
    queryKey: QUERY_KEYS.services,
    queryFn: () => apiClient.getServices(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useService(id: string) {
  return useQuery<Service, Error>({
    queryKey: [...QUERY_KEYS.services, id],
    queryFn: () => apiClient.getServiceById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// Barbers
export function useBarbers() {
  return useQuery<Barber[], Error>({
    queryKey: QUERY_KEYS.barbers,
    queryFn: () => apiClient.getBarbers(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBarber(id: string) {
  return useQuery<Barber, Error>({
    queryKey: [...QUERY_KEYS.barbers, id],
    queryFn: () => apiClient.getBarberById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// Time Slots
export function useAvailableSlots(barberId: string, date: string) {
  return useQuery<TimeSlot[], Error>({
    queryKey: QUERY_KEYS.timeSlots(barberId, date),
    queryFn: () => apiClient.getAvailableSlots(barberId, date),
    enabled: !!barberId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes - slots change frequently
  });
}

// Bookings
export function useBooking(bookingId: string) {
  return useQuery<BookingConfirmation, Error>({
    queryKey: QUERY_KEYS.booking(bookingId),
    queryFn: () => apiClient.getBooking(bookingId),
    enabled: !!bookingId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<BookingConfirmation, Error, BookingFormData>({
    mutationFn: (data) => apiClient.createBooking(data),
    onSuccess: (data) => {
      // Cache the new booking
      queryClient.setQueryData(QUERY_KEYS.booking(data.bookingId), data);
      // Invalidate available slots
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (bookingId) => apiClient.cancelBooking(bookingId),
    onSuccess: () => {
      // Invalidate bookings and time slots
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] });
    },
  });
}
