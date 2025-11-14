import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { HttpError } from '../../errors/http-error';
import { authService } from './auth.service';
import { loginSchema, registerSchema } from './auth.validators';

function handleValidationError(error: unknown, next: NextFunction) {
  if (error instanceof ZodError) {
    next(new HttpError(400, 'Validation failed', error.flatten()));
    return true;
  }

  return false;
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = registerSchema.parse(req.body);
      const result = await authService.register(payload, req.user);
      res.status(201).json(result);
    } catch (error) {
      if (!handleValidationError(error, next)) {
        next(error);
      }
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = loginSchema.parse(req.body);
      const result = await authService.login(payload);
      res.status(200).json(result);
    } catch (error) {
      if (!handleValidationError(error, next)) {
        next(error);
      }
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const headerToken = req.headers['x-refresh-token'];
      const bodyToken = (req.body as { refreshToken?: string })?.refreshToken;
      const refreshToken = bodyToken ?? (Array.isArray(headerToken) ? headerToken[0] : headerToken);
      const result = await authService.refresh(refreshToken);
      res.status(200).json(result);
    } catch (error) {
      if (!handleValidationError(error, next)) {
        next(error);
      }
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const headerToken = req.headers['x-refresh-token'];
      const bodyToken = (req.body as { refreshToken?: string })?.refreshToken;
      const refreshToken = bodyToken ?? (Array.isArray(headerToken) ? headerToken[0] : headerToken);
      await authService.logout(refreshToken);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new HttpError(401, 'Authentication required');
      }

      const profile = await authService.getProfile(req.user.id);
      res.status(200).json({ user: profile });
    } catch (error) {
      next(error);
    }
  },
};
