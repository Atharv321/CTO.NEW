import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'uuid' | 'email';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check if required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[rule.field] = `${rule.field} is required`;
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Check type
      if (rule.type === 'number') {
        if (typeof value !== 'number') {
          errors[rule.field] = `${rule.field} must be a number`;
        }
      } else if (rule.type === 'uuid') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(value))) {
          errors[rule.field] = `${rule.field} must be a valid UUID`;
        }
      } else if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          errors[rule.field] = `${rule.field} must be a valid email`;
        }
      } else if (rule.type === 'string') {
        if (typeof value !== 'string') {
          errors[rule.field] = `${rule.field} must be a string`;
        }
      }

      // Check string length
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors[rule.field] = `${rule.field} must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[rule.field] = `${rule.field} must be at most ${rule.maxLength} characters`;
        }
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(String(value))) {
        errors[rule.field] = `${rule.field} has invalid format`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
};
