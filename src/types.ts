export type TipoPlan = 'basico' | 'pro' | 'enterprise';
export type EstadoSuscripcion = 'ACTIVO' | 'VENCIDO_GRACIA' | 'SUSPENDIDO';
export type RolUsuario = 'SUPERADMIN' | 'ADMIN_NEGOCIO' | 'superadmin' | 'admin' | 'personal';
export type TipoTransaccionCredito = 'RECARGA' | 'DEBITO_BOT' | 'AJUSTE_MANUAL' | 'RECARGA_MANUAL' | 'CONSUMO_BOT';
export type EstadoSolicitudRecarga = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'confirmado' | 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
export type OrigenCita = 'whatsapp' | 'web' | 'app';
export type TipoRemitente = 'cliente' | 'bot' | 'agente';

export interface Negocio {
  id_negocio: string;
  nombre_negocio?: string;
  nombre_comercial?: string;
  logo_url?: string | null;
  telefono_whatsapp: string;
  tipo_plan?: TipoPlan;
  saldo_creditos: number;
  estado_suscripcion: EstadoSuscripcion;
  prompt_personalidad: string;
  instancia_evolution_id?: string | null;
  created_at: string;
  updated_at: string;
  total_citas?: number;
  total_chats?: number;
  total_clientes?: number;
  admin_correo?: string;
  admin_nombre?: string;
}

export interface Perfil {
  id_usuario: string;
  id_negocio?: string | null;
  correo: string;
  email?: string;
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
  monto?: number;
  cantidad?: number;
  saldo_anterior?: number;
  saldo_nuevo?: number;
  tipo_transaccion?: TipoTransaccionCredito;
  tipo?: TipoTransaccionCredito;
  descripcion?: string | null;
  id_referencia?: string | null;
  creado_por?: string | null;
  created_at: string;
  nombre_negocio?: string;
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
  email?: string | null;
  telefono?: string | null;
  es_activo?: boolean;
  activo?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id_servicio: string;
  id_negocio: string;
  nombre_servicio?: string;
  nombre?: string;
  duracion_minutos: number;
  precio: number;
  es_activo?: boolean;
  id_empleado?: string | null;
  empleado_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id_cliente: string;
  id_negocio: string;
  nombre: string;
  telefono_whatsapp?: string;
  telefono?: string;
  email?: string | null;
  ultima_visita?: string | null;
  total_visitas?: number;
  created_at: string;
  updated_at: string;
}

export interface Cita {
  id_cita: string;
  id_negocio: string;
  id_cliente: string;
  id_empleado: string;
  id_servicio: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: EstadoCita;
  google_calendar_event_id?: string | null;
  notas?: string | null;
  origen?: OrigenCita;
  precio?: number;
  created_at: string;
  updated_at: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  servicio_nombre?: string;
  empleado_nombre?: string;
}

export interface Chat {
  id_chat: string;
  id_negocio: string;
  id_cliente: string;
  bot_activo?: boolean;
  mensajes_no_leidos?: number;
  ultimo_mensaje?: string | null;
  ultimo_mensaje_at: string;
  created_at: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
}

export interface Mensaje {
  id_mensaje: string;
  id_negocio: string;
  id_chat: string;
  es_remitente_bot?: boolean;
  tipo_remitente?: TipoRemitente;
  contenido: string;
  metadata?: any;
  estado?: string;
  created_at: string;
}

export interface ListaBlancaBot {
  id_lista_blanca: string;
  id_negocio: string;
  nombre: string;
  telefono: string;
  created_at: string;
}

export interface DemoAccount {
  id_usuario: string;
  correo: string;
  nombre_completo: string;
  es_superadmin: boolean;
  rol: RolUsuario;
  negocio_nombre: string;
  negocio_plan: string;
  negocio_estado: string;
  saldo_creditos: number | string;
}
