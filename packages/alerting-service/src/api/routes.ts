import { Router } from 'express';
import { NotificationController } from './notification-controller';
import { AlertController } from './alert-controller';

const router = Router();
const notificationController = new NotificationController();
const alertController = new AlertController();

// Notification routes
router.get('/notifications/preferences/:userId', notificationController.getUserPreferences);
router.put('/notifications/preferences/:userId', notificationController.updateUserPreferences);
router.get('/notifications/in-app/:userId', notificationController.getInAppNotifications);
router.delete('/notifications/in-app/:userId', notificationController.clearInAppNotifications);
router.post('/notifications/test', notificationController.testNotification);

// Alert routes
router.post('/alerts', alertController.createAlert);
router.get('/alerts/:eventId', alertController.getAlert);
router.get('/alerts/user/:userId', alertController.getAlertsByUser);
router.get('/alerts/type/:type', alertController.getAlertsByType);
router.get('/alerts/stats/queue', alertController.getQueueStats);

export default router;