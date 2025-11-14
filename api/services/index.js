const { prisma } = require('../lib/prisma');

class ServiceService {
  async getAllServices() {
    const services = await prisma.service.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return services;
  }

  async getServiceById(id) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        bookings: {
          select: {
            id: true,
            startTime: true,
            status: true
          }
        }
      }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    return service;
  }

  async createService(serviceData) {
    const service = await prisma.service.create({
      data: serviceData
    });

    return service;
  }

  async updateService(id, serviceData) {
    const service = await prisma.service.update({
      where: { id },
      data: serviceData
    });

    return service;
  }

  async deleteService(id) {
    // Check if service has any bookings
    const bookingCount = await prisma.booking.count({
      where: { serviceId: id }
    });

    if (bookingCount > 0) {
      throw new Error('Cannot delete service with existing bookings');
    }

    await prisma.service.delete({
      where: { id }
    });
  }
}

class BarberService {
  async getAllBarbers(includeInactive = false) {
    const barbers = await prisma.barber.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        availability: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED']
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return barbers;
  }

  async getBarberById(id) {
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: {
        availability: true,
        bookings: {
          where: {
            startTime: {
              gte: new Date()
            }
          },
          orderBy: {
            startTime: 'asc'
          },
          take: 10
        }
      }
    });

    if (!barber) {
      throw new Error('Barber not found');
    }

    return barber;
  }

  async createBarber(barberData) {
    const barber = await prisma.barber.create({
      data: barberData
    });

    return barber;
  }

  async updateBarber(id, barberData) {
    const barber = await prisma.barber.update({
      where: { id },
      data: barberData
    });

    return barber;
  }

  async deleteBarber(id) {
    // Check if barber has any bookings
    const bookingCount = await prisma.booking.count({
      where: { barberId: id }
    });

    if (bookingCount > 0) {
      throw new Error('Cannot delete barber with existing bookings');
    }

    await prisma.barber.delete({
      where: { id }
    });
  }
}

class CustomerService {
  async getAllCustomers() {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return customers;
  }

  async getCustomerById(id) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            barber: {
              select: {
                id: true,
                name: true
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async createCustomer(customerData) {
    const customer = await prisma.customer.create({
      data: customerData
    });

    return customer;
  }

  async updateCustomer(id, customerData) {
    const customer = await prisma.customer.update({
      where: { id },
      data: customerData
    });

    return customer;
  }

  async deleteCustomer(id) {
    // Check if customer has any bookings
    const bookingCount = await prisma.booking.count({
      where: { customerId: id }
    });

    if (bookingCount > 0) {
      throw new Error('Cannot delete customer with existing bookings');
    }

    await prisma.customer.delete({
      where: { id }
    });
  }
}

class AvailabilityService {
  async getBarberAvailability(barberId) {
    const availability = await prisma.availability.findMany({
      where: { barberId },
      orderBy: {
        dayOfWeek: 'asc'
      }
    });

    return availability;
  }

  async createAvailability(availabilityData) {
    const availability = await prisma.availability.create({
      data: availabilityData
    });

    return availability;
  }

  async updateAvailability(id, availabilityData) {
    const availability = await prisma.availability.update({
      where: { id },
      data: availabilityData
    });

    return availability;
  }

  async deleteAvailability(id) {
    await prisma.availability.delete({
      where: { id }
    });
  }
}

module.exports = {
  serviceService: new ServiceService(),
  barberService: new BarberService(),
  customerService: new CustomerService(),
  availabilityService: new AvailabilityService()
};