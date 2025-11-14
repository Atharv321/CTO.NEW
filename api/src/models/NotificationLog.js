const { query } = require('../config/database');

class NotificationLog {
  static async create(data) {
    const {
      bookingId,
      recipientPhone,
      recipientName,
      messageType = 'booking_confirmation',
      messageTemplate,
      messageContent,
      status = 'pending',
      provider = 'twilio',
    } = data;

    const result = await query(
      `INSERT INTO notification_log 
       (booking_id, recipient_phone, recipient_name, message_type, message_template, 
        message_content, status, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [bookingId, recipientPhone, recipientName, messageType, messageTemplate, 
       messageContent, status, provider]
    );

    return result.rows[0];
  }

  static async updateStatus(id, status, additionalData = {}) {
    const fields = ['status = $2'];
    const values = [id, status];
    let paramCount = 3;

    if (additionalData.providerMessageId) {
      fields.push(`provider_message_id = $${paramCount}`);
      values.push(additionalData.providerMessageId);
      paramCount++;
    }

    if (additionalData.errorMessage) {
      fields.push(`error_message = $${paramCount}`);
      values.push(additionalData.errorMessage);
      paramCount++;
    }

    if (additionalData.retryCount !== undefined) {
      fields.push(`retry_count = $${paramCount}`);
      values.push(additionalData.retryCount);
      paramCount++;
    }

    if (status === 'sent') {
      fields.push(`sent_at = CURRENT_TIMESTAMP`);
    }

    const result = await query(
      `UPDATE notification_log 
       SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM notification_log WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByBookingId(bookingId) {
    const result = await query(
      'SELECT * FROM notification_log WHERE booking_id = $1 ORDER BY created_at DESC',
      [bookingId]
    );
    return result.rows;
  }

  static async incrementRetryCount(id) {
    const result = await query(
      `UPDATE notification_log 
       SET retry_count = retry_count + 1
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = NotificationLog;
