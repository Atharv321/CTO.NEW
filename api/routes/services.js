const express = require('express');
const { serviceService } = require('../services');
const { createServiceValidation } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

// GET /api/services - Get all services
router.get('/', async (req, res, next) => {
  try {
    const services = await serviceService.getAllServices();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/services/:id - Get service by ID
router.get('/:id', async (req, res, next) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    if (error.message === 'Service not found') {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    next(error);
  }
});

// POST /api/services - Create new service
router.post('/', createServiceValidation, async (req, res, next) => {
  try {
    const service = await serviceService.createService(req.body);
    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/services/:id - Update service
router.put('/:id', createServiceValidation, async (req, res, next) => {
  try {
    const service = await serviceService.updateService(req.params.id, req.body);
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    if (error.message === 'Service not found') {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    next(error);
  }
});

// DELETE /api/services/:id - Delete service
router.delete('/:id', async (req, res, next) => {
  try {
    await serviceService.deleteService(req.params.id);
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Service not found') {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    if (error.message === 'Cannot delete service with existing bookings') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete service with existing bookings'
      });
    }
    next(error);
  }
});

module.exports = router;