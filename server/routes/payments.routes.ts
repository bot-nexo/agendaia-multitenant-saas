// server/routes/payments.routes.ts
import { Router } from 'express';
import { registrarPagoManual } from '../controllers/payments.controller';
import { authMiddleware, requireSuperAdminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication; approval not needed for manual payment registration
router.use(authMiddleware);

router.post('/manual', registrarPagoManual);

export default router;
