import { Router } from 'express';
import {
  getTenantDashboardSummary,
  getCitas,
  createCita,
  updateEstadoCita,
  deleteCita,
  getServicios,
  createServicio,
  deleteServicio,
  getEmpleados,
  createEmpleado,
  deleteEmpleado,
  getClientes,
  createCliente,
  getChats,
  getMensajesChat,
  toggleBotChat,
  sendMensajeAgent,
  triggerAiBotReply,
  getBusinessConfig,
  updateBusinessConfig,
  createListaBlancaItem,
  deleteListaBlancaItem,
  getSolicitudesRecargaTenant,
  createSolicitudRecargaTenant
} from '../controllers/tenant.controller';
import { authMiddleware, tenantIsolationMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes here are isolated by tenant (WHERE id_negocio = req.user.id_negocio)
router.use(authMiddleware, tenantIsolationMiddleware);

// Summary & Overview
router.get('/dashboard-summary', getTenantDashboardSummary);

// Citas
router.get('/citas', getCitas);
router.post('/citas', createCita);
router.patch('/citas/:id_cita/estado', updateEstadoCita);
router.delete('/citas/:id_cita', deleteCita);

// Servicios
router.get('/servicios', getServicios);
router.post('/servicios', createServicio);
router.delete('/servicios/:id_servicio', deleteServicio);

// Empleados
router.get('/empleados', getEmpleados);
router.post('/empleados', createEmpleado);
router.delete('/empleados/:id_empleado', deleteEmpleado);

// Clientes
router.get('/clientes', getClientes);
router.post('/clientes', createCliente);

// Live Chat & Bot Messages
router.get('/chats', getChats);
router.get('/chats/:id_chat/mensajes', getMensajesChat);
router.patch('/chats/:id_chat/toggle-bot', toggleBotChat);
router.post('/chats/:id_chat/mensajes', sendMensajeAgent);
router.post('/chats/:id_chat/ai-reply', triggerAiBotReply);

// Configuración & Lista Blanca
router.get('/configuracion', getBusinessConfig);
router.put('/configuracion', updateBusinessConfig);
router.post('/lista-blanca', createListaBlancaItem);
router.delete('/lista-blanca/:id_lista_blanca', deleteListaBlancaItem);

// Solicitudes de Recarga
router.get('/solicitudes-recarga', getSolicitudesRecargaTenant);
router.post('/solicitudes-recarga', createSolicitudRecargaTenant);

export default router;
