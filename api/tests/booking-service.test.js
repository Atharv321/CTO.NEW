const bookingService = require('../services/bookingService');
const { serviceService, barberService, customerService, availabilityService } = require('../services');

describe('Booking Service', () => {
  describe('Slot Availability', () => {
    test('should reject bookings for inactive barbers', async () => {
      // Mock inactive barber
      jest.spyOn(barberService, 'getBarberById').mockResolvedValue({
        id: 'barber-1',
        isActive: false
      });

      await expect(
        bookingService.checkSlotAvailability('barber-1', new Date(), new Date())
      ).rejects.toThrow('Barber not available');
    });

    test('should detect overlapping bookings', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T11:00:00Z');

      // Mock existing overlapping booking
      jest.spyOn(bookingService.prisma.booking, 'findFirst').mockResolvedValue({
        id: 'existing-booking',
        startTime: new Date('2024-01-01T10:30:00Z'),
        endTime: new Date('2024-01-01T11:30:00Z')
      });

      await expect(
        bookingService.checkSlotAvailability('barber-1', startTime, endTime)
      ).rejects.toThrow('Time slot is already booked');
    });

    test('should allow bookings for available slots', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T11:00:00Z');

      // Mock available barber and no overlapping bookings
      jest.spyOn(barberService, 'getBarberById').mockResolvedValue({
        id: 'barber-1',
        isActive: true
      });
      jest.spyOn(bookingService.prisma.booking, 'findFirst').mockResolvedValue(null);

      await expect(
        bookingService.checkSlotAvailability('barber-1', startTime, endTime)
      ).resolves.toBe(true);
    });
  });

  describe('Booking Creation', () => {
    test('should create booking successfully', async () => {
      const bookingData = {
        customerId: 'customer-1',
        barberId: 'barber-1',
        serviceId: 'service-1',
        startTime: '2024-01-01T10:00:00Z',
        notes: 'Test booking'
      };

      // Mock service
      jest.spyOn(serviceService, 'getServiceById').mockResolvedValue({
        id: 'service-1',
        duration: 60,
        price: 50
      });

      // Mock availability check
      jest.spyOn(bookingService, 'checkSlotAvailability').mockResolvedValue(true);

      // Mock transaction
      const mockBooking = {
        id: 'booking-1',
        ...bookingData,
        endTime: new Date('2024-01-01T11:00:00Z'),
        status: 'PENDING',
        customer: { id: 'customer-1', name: 'John Doe' },
        barber: { id: 'barber-1', name: 'Jane Smith' },
        service: { id: 'service-1', name: 'Haircut' }
      };

      jest.spyOn(bookingService.prisma.$transaction').mockImplementation((callback) => {
        return callback(bookingService.prisma);
      });
      jest.spyOn(bookingService.prisma.booking, 'create').mockResolvedValue(mockBooking);

      const result = await bookingService.createBooking(bookingData);
      expect(result).toEqual(mockBooking);
    });

    test('should reject booking for non-existent service', async () => {
      const bookingData = {
        customerId: 'customer-1',
        barberId: 'barber-1',
        serviceId: 'non-existent-service',
        startTime: '2024-01-01T10:00:00Z'
      };

      jest.spyOn(serviceService, 'getServiceById').mockResolvedValue(null);

      await expect(bookingService.createBooking(bookingData))
        .rejects.toThrow('Service not found');
    });
  });

  describe('Booking Retrieval', () => {
    test('should get bookings with filters', async () => {
      const filters = {
        customerId: 'customer-1',
        status: 'PENDING'
      };

      const mockBookings = [
        {
          id: 'booking-1',
          customerId: 'customer-1',
          status: 'PENDING'
        }
      ];

      jest.spyOn(bookingService.prisma.booking, 'findMany').mockResolvedValue(mockBookings);

      const result = await bookingService.getBookings(filters);
      expect(result).toEqual(mockBookings);
    });

    test('should get booking by ID', async () => {
      const mockBooking = {
        id: 'booking-1',
        customer: { id: 'customer-1', name: 'John Doe' },
        barber: { id: 'barber-1', name: 'Jane Smith' },
        service: { id: 'service-1', name: 'Haircut' }
      };

      jest.spyOn(bookingService.prisma.booking, 'findUnique').mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById('booking-1');
      expect(result).toEqual(mockBooking);
    });

    test('should throw error for non-existent booking', async () => {
      jest.spyOn(bookingService.prisma.booking, 'findUnique').mockResolvedValue(null);

      await expect(bookingService.getBookingById('non-existent'))
        .rejects.toThrow('Booking not found');
    });
  });

  describe('Booking Cancellation', () => {
    test('should cancel pending booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        status: 'PENDING',
        customerId: 'customer-1'
      };

      jest.spyOn(bookingService.prisma.booking, 'findFirst').mockResolvedValue(mockBooking);
      jest.spyOn(bookingService.prisma.booking, 'update').mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED'
      });

      const result = await bookingService.cancelBooking('booking-1', 'customer-1');
      expect(result.status).toBe('CANCELLED');
    });

    test('should reject cancellation of completed booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        status: 'COMPLETED',
        customerId: 'customer-1'
      };

      jest.spyOn(bookingService.prisma.booking, 'findFirst').mockResolvedValue(mockBooking);

      await expect(bookingService.cancelBooking('booking-1', 'customer-1'))
        .rejects.toThrow('Cannot cancel this booking');
    });
  });
});

describe('Available Slots Generation', () => {
  test('should generate available slots correctly', async () => {
    const barberId = 'barber-1';
    const date = '2024-01-01'; // Monday
    const serviceDuration = 60;

    // Mock barber availability (9 AM to 5 PM)
    jest.spyOn(bookingService, 'checkBarberAvailability').mockResolvedValue({
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '17:00'
    });

    // Mock existing bookings
    jest.spyOn(bookingService.prisma.booking, 'findMany').mockResolvedValue([
      {
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z')
      },
      {
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T15:00:00Z')
      }
    ]);

    const slots = await bookingService.generateAvailableSlots(barberId, date, serviceDuration);
    
    // Should generate slots for available times (9-10, 11-14, 15-17)
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toBeInstanceOf(Date);
  });

  test('should throw error for unavailable day', async () => {
    const barberId = 'barber-1';
    const date = '2024-01-01';
    const serviceDuration = 60;

    jest.spyOn(bookingService, 'checkBarberAvailability').mockRejectedValue(
      new Error('Barber is not available on this day')
    );

    await expect(bookingService.generateAvailableSlots(barberId, date, serviceDuration))
      .rejects.toThrow('Barber is not available on this day');
  });
});