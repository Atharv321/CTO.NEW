import type { Express } from 'express';

import { authRoutes } from './auth.routes';
import { protectedRoutes } from './protected.routes';

export function registerRoutes(app: Express): void {
  app.use('/auth', authRoutes);
  app.use('/secure', protectedRoutes);
}
