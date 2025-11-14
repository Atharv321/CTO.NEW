const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const {
  validate,
  createAvailabilityTemplateSchema,
  updateAvailabilityTemplateSchema,
  createAvailabilityOverrideSchema,
  updateAvailabilityOverrideSchema,
} = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ===== Availability Templates (Recurring) =====

// Get availability templates for a barber
router.get('/templates/barber/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;

    const result = await db.query(
      `SELECT at.*, b.name as barber_name
       FROM availability_templates at
       JOIN barbers b ON at.barber_id = b.id
       WHERE at.barber_id = $1
       ORDER BY at.day_of_week, at.start_time`,
      [barberId]
    );

    res.json({
      templates: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get availability templates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve availability templates',
    });
  }
});

// Get all availability templates
router.get('/templates', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT at.*, b.name as barber_name
       FROM availability_templates at
       JOIN barbers b ON at.barber_id = b.id
       ORDER BY b.name, at.day_of_week, at.start_time`
    );

    res.json({
      templates: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get availability templates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve availability templates',
    });
  }
});

// Create availability template
router.post('/templates', validate(createAvailabilityTemplateSchema), async (req, res) => {
  try {
    const { barber_id, day_of_week, start_time, end_time } = req.body;

    // Verify barber exists
    const barberCheck = await db.query('SELECT id FROM barbers WHERE id = $1', [barber_id]);
    if (barberCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Barber not found',
      });
    }

    // Validate time range
    if (start_time >= end_time) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Start time must be before end time',
      });
    }

    const result = await db.query(
      `INSERT INTO availability_templates (barber_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [barber_id, day_of_week, start_time, end_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'Availability template already exists for this barber, day, and time',
      });
    }
    console.error('Create availability template error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create availability template',
    });
  }
});

// Update availability template
router.put('/templates/:id', validate(updateAvailabilityTemplateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if template exists
    const checkResult = await db.query('SELECT * FROM availability_templates WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Availability template not found',
      });
    }

    // Validate time range if both times are being updated
    const template = checkResult.rows[0];
    const newStartTime = updates.start_time || template.start_time;
    const newEndTime = updates.end_time || template.end_time;

    if (newStartTime >= newEndTime) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Start time must be before end time',
      });
    }

    // Build update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    const result = await db.query(
      `UPDATE availability_templates 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update availability template error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update availability template',
    });
  }
});

// Delete availability template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM availability_templates WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Availability template not found',
      });
    }

    res.json({
      message: 'Availability template deleted successfully',
      template: result.rows[0],
    });
  } catch (error) {
    console.error('Delete availability template error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete availability template',
    });
  }
});

// ===== Availability Overrides (Specific Dates) =====

// Get availability overrides for a barber
router.get('/overrides/barber/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT ao.*, b.name as barber_name
      FROM availability_overrides ao
      JOIN barbers b ON ao.barber_id = b.id
      WHERE ao.barber_id = $1
    `;
    const params = [barberId];

    if (start_date) {
      params.push(start_date);
      query += ` AND ao.date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND ao.date <= $${params.length}`;
    }

    query += ' ORDER BY ao.date';

    const result = await db.query(query, params);

    res.json({
      overrides: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get availability overrides error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve availability overrides',
    });
  }
});

// Get all availability overrides
router.get('/overrides', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT ao.*, b.name as barber_name
      FROM availability_overrides ao
      JOIN barbers b ON ao.barber_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND ao.date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND ao.date <= $${params.length}`;
    }

    query += ' ORDER BY ao.date, b.name';

    const result = await db.query(query, params);

    res.json({
      overrides: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get availability overrides error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve availability overrides',
    });
  }
});

// Create availability override
router.post('/overrides', validate(createAvailabilityOverrideSchema), async (req, res) => {
  try {
    const { barber_id, date, start_time, end_time, is_available, reason } = req.body;

    // Verify barber exists
    const barberCheck = await db.query('SELECT id FROM barbers WHERE id = $1', [barber_id]);
    if (barberCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Barber not found',
      });
    }

    // Validate time range if available and times are provided
    if (is_available && start_time && end_time && start_time >= end_time) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Start time must be before end time',
      });
    }

    const result = await db.query(
      `INSERT INTO availability_overrides (barber_id, date, start_time, end_time, is_available, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [barber_id, date, start_time, end_time, is_available, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'Availability override already exists for this barber and date',
      });
    }
    console.error('Create availability override error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create availability override',
    });
  }
});

// Update availability override
router.put('/overrides/:id', validate(updateAvailabilityOverrideSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if override exists
    const checkResult = await db.query('SELECT * FROM availability_overrides WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Availability override not found',
      });
    }

    // Build update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    const result = await db.query(
      `UPDATE availability_overrides 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update availability override error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update availability override',
    });
  }
});

// Delete availability override
router.delete('/overrides/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM availability_overrides WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Availability override not found',
      });
    }

    res.json({
      message: 'Availability override deleted successfully',
      override: result.rows[0],
    });
  } catch (error) {
    console.error('Delete availability override error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete availability override',
    });
  }
});

module.exports = router;
