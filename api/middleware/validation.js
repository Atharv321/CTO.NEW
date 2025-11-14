const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Service validations
const createServiceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('duration')
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  handleValidationErrors
];

// Barber validations
const createBarberValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Barber name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters'),
  handleValidationErrors
];

// Customer validations
const createCustomerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  handleValidationErrors
];

// Booking validations
const createBookingValidation = [
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isUUID()
    .withMessage('Invalid customer ID format'),
  body('barberId')
    .notEmpty()
    .withMessage('Barber ID is required')
    .isUUID()
    .withMessage('Invalid barber ID format'),
  body('serviceId')
    .notEmpty()
    .withMessage('Service ID is required')
    .isUUID()
    .withMessage('Invalid service ID format'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors
];

// Availability validations
const createAvailabilityValidation = [
  body('barberId')
    .notEmpty()
    .withMessage('Barber ID is required')
    .isUUID()
    .withMessage('Invalid barber ID format'),
  body('dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  body('startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
    .custom((value, { req }) => {
      const startTime = req.body.startTime;
      const endTime = value;
      
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      
      if (end <= start) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  handleValidationErrors
];

// Query parameter validations
const getAvailableSlotsValidation = [
  query('barberId')
    .notEmpty()
    .withMessage('Barber ID is required')
    .isUUID()
    .withMessage('Invalid barber ID format'),
  query('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  handleValidationErrors
];

const getBookingsValidation = [
  query('customerId')
    .optional()
    .isUUID()
    .withMessage('Invalid customer ID format'),
  query('barberId')
    .optional()
    .isUUID()
    .withMessage('Invalid barber ID format'),
  query('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .withMessage('Invalid status value'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  handleValidationErrors
];

module.exports = {
  createServiceValidation,
  createBarberValidation,
  createCustomerValidation,
  createBookingValidation,
  createAvailabilityValidation,
  getAvailableSlotsValidation,
  getBookingsValidation,
  handleValidationErrors
};