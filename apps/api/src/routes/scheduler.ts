import { Router, Response } from 'express';
import schedulerService from '../services/scheduler.js';
import { authenticateToken, requireRole, AuthenticatedRequest, UserRole } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all scheduler routes (admin only)
router.use(authenticateToken);
router.use(requireRole([UserRole.ADMIN]));

// Get active scheduler tasks
router.get('/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = schedulerService.getActiveTasks();
    res.json({ success: true, data: { tasks } });
  } catch (error) {
    console.error('Error getting scheduler tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to get scheduler tasks' });
  }
});

// Manually trigger snapshot generation
router.post('/trigger/:type', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.params;

    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid snapshot type. Must be daily, weekly, or monthly' });
    }

    await schedulerService.triggerSnapshot(type as 'daily' | 'weekly' | 'monthly');
    res.json({ success: true, message: `${type} snapshot triggered successfully` });
  } catch (error) {
    console.error('Error triggering snapshot:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger snapshot' });
  }
});

export default router;