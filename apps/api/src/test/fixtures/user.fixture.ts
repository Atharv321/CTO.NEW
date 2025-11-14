export const mockUsers = {
  defaultUser: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2024-01-01'),
  },
  adminUser: {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
};

export function createMockUser(overrides = {}) {
  return {
    ...mockUsers.defaultUser,
    ...overrides,
  };
}
