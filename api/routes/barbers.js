const express = require('express');
const { barberService } = require('../services');
const { createBarberValidation } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

// GET /api/barbers - Get all barbers
router.get('/', async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const barbers = await barberService.getAllBarbers(includeInactive);
    res.json({
      success: true,
      data: barbers
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/barbers/:id - Get barber by ID
router.get('/:id', async (req, res, next) => {
  try {
    const barber = await barberService.getBarberById(req.params.id);
    res.json({
      success: true,
      data: barber
    });
  } catch (error) {
    if (error.message === 'Barber not found') {
      return res.status(404).json({
        success: false,
        error: 'Barber not found'
      });
    }
    next(error);
  }
});

// POST /api/barbers - Create new barber
router.post('/', createBarberValidation, async (req, res, next) => {
  try {
    const barber = await barberService.createBarber(req.body);
    res.status(201).json({
      success: true,
      data: barber
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/barbers/:id - Update barber
router.put('/:id', createBarberValidation, async (req, res, next) => {
  try {
    const barber = await barberService.updateBarber(req.params.id, req.body);
    res.json({
      success: true,
      data: barber
    });
  } catch (error) {
    if (error.message === 'Barber not found') {
      return res.status(404).json({
        success: false,
        error: 'Barber not found'
      });
    }
    next(error);
  }
});

// DELETE /api/barbers/:id - Delete barber
router.delete('/:id', async (req, res, next) => {
  try {
    await barberService.deleteBarber(req.params.id);
    res.json({
      success: true,
      message: 'Barber deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Barber not found') {
      return res.status(404).json({
        success: false,
        error: 'Barber not found'
      });
    }
    if (error.message === 'Cannot delete barber with existing bookings') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete barber with existing bookings'
      });
    }
    next(error);
  }
});

module.exports = router;