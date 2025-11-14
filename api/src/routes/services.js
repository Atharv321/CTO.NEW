const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const {
  validate,
  createServiceSchema,
  updateServiceSchema,
} = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all services
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM services ORDER BY name ASC'
    );

    res.json({
      services: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve services',
    });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM services WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service not found',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve service',
    });
  }
});

// Create service
router.post('/', validate(createServiceSchema), async (req, res) => {
  try {
    const { name, description, duration_minutes, price, active } = req.body;

    const result = await db.query(
      `INSERT INTO services (name, description, duration_minutes, price, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, duration_minutes, price, active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create service',
    });
  }
});

// Update service
router.put('/:id', validate(updateServiceSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if service exists
    const checkResult = await db.query('SELECT id FROM services WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service not found',
      });
    }

    // Build update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    const result = await db.query(
      `UPDATE services 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update service',
    });
  }
});

// Delete service
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service has bookings
    const bookingsResult = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE service_id = $1',
      [id]
    );

    if (parseInt(bookingsResult.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete service with existing bookings. Consider deactivating instead.',
      });
    }

    const result = await db.query(
      'DELETE FROM services WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service not found',
      });
    }

    res.json({
      message: 'Service deleted successfully',
      service: result.rows[0],
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete service',
    });
  }
});

module.exports = router;
