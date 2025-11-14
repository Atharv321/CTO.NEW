import { ReminderJob } from '../models/booking.js';

export interface WhatsAppMessage {
  to: string;
  body: string;
}

export class WhatsAppMessageTemplates {
  /**
   * Format a reminder message for a booking
   */
  static formatReminderMessage(reminder: ReminderJob): WhatsAppMessage {
    const timeUntilAppointment = this.getTimeUntilAppointment(reminder.scheduledTime);
    const formattedTime = this.formatDateTime(reminder.scheduledTime);

    let body = `Hello ${reminder.customerName}! 👋\n\n`;
    body += `This is a reminder about your upcoming appointment.\n\n`;
    body += `📅 Date & Time: ${formattedTime}\n`;
    
    if (reminder.serviceName) {
      body += `✂️ Service: ${reminder.serviceName}\n`;
    }
    
    if (reminder.barberName) {
      body += `💈 Barber: ${reminder.barberName}\n`;
    }
    
    body += `\n⏰ ${timeUntilAppointment}\n\n`;
    body += `Please arrive 5-10 minutes early.\n`;
    body += `Reply CANCEL to cancel this appointment.\n\n`;
    body += `We look forward to seeing you! 💯`;

    return {
      to: reminder.customerPhone,
      body,
    };
  }

  /**
   * Format a cancellation confirmation message
   */
  static formatCancellationMessage(
    customerName: string,
    customerPhone: string,
    scheduledTime: Date
  ): WhatsAppMessage {
    const formattedTime = this.formatDateTime(scheduledTime);

    const body = `Hello ${customerName},\n\n` +
      `Your appointment scheduled for ${formattedTime} has been cancelled.\n\n` +
      `If this was a mistake, please contact us to reschedule.\n\n` +
      `Thank you! 🙏`;

    return {
      to: customerPhone,
      body,
    };
  }

  /**
   * Get human-readable time until appointment
   */
  private static getTimeUntilAppointment(scheduledTime: Date): string {
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 1) {
      return `Your appointment is in ${days} days`;
    } else if (days === 1) {
      return `Your appointment is tomorrow`;
    } else if (hours > 1) {
      return `Your appointment is in ${hours} hours`;
    } else {
      return `Your appointment is coming up soon`;
    }
  }

  /**
   * Format date and time for display
   */
  private static formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}
