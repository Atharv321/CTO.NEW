import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedUser } from '@shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Mock authentication middleware - in production, verify JWT or session
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Extract bearer token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  // For now, mock authentication - in production, verify JWT
  const token = authHeader.substring(7);

  // Mock token validation
  if (token === 'invalid') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Mock user from token (in production, extract from JWT)
  req.user = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    role: 'admin',
  };

  next();
};

export type UserRole = 'admin' | 'manager' | 'viewer';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ error: 'Forbidden' });
import jwt from 'jsonwebtoken';
import { UserRole } from '@shared/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAnalyticsAccess = requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST]);
