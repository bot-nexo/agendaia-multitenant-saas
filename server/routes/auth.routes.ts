import { Router } from 'express';
import { loginUser, registerTenant, getMe, getDemoAccounts } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// /api/v1/auth
router.post('/login', loginUser);
router.post('/register', registerTenant);
router.get('/me', authMiddleware, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
