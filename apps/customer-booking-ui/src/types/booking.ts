export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  icon?: string;
}

export interface Barber {
  id: string;
  name: string;
  rating: number;
  avatar?: string;
  bio?: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  barberId: string;
}

export interface BookingFormData {
  serviceId: string;
  barberId: string;
  timeSlotId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
}

export interface BookingConfirmation {
  bookingId: string;
  serviceId: string;
  barberId: string;
  scheduledTime: string;
  customerName: string;
  customerEmail: string;
  status: 'confirmed' | 'pending';
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
