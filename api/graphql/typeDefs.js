const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime

  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
  }

  type Service {
    id: String!
    name: String!
    description: String
    duration: Int!
    price: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Barber {
    id: String!
    name: String!
    email: String!
    phone: String
    bio: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    availability: [Availability!]!
    _count: BarberCount!
  }

  type BarberCount {
    bookings: Int!
  }

  type Customer {
    id: String!
    name: String!
    email: String!
    phone: String
    createdAt: DateTime!
    updatedAt: DateTime!
    _count: CustomerCount!
  }

  type CustomerCount {
    bookings: Int!
  }

  type Availability {
    id: String!
    barberId: String!
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Booking {
    id: String!
    customer: Customer!
    barber: Barber!
    service: Service!
    startTime: DateTime!
    endTime: DateTime!
    status: BookingStatus!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AvailableSlot {
    time: DateTime!
    isAvailable: Boolean!
  }

  input CreateServiceInput {
    name: String!
    description: String
    duration: Int!
    price: Float!
  }

  input CreateBarberInput {
    name: String!
    email: String!
    phone: String
    bio: String
  }

  input CreateCustomerInput {
    name: String!
    email: String!
    phone: String
  }

  input CreateBookingInput {
    customerId: String!
    barberId: String!
    serviceId: String!
    startTime: DateTime!
    notes: String
  }

  input CreateAvailabilityInput {
    barberId: String!
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
  }

  type Query {
    # Services
    services: [Service!]!
    service(id: String!): Service

    # Barbers
    barbers(includeInactive: Boolean): [Barber!]!
    barber(id: String!): Barber

    # Customers
    customers: [Customer!]!
    customer(id: String!): Customer

    # Bookings
    booking(id: String!): Booking
    bookings(
      customerId: String
      barberId: String
      status: BookingStatus
      date: DateTime
    ): [Booking!]!

    # Availability
    availableSlots(barberId: String!, date: DateTime!, serviceId: String): [AvailableSlot!]!
    barberAvailability(barberId: String!): [Availability!]!
  }

  type Mutation {
    # Services
    createService(input: CreateServiceInput!): Service!
    updateService(id: String!, input: CreateServiceInput!): Service!
    deleteService(id: String!): Boolean!

    # Barbers
    createBarber(input: CreateBarberInput!): Barber!
    updateBarber(id: String!, input: CreateBarberInput!): Barber!
    deleteBarber(id: String!): Boolean!

    # Customers
    createCustomer(input: CreateCustomerInput!): Customer!
    updateCustomer(id: String!, input: CreateCustomerInput!): Customer!
    deleteCustomer(id: String!): Boolean!

    # Bookings
    createBooking(input: CreateBookingInput!): Booking!
    updateBookingStatus(id: String!, status: BookingStatus!): Booking!
    cancelBooking(id: String!): Booking!

    # Availability
    createAvailability(input: CreateAvailabilityInput!): Availability!
    updateAvailability(id: String!, input: CreateAvailabilityInput!): Availability!
    deleteAvailability(id: String!): Boolean!
  }
`;

module.exports = typeDefs;