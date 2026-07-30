import { Router } from 'express';
import {
  getAllNegocios,
  createNegocio,
  updateNegocioSuscripcion,
  adjustCreditosNegocio,
  getTransaccionesCredito,
  getGlobalAnalytics,
  getSolicitudesRecargaAdmin,
  aprobarSolicitudRecargaAdmin,
  rechazarSolicitudRecargaAdmin
} from '../controllers/admin.controller';
import { authMiddleware, requireSuperAdminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes here require SuperAdmin role
router.use(authMiddleware, requireSuperAdminMiddleware);

// /api/v1/admin/...
router.get('/negocios', getAllNegocios);
router.post('/negocios', createNegocio);
router.patch('/negocios/:id_negocio/suscripcion', updateNegocioSuscripcion);
router.post('/negocios/:id_negocio/creditos', adjustCreditosNegocio);
router.get('/transacciones', getTransaccionesCredito);
router.get('/analytics', getGlobalAnalytics);

// Solicitudes de Recarga (SuperAdmin Approval)
router.get('/solicitudes-recarga', getSolicitudesRecargaAdmin);
router.patch('/solicitudes-recarga/:id_solicitud/aprobar', aprobarSolicitudRecargaAdmin);
router.patch('/solicitudes-recarga/:id_solicitud/rechazar', rechazarSolicitudRecargaAdmin);

export default router;
