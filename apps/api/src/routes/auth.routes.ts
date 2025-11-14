import { Router } from 'express';

import { authenticate, resolveUser } from '../middleware/authentication';
import { authController } from '../modules/auth/auth.controller';

const router = Router();

router.post('/register', resolveUser, authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export const authRoutes = router;
