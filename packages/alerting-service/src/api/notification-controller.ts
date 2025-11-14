import { Request, Response } from 'express';
import { NotificationService } from '@/services/notification-service';
import { UserNotificationPreference } from '@/types';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Get user notification preferences
  getUserPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const preferences = this.notificationService.getUserPreferences(userId);
      
      if (!preferences) {
        res.status(404).json({ error: 'User preferences not found' });
        return;
      }

      res.json(preferences);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Update user notification preferences
  updateUserPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const preferencesData = req.body;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Validate the preferences data
      const validatedPreferences: UserNotificationPreference = {
        userId,
        ...preferencesData
      };

      this.notificationService.updateUserPreferences(validatedPreferences);
      
      res.json({ message: 'Preferences updated successfully', preferences: validatedPreferences });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get in-app notifications for a user
  getInAppNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const notifications = this.notificationService.getInAppNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error getting in-app notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Clear in-app notifications for a user
  clearInAppNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      this.notificationService.clearInAppNotifications(userId);
      res.json({ message: 'In-app notifications cleared successfully' });
    } catch (error) {
      console.error('Error clearing in-app notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Test notification endpoint
  testNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, channel, subject, content } = req.body;
      
      if (!userId || !channel || !subject || !content) {
        res.status(400).json({ error: 'Missing required fields: userId, channel, subject, content' });
        return;
      }

      const message = {
        id: `test-${Date.now()}`,
        eventId: 'test-event',
        userId,
        channel,
        subject,
        content,
        sent: false
      };

      const success = await this.notificationService.sendNotification(message);
      
      if (success) {
        res.json({ message: 'Test notification sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send test notification' });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}