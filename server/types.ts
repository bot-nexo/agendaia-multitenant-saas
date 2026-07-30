/**
 * Multi-Tenant Database Schema Types
 * Based on PostgreSQL / Supabase SQL Schema
 */

export type TipoPlan = 'basico' | 'pro' | 'enterprise';
export type EstadoSuscripcion = 'ACTIVO' | 'VENCIDO_GRACIA' | 'SUSPENDIDO';
export type RolUsuario = 'superadmin' | 'admin' | 'personal';
export type TipoTransaccionCredito = 'RECARGA_MANUAL' | 'CONSUMO_BOT' | 'PROMO' | 'SUSCRIPCION';
export type EstadoSolicitudRecarga = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type EstadoCita = 'confirmado' | 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
export type OrigenCita = 'whatsapp' | 'web' | 'app';
export type TipoRemitente = 'cliente' | 'bot' | 'agente';
export type EstadoMensaje = 'enviado' | 'entregado' | 'leido';

export interface Negocio {
  id_negocio: string;
  nombre_comercial: string;
  logo_url?: string | null;
  telefono_whatsapp: string;
  tipo_plan: TipoPlan;
  saldo_creditos: number;
  estado_suscripcion: EstadoSuscripcion;
  prompt_personalidad: string;
  created_at: string;
  updated_at: string;
}

export interface Perfil {
  id_usuario: string;
  id_negocio?: string | null;
  correo: string;
  password?: string;
  nombre_completo: string;
  avatar_url?: string | null;
  rol: RolUsuario;
  es_superadmin: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransaccionCredito {
  id_transaccion: string;
  id_negocio: string;
  monto: number;
  tipo: TipoTransaccionCredito;
  descripcion?: string | null;
  id_referencia?: string | null;
  creado_por?: string | null;
  created_at: string;
}

export interface SolicitudRecarga {
  id_solicitud: string;
  id_negocio: string;
  negocio_nombre?: string;
  id_usuario_solicitante: string;
  nombre_solicitante?: string;
  correo_solicitante?: string;
  paquete_creditos: number;
  monto_cop_usd: string;
  metodo_pago: string;
  comprobante_url: string;
  numero_referencia?: string | null;
  notas_negocio?: string | null;
  estado: EstadoSolicitudRecarga;
  notas_admin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Empleado {
  id_empleado: string;
  id_negocio: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id_servicio: string;
  id_negocio: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
  id_empleado?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id_cliente: string;
  id_negocio: string;
  nombre: string;
  telefono: string;
  ultima_visita?: string | null;
  total_visitas: number;
  created_at: string;
  updated_at: string;
}

export interface Cita {
  id_cita: string;
  id_negocio: string;
  id_cliente: string;
  id_empleado?: string | null;
  id_servicio?: string | null;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: EstadoCita;
  origen: OrigenCita;
  precio: number;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id_chat: string;
  id_negocio: string;
  id_cliente: string;
  bot_activo: boolean;
  mensajes_no_leidos: number;
  ultimo_mensaje?: string | null;
  ultimo_mensaje_at: string;
  created_at: string;
}

export interface Mensaje {
  id_mensaje: string;
  id_negocio: string;
  id_chat: string;
  tipo_remitente: TipoRemitente;
  contenido: string;
  estado: EstadoMensaje;
  created_at: string;
}

export interface ListaBlancaBot {
  id_lista_blanca: string;
  id_negocio: string;
  nombre: string;
  telefono: string;
  created_at: string;
}

/**
 * Standard API Response payload
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | null;
  message?: string;
}

/**
 * Express JWT Payload
 */
export interface JwtUserPayload {
  id_usuario: string;
  correo: string;
  nombre_completo: string;
  es_superadmin: boolean;
  id_negocio: string | null;
  rol: RolUsuario;
}
