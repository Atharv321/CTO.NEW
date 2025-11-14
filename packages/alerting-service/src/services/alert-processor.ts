import { 
  AlertEvent, 
  EventType, 
  ThresholdConfig 
} from '@/types';

export class AlertProcessor {
  private thresholdConfigs: ThresholdConfig[] = [];
  private eventStore: Map<string, AlertEvent> = new Map();

  constructor() {
    this.loadThresholdConfigs();
  }

  private loadThresholdConfigs(): void {
    // Mock threshold configurations
    this.thresholdConfigs = [
      {
        eventType: 'LOW_STOCK',
        thresholds: [
          {
            condition: 'stock < 5',
            severity: 'CRITICAL',
            channels: ['EMAIL', 'SMS', 'IN_APP']
          },
          {
            condition: 'stock < 10',
            severity: 'HIGH',
            channels: ['EMAIL', 'IN_APP']
          },
          {
            condition: 'stock < 20',
            severity: 'MEDIUM',
            channels: ['IN_APP']
          }
        ]
      },
      {
        eventType: 'IMMINENT_EXPIRATION',
        thresholds: [
          {
            condition: 'daysUntilExpiration <= 1',
            severity: 'CRITICAL',
            channels: ['EMAIL', 'SMS', 'IN_APP']
          },
          {
            condition: 'daysUntilExpiration <= 3',
            severity: 'HIGH',
            channels: ['EMAIL', 'IN_APP']
          },
          {
            condition: 'daysUntilExpiration <= 7',
            severity: 'MEDIUM',
            channels: ['IN_APP']
          }
        ]
      },
      {
        eventType: 'SUPPLIER_ORDER_UPDATE',
        thresholds: [
          {
            condition: 'status === "DELAYED"',
            severity: 'HIGH',
            channels: ['EMAIL', 'IN_APP']
          },
          {
            condition: 'status === "SHIPPED"',
            severity: 'LOW',
            channels: ['IN_APP']
          }
        ]
      }
    ];
  }

  processEvent(event: AlertEvent): { shouldAlert: boolean; severity?: string; channels?: string[] } {
    const config = this.thresholdConfigs.find(c => c.eventType === event.type);
    if (!config) {
      return { shouldAlert: false };
    }

    for (const threshold of config.thresholds) {
      if (this.evaluateCondition(threshold.condition, event.data)) {
        return {
          shouldAlert: true,
          severity: threshold.severity,
          channels: threshold.channels
        };
      }
    }

    return { shouldAlert: false };
  }

  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    try {
      // Simple condition evaluator for mock conditions
      // In real scenario, this would be more sophisticated
      if (condition.includes('stock <')) {
        const value = parseInt(condition.split('<')[1].trim());
        return (data.stock || 0) < value;
      }
      
      if (condition.includes('daysUntilExpiration <=')) {
        const value = parseInt(condition.split('<=')[1].trim());
        return (data.daysUntilExpiration || 999) <= value;
      }
      
      if (condition.includes('status ===')) {
        const status = condition.split('===')[1].trim().replace(/['"]/g, '');
        return data.status === status;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  storeEvent(event: AlertEvent): void {
    this.eventStore.set(event.id, event);
  }

  getEvent(eventId: string): AlertEvent | undefined {
    return this.eventStore.get(eventId);
  }

  getEventsByType(eventType: EventType): AlertEvent[] {
    return Array.from(this.eventStore.values()).filter(event => event.type === eventType);
  }

  getEventsByUser(userId: string): AlertEvent[] {
    return Array.from(this.eventStore.values()).filter(event => event.userId === userId);
  }

  generateAlertMessage(event: AlertEvent, severity: string): { subject: string; content: string } {
    switch (event.type) {
      case 'LOW_STOCK':
        return {
          subject: `Low Stock Alert - ${severity}`,
          content: `Product "${event.data.productName}" is running low on stock. Current stock: ${event.data.stock}. Please reorder soon.`
        };
      
      case 'IMMINENT_EXPIRATION':
        return {
          subject: `Product Expiration Alert - ${severity}`,
          content: `Product "${event.data.productName}" will expire in ${event.data.daysUntilExpiration} days. Please take appropriate action.`
        };
      
      case 'SUPPLIER_ORDER_UPDATE':
        return {
          subject: `Supplier Order Update - ${severity}`,
          content: `Order #${event.data.orderId} status has been updated to: ${event.data.status}. ${event.data.additionalInfo || ''}`
        };
      
      default:
        return {
          subject: 'Alert Notification',
          content: `An alert has been generated for event type: ${event.type}.`
        };
    }
  }
}