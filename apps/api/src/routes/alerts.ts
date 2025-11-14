import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import notificationService from '../services/notifications.js';
import alertingService from '../services/alerting.js';
import { AlertEventType, AlertSeverity, NotificationChannelType } from '@shared/types';

const router = express.Router();

// Middleware to check validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/alerts/notifications - Get in-app notifications for current user
router.get('/notifications', [
  query('unreadOnly').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    // This would typically get user ID from authenticated session/JWT
    const userId = req.headers['x-user-id'] as string || 'mock-user-id';
    const unreadOnly = req.query.unreadOnly === 'true';
    
    const notifications = await notificationService.getInAppNotifications(userId, unreadOnly);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// PUT /api/alerts/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', [
  param('id').isUUID()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'mock-user-id';
    const { id } = req.params;
    
    const success = await notificationService.markNotificationAsRead(id, userId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// PUT /api/alerts/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'mock-user-id';
    
    const count = await notificationService.markAllNotificationsAsRead(userId);
    
    res.json({
      success: true,
      message: `Marked ${count} notifications as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// GET /api/alerts/thresholds - Get alert thresholds
router.get('/thresholds', [
  query('locationId').optional().isUUID(),
  query('productId').optional().isUUID()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { locationId, productId } = req.query;
    
    const thresholds = await alertingService.getAlertThresholds(
      locationId as string,
      productId as string
    );
    
    res.json({
      success: true,
      data: thresholds
    });
  } catch (error) {
    console.error('Error fetching alert thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert thresholds'
    });
  }
});

// POST /api/alerts/thresholds - Create alert threshold
router.post('/thresholds', [
  body('type').isIn(Object.values(AlertEventType)),
  body('threshold').isDecimal(),
  body('unit').isString().isLength({ min: 1, max: 50 }),
  body('locationId').optional().isUUID(),
  body('productId').optional().isUUID(),
  body('isActive').optional().isBoolean()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const threshold = await alertingService.createAlertThreshold(req.body);
    
    res.status(201).json({
      success: true,
      data: threshold
    });
  } catch (error) {
    console.error('Error creating alert threshold:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert threshold'
    });
  }
});

// PUT /api/alerts/thresholds/:id - Update alert threshold
router.put('/thresholds/:id', [
  param('id').isUUID(),
  body('threshold').optional().isDecimal(),
  body('unit').optional().isString().isLength({ min: 1, max: 50 }),
  body('isActive').optional().isBoolean()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const success = await alertingService.updateAlertThreshold(id, req.body);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Alert threshold not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Alert threshold updated successfully'
    });
  } catch (error) {
    console.error('Error updating alert threshold:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert threshold'
    });
  }
});

// DELETE /api/alerts/thresholds/:id - Delete alert threshold
router.delete('/thresholds/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const success = await alertingService.deleteAlertThreshold(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Alert threshold not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Alert threshold deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert threshold:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert threshold'
    });
  }
});

// GET /api/alerts/history - Get alert history
router.get('/history', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const history = await alertingService.getAlertHistory(limit, offset);
    
    res.json({
      success: true,
      data: history,
      pagination: {
        limit,
        offset,
        hasMore: history.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert history'
    });
  }
});

// POST /api/alerts/test/supplier-order - Create test supplier order alert
router.post('/test/supplier-order', [
  body('orderNumber').isString().isLength({ min: 1 }),
  body('supplierName').isString().isLength({ min: 1 }),
  body('status').isString().isLength({ min: 1 }),
  body('items').isArray(),
  body('estimatedDelivery').optional().isISO8601()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await alertingService.createSupplierOrderAlert(req.body);
    
    res.json({
      success: true,
      message: 'Test supplier order alert created'
    });
  } catch (error) {
    console.error('Error creating test supplier order alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test alert'
    });
  }
});

// POST /api/alerts/test/system-error - Create test system error alert
router.post('/test/system-error', [
  body('component').isString().isLength({ min: 1 }),
  body('message').isString().isLength({ min: 1 }),
  body('stackTrace').optional().isString()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await alertingService.createSystemErrorAlert(req.body);
    
    res.json({
      success: true,
      message: 'Test system error alert created'
    });
  } catch (error) {
    console.error('Error creating test system error alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test alert'
    });
  }
});

// POST /api/alerts/process-queue - Manually trigger notification queue processing
router.post('/process-queue', async (req: express.Request, res: express.Response) => {
  try {
    await notificationService.processNotificationQueue();
    
    res.json({
      success: true,
      message: 'Notification queue processed'
    });
  } catch (error) {
    console.error('Error processing notification queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process notification queue'
    });
  }
});

// GET /api/alerts/preferences - Get user notification preferences
router.get('/preferences', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'mock-user-id';
    
    // This would typically fetch from database
    const mockPreferences = {
      userId,
      alertTypes: [AlertEventType.LOW_STOCK, AlertEventType.IMPENDING_EXPIRATION],
      channels: [
        { type: NotificationChannelType.EMAIL, enabled: true, config: {} },
        { type: NotificationChannelType.IN_APP, enabled: true, config: {} },
        { type: NotificationChannelType.SMS, enabled: false, config: {} }
      ],
      minSeverity: AlertSeverity.MEDIUM,
      quietHours: null,
      isActive: true
    };
    
    res.json({
      success: true,
      data: mockPreferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    });
  }
});

// PUT /api/alerts/preferences - Update user notification preferences
router.put('/preferences', [
  body('alertTypes').isArray(),
  body('channels').isArray(),
  body('minSeverity').isIn(Object.values(AlertSeverity)),
  body('quietHours').optional().isObject(),
  body('isActive').optional().isBoolean()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'mock-user-id';
    
    // This would typically update in database
    console.log(`Updating notification preferences for user ${userId}:`, req.body);
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

export default router;