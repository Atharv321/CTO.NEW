import db from '../database/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@shared/types';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '15m';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  async register(email: string, name: string, password: string, role: UserRole = UserRole.STAFF): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, name, hashedPassword, role]
    );

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      role: result.rows[0].role,
      createdAt: result.rows[0].created_at
    };
  }

  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string } | null> {
    const result = await db.query(
      'SELECT id, email, name, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return null;
    }

    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at
    };

    const accessToken = this.generateAccessToken(userResponse);
    const refreshToken = this.generateRefreshToken(userResponse);

    return { user: userResponse, accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        createdAt: new Date(decoded.createdAt)
      };
    } catch (error) {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
      
      const user = await db.query(
        'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (user.rows.length === 0) {
        return null;
      }

      const userData = user.rows[0];
      const userResponse: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: userData.created_at
      };

      const newAccessToken = this.generateAccessToken(userResponse);
      const newRefreshToken = this.generateRefreshToken(userResponse);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      return null;
    }
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );

    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at
    }));
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User | null> {
    const result = await db.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, created_at',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at
    };
  }
}

export const authService = new AuthService();
export default authService;