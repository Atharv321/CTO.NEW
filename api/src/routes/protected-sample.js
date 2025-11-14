const express = require('express');
const { verifyAccessToken, requireRole, requireAdmin, requireManager } = require('../../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/protected/public-info:
 *   get:
 *     tags:
 *       - Protected Resources
 *     summary: Public information accessible to authenticated users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Public information
 *       401:
 *         description: Unauthorized
 */
router.get('/public-info', verifyAccessToken, (req, res) => {
  res.json({
    message: 'This is a protected endpoint',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

/**
 * @swagger
 * /api/protected/admin/dashboard:
 *   get:
 *     tags:
 *       - Protected Resources
 *     summary: Admin dashboard (admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/admin/dashboard', verifyAccessToken, requireAdmin, (req, res) => {
  res.json({
    message: 'Admin Dashboard',
    role: 'admin',
    stats: {
      totalUsers: 150,
      activeUsers: 120,
      totalRevenue: 45000,
      pendingActions: 12,
    },
  });
});

/**
 * @swagger
 * /api/protected/manager/locations:
 *   get:
 *     tags:
 *       - Protected Resources
 *     summary: Manager-level location data
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Location data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager role required
 */
router.get('/manager/locations', verifyAccessToken, requireManager, (req, res) => {
  res.json({
    message: 'Manager Location Overview',
    role: 'manager or admin',
    locations: [
      {
        id: 'loc-1',
        name: 'Main Warehouse',
        itemCount: 1250,
        staff: 15,
        status: 'operational',
      },
      {
        id: 'loc-2',
        name: 'Secondary Warehouse',
        itemCount: 890,
        staff: 10,
        status: 'operational',
      },
    ],
  });
});

/**
 * @swagger
 * /api/protected/staff/inventory:
 *   get:
 *     tags:
 *       - Protected Resources
 *     summary: Staff-level inventory access
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role or higher required
 */
router.get('/staff/inventory', verifyAccessToken, requireRole('staff', 'manager', 'admin'), (req, res) => {
  res.json({
    message: 'Staff Inventory Access',
    role: 'staff, manager, or admin',
    inventory: {
      totalItems: 150,
      lowStockItems: 12,
      recentTransactions: 45,
    },
  });
});

/**
 * @swagger
 * /api/protected/admin/users/{userId}:
 *   get:
 *     tags:
 *       - Protected Resources
 *     summary: Get user details (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 */
router.get('/admin/users/:userId', verifyAccessToken, requireAdmin, (req, res) => {
  const { userId } = req.params;

  // In a real application, fetch from database
  res.json({
    id: userId,
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'staff',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T12:30:00Z',
  });
});

/**
 * @swagger
 * /api/protected/admin/audit-log:
 *   get:
 *     tags:
 *       - Protected Resources
 *     summary: View audit logs (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Audit log entries
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/admin/audit-log', verifyAccessToken, requireAdmin, (req, res) => {
  const { limit = 10, offset = 0 } = req.query;

  res.json({
    message: 'Audit Log',
    total: 250,
    limit: parseInt(limit),
    offset: parseInt(offset),
    entries: [
      {
        id: 'audit-1',
        action: 'LOGIN',
        userId: 'user-123',
        email: 'user@example.com',
        timestamp: '2024-01-15T12:30:00Z',
        ipAddress: '192.168.1.1',
      },
      {
        id: 'audit-2',
        action: 'USER_CREATED',
        userId: 'admin-1',
        targetUserId: 'user-456',
        timestamp: '2024-01-15T12:25:00Z',
      },
    ],
  });
});

/**
 * @swagger
 * /api/protected/role-check:
 *   get:
 *     tags:
 *       - Protected Resources
 *     summary: Get current user's role information
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User role information
 *       401:
 *         description: Unauthorized
 */
router.get('/role-check', verifyAccessToken, (req, res) => {
  const rolePermissions = {
    admin: ['create_user', 'delete_user', 'manage_system'],
    manager: ['manage_staff', 'manage_location', 'view_reports'],
    staff: ['perform_transactions', 'view_inventory'],
    user: ['view_profile', 'update_profile'],
  };

  const permissions = rolePermissions[req.user.role] || [];

  res.json({
    userId: req.user.id,
    email: req.user.email,
    role: req.user.role,
    permissions,
  });
});

/**
 * @swagger
 * /api/protected/manager/staff-list:
 *   get:
 *     tags:
 *       - Protected Resources
 *     summary: Get staff list (manager and above)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff members
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager role required
 */
router.get('/manager/staff-list', verifyAccessToken, requireManager, (req, res) => {
  res.json({
    message: 'Staff Directory',
    staff: [
      {
        id: 'staff-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Smith',
        role: 'staff',
        status: 'ACTIVE',
      },
      {
        id: 'staff-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'staff',
        status: 'ACTIVE',
      },
    ],
  });
});

module.exports = router;
