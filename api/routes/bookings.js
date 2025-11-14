const express = require('express');
const bookingService = require('../services/bookingService');
const { serviceService } = require('../services');
const { 
  createBookingValidation, 
  getBookingsValidation,
  getAvailableSlotsValidation 
} = require('../middleware/validation');
const { bookingLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Apply booking-specific rate limiting
router.use(bookingLimiter);

// GET /api/bookings/available-slots - Get available slots for a barber
router.get('/available-slots', getAvailableSlotsValidation, async (req, res, next) => {
  try {
    const { barberId, date } = req.query;
    
    // Get service duration from query or use default
    const serviceId = req.query.serviceId;
    let serviceDuration = 30; // Default 30 minutes
    
    if (serviceId) {
      const service = await serviceService.service.getServiceById(serviceId);
      serviceDuration = service.duration;
    }

    const availableSlots = await bookingService.generateAvailableSlots(
      barberId, 
      date, 
      serviceDuration
    );

    res.json({
      success: true,
      data: {
        barberId,
        date,
        serviceDuration,
        availableSlots: availableSlots.map(slot => slot.toISOString())
      }
    });
  } catch (error) {
    if (error.message === 'Barber not available on this day') {
      return res.status(400).json({
        success: false,
        error: 'Barber not available on this day'
      });
    }
    next(error);
  }
});

// GET /api/bookings - Get bookings with optional filters
router.get('/', getBookingsValidation, async (req, res, next) => {
  try {
    const filters = {
      customerId: req.query.customerId,
      barberId: req.query.barberId,
      status: req.query.status,
      date: req.query.date
    };

    const bookings = await bookingService.getBookings(filters);
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    next(error);
  }
});

// POST /api/bookings - Create new booking
router.post('/', createBookingValidation, async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    if (error.message === 'Service not found') {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    if (error.message === 'Barber not available') {
      return res.status(400).json({
        success: false,
        error: 'Barber not available'
      });
    }
    if (error.message === 'Time slot is already booked') {
      return res.status(409).json({
        success: false,
        error: 'Time slot is already booked'
      });
    }
    next(error);
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const booking = await bookingService.updateBookingStatus(req.params.id, status);
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    next(error);
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', async (req, res, next) => {
  try {
    const customerId = req.query.customerId; // Optional customer ID for authorization
    const booking = await bookingService.cancelBooking(req.params.id, customerId);
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    if (error.message === 'Cannot cancel this booking') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel this booking'
      });
    }
    next(error);
  }
});

module.exports = router;