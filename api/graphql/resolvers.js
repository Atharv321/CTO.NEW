const bookingService = require('../services/bookingService');
const { serviceService, barberService, customerService, availabilityService } = require('../services');
const { prisma } = require('../lib/prisma');

const resolvers = {
  Query: {
    // Services
    services: () => serviceService.getAllServices(),
    service: (_, { id }) => serviceService.getServiceById(id),

    // Barbers
    barbers: (_, { includeInactive }) => barberService.getAllBarbers(includeInactive),
    barber: (_, { id }) => barberService.getBarberById(id),

    // Customers
    customers: () => customerService.getAllCustomers(),
    customer: (_, { id }) => customerService.getCustomerById(id),

    // Bookings
    bookings: (_, { customerId, barberId, status, date }) => 
      bookingService.getBookings({ customerId, barberId, status, date }),
    booking: (_, { id }) => bookingService.getBookingById(id),

    // Availability
    availableSlots: async (_, { barberId, date, serviceId }) => {
      let serviceDuration = 30; // Default 30 minutes
      
      if (serviceId) {
        const service = await serviceService.getServiceById(serviceId);
        serviceDuration = service.duration;
      }

      const slots = await bookingService.generateAvailableSlots(
        barberId, 
        date, 
        serviceDuration
      );

      return slots.map(slot => ({
        time: slot,
        isAvailable: true
      }));
    },
    barberAvailability: (_, { barberId }) => availabilityService.getBarberAvailability(barberId),
  },

  Mutation: {
    // Services
    createService: (_, { input }) => serviceService.createService(input),
    updateService: (_, { id, input }) => serviceService.updateService(id, input),
    deleteService: async (_, { id }) => {
      try {
        await serviceService.deleteService(id);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Barbers
    createBarber: (_, { input }) => barberService.createBarber(input),
    updateBarber: (_, { id, input }) => barberService.updateBarber(id, input),
    deleteBarber: async (_, { id }) => {
      try {
        await barberService.deleteBarber(id);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Customers
    createCustomer: (_, { input }) => customerService.createCustomer(input),
    updateCustomer: (_, { id, input }) => customerService.updateCustomer(id, input),
    deleteCustomer: async (_, { id }) => {
      try {
        await customerService.deleteCustomer(id);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Bookings
    createBooking: (_, { input }) => bookingService.createBooking(input),
    updateBookingStatus: (_, { id, status }) => bookingService.updateBookingStatus(id, status),
    cancelBooking: (_, { id }) => bookingService.cancelBooking(id),

    // Availability
    createAvailability: (_, { input }) => availabilityService.createAvailability(input),
    updateAvailability: (_, { id, input }) => availabilityService.updateAvailability(id, input),
    deleteAvailability: async (_, { id }) => {
      try {
        await availabilityService.deleteAvailability(id);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },

  // Field resolvers for nested relationships
  Barber: {
    availability: (parent) => availabilityService.getBarberAvailability(parent.id),
    _count: (parent) => ({
      bookings: prisma.booking.count({
        where: {
          barberId: parent.id,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      })
    })
  },

  Customer: {
    _count: (parent) => ({
      bookings: prisma.booking.count({
        where: {
          customerId: parent.id
        }
      })
    })
  },

  Service: {
    bookings: (parent) => prisma.booking.findMany({
      where: { serviceId: parent.id },
      select: {
        id: true,
        startTime: true,
        status: true
      }
    })
  }
};

module.exports = resolvers;