const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { validate, bookingFilterSchema } = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all bookings with filtering and pagination
router.get('/', validate(bookingFilterSchema), async (req, res) => {
  try {
    const {
      barber_id,
      service_id,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 20,
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (barber_id) {
      params.push(barber_id);
      conditions.push(`b.barber_id = $${params.length}`);
    }

    if (service_id) {
      params.push(service_id);
      conditions.push(`b.service_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }

    if (start_date) {
      params.push(start_date);
      conditions.push(`b.booking_date >= $${params.length}`);
    }

    if (end_date) {
      params.push(end_date);
      conditions.push(`b.booking_date <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get bookings
    params.push(limit);
    params.push(offset);
    
    const bookingsQuery = `
      SELECT 
        b.*,
        br.name as barber_name,
        s.name as service_name,
        s.duration_minutes,
        s.price
      FROM bookings b
      JOIN barbers br ON b.barber_id = br.id
      JOIN services s ON b.service_id = s.id
      ${whereClause}
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await db.query(bookingsQuery, params);

    res.json({
      bookings: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve bookings',
    });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        b.*,
        br.name as barber_name,
        s.name as service_name,
        s.duration_minutes,
        s.price
      FROM bookings b
      JOIN barbers br ON b.barber_id = br.id
      JOIN services s ON b.service_id = s.id
      WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Booking not found',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve booking',
    });
  }
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const result = await db.query(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Booking not found',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update booking status',
    });
  }
});

// Get booking statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const conditions = [];
    const params = [];

    if (start_date) {
      params.push(start_date);
      conditions.push(`booking_date >= $${params.length}`);
    }

    if (end_date) {
      params.push(end_date);
      conditions.push(`booking_date <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
        SUM(CASE WHEN status = 'completed' THEN (SELECT price FROM services WHERE id = service_id) ELSE 0 END) as total_revenue
      FROM bookings
      ${whereClause}`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve booking statistics',
    });
  }
});

module.exports = router;
