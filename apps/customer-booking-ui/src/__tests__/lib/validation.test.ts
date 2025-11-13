import { BookingFormSchema, ServiceSelectionSchema } from '@lib/validation';

describe('Validation Schemas', () => {
  describe('ServiceSelectionSchema', () => {
    it('should validate with a valid service ID', () => {
      const data = { serviceId: '123' };
      const result = ServiceSelectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with an empty service ID', () => {
      const data = { serviceId: '' };
      const result = ServiceSelectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('BookingFormSchema', () => {
    const validData = {
      serviceId: 'svc-123',
      barberId: 'barb-123',
      timeSlotId: 'slot-123',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1 (555) 123-4567',
      notes: 'Test booking',
    };

    it('should validate with all required fields', () => {
      const result = BookingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without optional notes field', () => {
      const { notes, ...dataWithoutNotes } = validData;
      const result = BookingFormSchema.safeParse(dataWithoutNotes);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid email', () => {
      const data = { ...validData, customerEmail: 'invalid-email' };
      const result = BookingFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail with short name', () => {
      const data = { ...validData, customerName: 'J' };
      const result = BookingFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
