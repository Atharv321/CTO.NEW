const express = require('express');
const NotificationLog = require('../models/NotificationLog');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { bookingId } = req.query;

    if (bookingId) {
      const logs = await NotificationLog.findByBookingId(parseInt(bookingId, 10));
      return res.json({ notifications: logs });
    }

    return res.status(400).json({
      error: 'bookingId query parameter is required',
    });
  } catch (error) {
    logger.error('Failed to fetch notification logs', { error: error.message });
    return res.status(500).json({
      error: 'Failed to fetch notification logs',
      message: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationLog.findById(parseInt(id, 10));

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ notification });
  } catch (error) {
    logger.error('Failed to fetch notification', { error: error.message });
    return res.status(500).json({
      error: 'Failed to fetch notification',
      message: error.message,
    });
  }
});

module.exports = router;
