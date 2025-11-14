const express = require('express');
const { customerService } = require('../services');
const { createCustomerValidation } = require('../middleware/validation');
const { customerLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Apply customer-specific rate limiting
router.use(customerLimiter);

// GET /api/customers - Get all customers
router.get('/', async (req, res, next) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    next(error);
  }
});

// POST /api/customers - Create new customer
router.post('/', createCustomerValidation, async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', createCustomerValidation, async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    next(error);
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    if (error.message === 'Cannot delete customer with existing bookings') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer with existing bookings'
      });
    }
    next(error);
  }
});

module.exports = router;