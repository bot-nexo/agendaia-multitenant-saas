// server/routes/pending.routes.ts
import { Router } from 'express';
import {
  getNegociosPendientes,
  aprobarNegocio,
  bloquearNegocio,
} from '../controllers/pending.controller';
import { authMiddleware, requireSuperAdminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require SuperAdmin role
router.use(authMiddleware, requireSuperAdminMiddleware);

// GET pending businesses
router.get('/negocios-pendientes', getNegociosPendientes);

// Approve a pending business
router.patch('/negocios/:id_negocio/aprobar', aprobarNegocio);

// Block a pending business
router.patch('/negocios/:id_negocio/bloquear', bloquearNegocio);

export default router;
