export const mockBookings = {
  defaultBooking: {
    id: '1',
    userId: '1',
    serviceId: '1',
    startTime: new Date('2024-01-15T10:00:00'),
    endTime: new Date('2024-01-15T11:00:00'),
    status: 'confirmed',
    createdAt: new Date('2024-01-01'),
  },
  cancelledBooking: {
    id: '2',
    userId: '1',
    serviceId: '1',
    startTime: new Date('2024-01-16T14:00:00'),
    endTime: new Date('2024-01-16T15:00:00'),
    status: 'cancelled',
    createdAt: new Date('2024-01-01'),
  },
};

export function createMockBooking(overrides = {}) {
  return {
    ...mockBookings.defaultBooking,
    ...overrides,
  };
}
