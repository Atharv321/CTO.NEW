const Joi = require('joi');

// Auth schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const magicLinkRequestSchema = Joi.object({
  email: Joi.string().email().required(),
});

const magicLinkVerifySchema = Joi.object({
  token: Joi.string().required(),
});

// Service schemas
const createServiceSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  duration_minutes: Joi.number().integer().min(1).required(),
  price: Joi.number().positive().precision(2).required(),
  active: Joi.boolean().default(true),
});

const updateServiceSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().allow('', null),
  duration_minutes: Joi.number().integer().min(1),
  price: Joi.number().positive().precision(2),
  active: Joi.boolean(),
}).min(1);

// Barber schemas
const createBarberSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(50).allow('', null),
  active: Joi.boolean().default(true),
});

const updateBarberSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(50).allow('', null),
  active: Joi.boolean(),
}).min(1);

// Availability template schemas
const createAvailabilityTemplateSchema = Joi.object({
  barber_id: Joi.number().integer().positive().required(),
  day_of_week: Joi.number().integer().min(0).max(6).required(),
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
});

const updateAvailabilityTemplateSchema = Joi.object({
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
}).min(1);

// Availability override schemas
const createAvailabilityOverrideSchema = Joi.object({
  barber_id: Joi.number().integer().positive().required(),
  date: Joi.date().iso().required(),
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null),
  is_available: Joi.boolean().required(),
  reason: Joi.string().max(255).allow('', null),
});

const updateAvailabilityOverrideSchema = Joi.object({
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null),
  is_available: Joi.boolean(),
  reason: Joi.string().max(255).allow('', null),
}).min(1);

// Booking filter schema
const bookingFilterSchema = Joi.object({
  barber_id: Joi.number().integer().positive(),
  service_id: Joi.number().integer().positive(),
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const dataToValidate = req.method === 'GET' ? req.query : req.body;
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }
    next();
  };
};

module.exports = {
  validate,
  loginSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  createServiceSchema,
  updateServiceSchema,
  createBarberSchema,
  updateBarberSchema,
  createAvailabilityTemplateSchema,
  updateAvailabilityTemplateSchema,
  createAvailabilityOverrideSchema,
  updateAvailabilityOverrideSchema,
  bookingFilterSchema,
};
