const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const {
  validate,
  createBarberSchema,
  updateBarberSchema,
} = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all barbers
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM barbers ORDER BY name ASC'
    );

    res.json({
      barbers: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get barbers error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve barbers',
    });
  }
});

// Get barber by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM barbers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Barber not found',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get barber error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve barber',
    });
  }
});

// Create barber
router.post('/', validate(createBarberSchema), async (req, res) => {
  try {
    const { name, email, phone, active } = req.body;

    const result = await db.query(
      `INSERT INTO barbers (name, email, phone, active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, phone, active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'A barber with this email already exists',
      });
    }
    console.error('Create barber error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create barber',
    });
  }
});

// Update barber
router.put('/:id', validate(updateBarberSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if barber exists
    const checkResult = await db.query('SELECT id FROM barbers WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Barber not found',
      });
    }

    // Build update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    const result = await db.query(
      `UPDATE barbers 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'A barber with this email already exists',
      });
    }
    console.error('Update barber error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update barber',
    });
  }
});

// Delete barber
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if barber has bookings
    const bookingsResult = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE barber_id = $1',
      [id]
    );

    if (parseInt(bookingsResult.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete barber with existing bookings. Consider deactivating instead.',
      });
    }

    const result = await db.query(
      'DELETE FROM barbers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Barber not found',
      });
    }

    res.json({
      message: 'Barber deleted successfully',
      barber: result.rows[0],
    });
  } catch (error) {
    console.error('Delete barber error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete barber',
    });
  }
});

module.exports = router;
