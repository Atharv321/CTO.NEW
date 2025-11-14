export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'barber' | 'admin';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  avatar?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
