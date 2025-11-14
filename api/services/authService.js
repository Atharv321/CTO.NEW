const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
    this.accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    this.refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  async generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role?.name || 'user',
      },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async registerUser(userData) {
    const { email, firstName, lastName, password, roleId } = userData;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        roleId: roleId || (await this.getDefaultRoleId()),
      },
      include: {
        role: true,
        locations: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async loginUser(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        locations: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new Error('User does not have a password set');
    }

    const passwordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('User account is suspended');
    }

    const tokens = await this.generateTokens(user);
    const sanitizedUser = this.sanitizeUser(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user: sanitizedUser, tokens };
  }

  async refreshAccessToken(refreshToken) {
    const decoded = await this.verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        locations: true,
      },
    });

    if (!user || user.status === 'SUSPENDED') {
      throw new Error('Invalid refresh token or user suspended');
    }

    const tokens = await this.generateTokens(user);
    return tokens;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.passwordHash) {
      throw new Error('User does not have a password set');
    }

    const passwordValid = await bcryptjs.compare(oldPassword, user.passwordHash);
    if (!passwordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        locations: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.sanitizeUser(user);
  }

  async getDefaultRoleId() {
    const role = await prisma.role.findUnique({
      where: { name: 'user' },
    });

    if (!role) {
      throw new Error('Default role not found');
    }

    return role.id;
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async createBootstrapUser(email, firstName, lastName, password, roleName = 'admin') {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role "${roleName}" not found`);
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        roleId: role.id,
      },
      include: {
        role: true,
        locations: true,
      },
    });

    return this.sanitizeUser(user);
  }
}

module.exports = new AuthService();
