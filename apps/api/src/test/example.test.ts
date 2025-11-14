import { describe, it, expect } from 'vitest';
import { createMockUser } from './fixtures/user.fixture';
import { createMockBooking } from './fixtures/booking.fixture';

describe('API Fixtures Example', () => {
  it('should create a user with default values', () => {
    const user = createMockUser();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user.name).toBe('John Doe');
  });

  it('should create a user with custom overrides', () => {
    const user = createMockUser({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(user.name).toBe('Jane Doe');
    expect(user.email).toBe('jane@example.com');
    expect(user.id).toBe('1'); // Default value
  });

  it('should create a booking with default values', () => {
    const booking = createMockBooking();
    expect(booking).toHaveProperty('id');
    expect(booking).toHaveProperty('userId');
    expect(booking.status).toBe('confirmed');
  });

  it('should create a booking with custom status', () => {
    const booking = createMockBooking({
      status: 'pending',
      userId: '5',
    });
    expect(booking.status).toBe('pending');
    expect(booking.userId).toBe('5');
  });
});
