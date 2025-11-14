import { z } from 'zod';

export const BookingFormSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  barberId: z.string().min(1, 'Please select a barber'),
  timeSlotId: z.string().min(1, 'Please select a time slot'),
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  customerEmail: z
    .string()
    .email('Please enter a valid email address'),
  customerPhone: z
    .string()
    .regex(/^\+?[\d\s\-()]{10,}$/, 'Please enter a valid phone number'),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type BookingFormSchemaType = z.infer<typeof BookingFormSchema>;

export const ServiceSelectionSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
});

export type ServiceSelectionType = z.infer<typeof ServiceSelectionSchema>;

export const BarberSelectionSchema = z.object({
  barberId: z.string().min(1, 'Please select a barber'),
  date: z.string().refine(
    (date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)),
    'Please select today or a future date'
  ),
});

export type BarberSelectionType = z.infer<typeof BarberSelectionSchema>;

export const TimeSlotSelectionSchema = z.object({
  timeSlotId: z.string().min(1, 'Please select a time slot'),
});

export type TimeSlotSelectionType = z.infer<typeof TimeSlotSelectionSchema>;
