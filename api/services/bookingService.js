const { prisma } = require('../lib/prisma');

class BookingService {
  async checkSlotAvailability(barberId, startTime, endTime) {
    // Check if barber exists and is active
    const barber = await prisma.barber.findUnique({
      where: { id: barberId }
    });

    if (!barber || !barber.isActive) {
      throw new Error('Barber not available');
    }

    // Check for overlapping bookings
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        barberId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        OR: [
          {
            startTime: {
              lt: endTime
            },
            endTime: {
              gt: startTime
            }
          }
        ]
      }
    });

    if (overlappingBooking) {
      throw new Error('Time slot is already booked');
    }

    return true;
  }

  async checkBarberAvailability(barberId, date) {
    const dayOfWeek = new Date(date).getDay();
    
    const availability = await prisma.availability.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId,
          dayOfWeek
        }
      }
    });

    if (!availability) {
      throw new Error('Barber is not available on this day');
    }

    return availability;
  }

  async generateAvailableSlots(barberId, date, serviceDuration) {
    const availability = await this.checkBarberAvailability(barberId, date);
    
    // Parse availability times
    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);
    
    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);
    
    // Get existing bookings for the day
    const existingBookings = await prisma.booking.findMany({
      where: {
        barberId,
        startTime: {
          gte: dayStart,
          lt: dayEnd
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    const availableSlots = [];
    let currentTime = new Date(dayStart);

    for (const booking of existingBookings) {
      // Add slots before the booking
      while (currentTime.getTime() + serviceDuration * 60000 <= booking.startTime.getTime()) {
        availableSlots.push(new Date(currentTime));
        currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute slots
      }
      
      // Skip past the booking
      currentTime = new Date(booking.endTime);
    }

    // Add remaining slots after the last booking
    while (currentTime.getTime() + serviceDuration * 60000 <= dayEnd.getTime()) {
      availableSlots.push(new Date(currentTime));
      currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute slots
    }

    return availableSlots;
  }

  async createBooking(bookingData) {
    const { customerId, barberId, serviceId, startTime, notes } = bookingData;

    // Get service details to calculate end time
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(startTimeDate.getTime() + service.duration * 60000);

    // Check slot availability
    await this.checkSlotAvailability(barberId, startTimeDate, endTimeDate);

    // Create booking with transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          customerId,
          barberId,
          serviceId,
          startTime: startTimeDate,
          endTime: endTimeDate,
          notes
        },
        include: {
          customer: true,
          barber: true,
          service: true
        }
      });

      return newBooking;
    });

    return booking;
  }

  async getBookings(filters = {}) {
    const { customerId, barberId, status, date } = filters;
    
    const whereClause = {};
    
    if (customerId) whereClause.customerId = customerId;
    if (barberId) whereClause.barberId = barberId;
    if (status) whereClause.status = status;
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      whereClause.startTime = {
        gte: targetDate,
        lt: nextDate
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: true,
        barber: true,
        service: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    return bookings;
  }

  async getBookingById(id) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        barber: true,
        service: true
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  async updateBookingStatus(id, status) {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        barber: true,
        service: true
      }
    });

    return booking;
  }

  async cancelBooking(id, customerId = null) {
    const whereClause = { id };
    if (customerId) {
      whereClause.customerId = customerId;
    }

    const booking = await prisma.booking.findFirst({
      where: whereClause
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new Error('Cannot cancel this booking');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        barber: true,
        service: true
      }
    });

    return updatedBooking;
  }
}

module.exports = new BookingService();