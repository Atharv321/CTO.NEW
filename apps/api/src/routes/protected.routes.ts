import { Router } from 'express';

import { authenticate, requireRole } from '../middleware/authentication';

const router = Router();

router.get(
  '/reports/daily',
  authenticate,
  requireRole(['admin', 'manager']),
  (req, res) => {
    res.json({
      generatedAt: new Date().toISOString(),
      requestedBy: req.user,
      totals: {
        inventoryAdjustments: 4,
        newOrders: 2,
        pendingTasks: 6,
      },
    });
  },
);

router.get(
  '/admin/audit-log',
  authenticate,
  requireRole(['admin']),
  (_req, res) => {
    res.json({
      entries: [
        { id: 'evt-1', action: 'user.created', actor: 'system', timestamp: new Date().toISOString() },
      ],
    });
  },
);

export const protectedRoutes = router;
