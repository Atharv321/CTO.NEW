import express from 'express';
import { getNotificationWorker } from '@shared/utils';
import { NotificationEvent, UserNotificationPreferences, ApiResponse } from '@shared/types';

const router = express.Router();
const worker = getNotificationWorker();

// Get in-app notifications for a user
router.get('/notifications/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const notificationService = worker.getNotificationService();
    const inAppAdapter = notificationService['adapters'].get('in_app');
    
    if (!inAppAdapter) {
      return res.status(500).json({
        success: false,
        error: 'In-app notification adapter not available'
      } as ApiResponse<null>);
    }

    const notifications = inAppAdapter.getNotifications(userId);
    
    res.json({
      success: true,
      data: notifications
    } as ApiResponse<typeof notifications>);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Mark notification as read
router.put('/notifications/:userId/:notificationId/read', (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    const notificationService = worker.getNotificationService();
    const inAppAdapter = notificationService['adapters'].get('in_app');
    
    if (!inAppAdapter) {
      return res.status(500).json({
        success: false,
        error: 'In-app notification adapter not available'
      } as ApiResponse<null>);
    }

    const success = inAppAdapter.markAsRead(userId, notificationId);
    
    if (success) {
      res.json({
        success: true,
        data: { message: 'Notification marked as read' }
      } as ApiResponse<{ message: string }>);
    } else {
      res.status(404).json({
        success: false,
        error: 'Notification not found'
      } as ApiResponse<null>);
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Set user notification preferences
router.post('/preferences/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const preferences: UserNotificationPreferences = {
      userId,
      ...req.body
    };

    const notificationService = worker.getNotificationService();
    notificationService.setUserPreferences(preferences);
    
    res.json({
      success: true,
      data: preferences
    } as ApiResponse<UserNotificationPreferences>);
  } catch (error) {
    console.error('Error setting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get user notification preferences
router.get('/preferences/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const notificationService = worker.getNotificationService();
    const preferences = notificationService.getUserPreferences(userId);
    
    if (preferences) {
      res.json({
        success: true,
        data: preferences
      } as ApiResponse<UserNotificationPreferences>);
    } else {
      res.status(404).json({
        success: false,
        error: 'Preferences not found'
      } as ApiResponse<null>);
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Trigger a test notification event
router.post('/events', async (req, res) => {
  try {
    const event: NotificationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...req.body
    };

    await worker.addEvent(event);
    
    res.json({
      success: true,
      data: { message: 'Event added to queue', eventId: event.id }
    } as ApiResponse<{ message: string; eventId: string }>);
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

export default router;