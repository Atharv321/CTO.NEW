import { Request, Response } from 'express';
import { QueueService } from '@/services/queue-service';
import { AlertProcessor } from '@/services/alert-processor';
import { AlertEvent, EventType } from '@/types';
import { randomUUID } from 'crypto';

export class AlertController {
  private queueService: QueueService;
  private alertProcessor: AlertProcessor;

  constructor() {
    this.queueService = new QueueService();
    this.alertProcessor = new AlertProcessor();
  }

  // Create a new alert event
  createAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, userId, data, severity } = req.body;
      
      if (!type || !userId || !data) {
        res.status(400).json({ error: 'Missing required fields: type, userId, data' });
        return;
      }

      // Validate event type
      if (!Object.values(EventType).includes(type)) {
        res.status(400).json({ error: `Invalid event type. Must be one of: ${Object.values(EventType).join(', ')}` });
        return;
      }

      const event: AlertEvent = {
        id: randomUUID(),
        type,
        userId,
        data,
        severity: severity || 'MEDIUM',
        timestamp: new Date(),
        processed: false
      };

      // Add to queue for processing
      await this.queueService.addEventJob(event);
      
      res.status(201).json({ 
        message: 'Alert event created and queued for processing', 
        eventId: event.id 
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get alert by ID
  getAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;
      
      if (!eventId) {
        res.status(400).json({ error: 'Event ID is required' });
        return;
      }

      const event = this.alertProcessor.getEvent(eventId);
      
      if (!event) {
        res.status(404).json({ error: 'Alert event not found' });
        return;
      }

      res.json(event);
    } catch (error) {
      console.error('Error getting alert:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get alerts by user
  getAlertsByUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const events = this.alertProcessor.getEventsByUser(userId);
      res.json(events);
    } catch (error) {
      console.error('Error getting alerts by user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get alerts by type
  getAlertsByType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      
      if (!type) {
        res.status(400).json({ error: 'Event type is required' });
        return;
      }

      if (!Object.values(EventType).includes(type as EventType)) {
        res.status(400).json({ error: `Invalid event type. Must be one of: ${Object.values(EventType).join(', ')}` });
        return;
      }

      const events = this.alertProcessor.getEventsByType(type as EventType);
      res.json(events);
    } catch (error) {
      console.error('Error getting alerts by type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get queue statistics
  getQueueStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.queueService.getQueueStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting queue stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}