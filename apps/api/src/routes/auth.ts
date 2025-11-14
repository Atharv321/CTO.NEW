import { Router, Response } from 'express';
import { UserRole } from '@shared/types';
import authService from '../services/auth.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Register new user (admin only)
router.post('/register', authenticateToken, requireRole([UserRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: 'Email, name, and password are required' });
    }

    const user = await authService.register(email, name, password, role);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Registration error:', error);
    if ((error as any).code === '23505') { // Unique violation
      res.status(409).json({ success: false, error: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  }
});

// Login
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    res.json({ 
      success: true, 
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token is required' });
    }

    const result = await authService.refreshToken(refreshToken);

    if (!result) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    res.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, error: 'Token refresh failed' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user info' });
  }
});

// Get all users (admin/manager only)
router.get('/users', authenticateToken, requireRole([UserRole.ADMIN, UserRole.MANAGER]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await authService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', authenticateToken, requireRole([UserRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const user = await authService.updateUserRole(id, role);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

export default router;