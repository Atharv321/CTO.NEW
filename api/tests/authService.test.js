const authService = require('../services/authService');
const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client');

describe('AuthService', () => {
  let mockPrisma;
  let mockUser;
  let mockRole;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm',
      status: 'ACTIVE',
      lastLoginAt: null,
      roleId: 'role-123',
      role: { id: 'role-123', name: 'user' },
      locations: [],
    };

    mockRole = {
      id: 'role-123',
      name: 'user',
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
    };

    jest.spyOn(bcryptjs, 'hash').mockResolvedValue('$2a$10$hashedpassword');
    jest.spyOn(bcryptjs, 'compare').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.registerUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      });

      expect(result.email).toBe('test@example.com');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw error if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.registerUser({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
        })
      ).rejects.toThrow('User with this email already exists');
    });

    it('should hash password before storing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await authService.registerUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      });

      expect(bcryptjs.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('loginUser', () => {
    it('should login user successfully with correct password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptjs.compare.mockResolvedValue(true);

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.loginUser('nonexistent@example.com', 'password123')).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error if password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptjs.compare.mockResolvedValue(false);

      await expect(authService.loginUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error if user is suspended', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      mockPrisma.user.findUnique.mockResolvedValue(suspendedUser);
      bcryptjs.compare.mockResolvedValue(true);

      await expect(authService.loginUser('test@example.com', 'password123')).rejects.toThrow(
        'User account is suspended'
      );
    });

    it('should update lastLoginAt on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      bcryptjs.compare.mockResolvedValue(true);

      await authService.loginUser('test@example.com', 'password123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        })
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const tokens = await authService.generateTokens(mockUser);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should include user info in access token', async () => {
      const tokens = await authService.generateTokens(mockUser);
      const decoded = jwt.decode(tokens.accessToken);

      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const tokens = await authService.generateTokens(mockUser);
      const decoded = await authService.verifyAccessToken(tokens.accessToken);

      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyAccessToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      bcryptjs.compare.mockResolvedValue(true);

      const result = await authService.changePassword(mockUser.id, 'oldpassword', 'newpassword123');

      expect(result.message).toBe('Password changed successfully');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should throw error if old password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptjs.compare.mockResolvedValue(false);

      await expect(
        authService.changePassword(mockUser.id, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword('nonexistent-id', 'oldpassword', 'newpassword123')
      ).rejects.toThrow('User not found');
    });
  });

  describe('createBootstrapUser', () => {
    it('should create bootstrap admin user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'admin-role-id', name: 'admin' });
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        roleId: 'admin-role-id',
        role: { id: 'admin-role-id', name: 'admin' },
      });

      const result = await authService.createBootstrapUser(
        'admin@example.com',
        'Admin',
        'User',
        'password123',
        'admin'
      );

      expect(result.email).toBe('admin@example.com');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw error if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.createBootstrapUser('test@example.com', 'Test', 'User', 'password123', 'admin')
      ).rejects.toThrow('User already exists');
    });

    it('should throw error if role not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(
        authService.createBootstrapUser('admin@example.com', 'Admin', 'User', 'password123', 'admin')
      ).rejects.toThrow('Role "admin" not found');
    });
  });

  describe('sanitizeUser', () => {
    it('should remove passwordHash from user object', () => {
      const sanitized = authService.sanitizeUser(mockUser);

      expect(sanitized.passwordHash).toBeUndefined();
      expect(sanitized.email).toBe(mockUser.email);
    });
  });
});
