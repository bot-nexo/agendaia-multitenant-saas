-- ============================================================
-- AgendaIA SaaS - Supabase Database Schema (v1)
-- ============================================================
-- Ejecutar este script en el SQL Editor de tu proyecto Supabase.
-- La autenticación de usuarios se maneja con Supabase Auth (auth.users).
-- La tabla "perfiles" extiende los usuarios con metadatos de negocio.
-- ============================================================

-- 1. Negocios (Tenants)
CREATE TABLE negocios (
  id_negocio TEXT PRIMARY KEY,
  nombre_comercial TEXT NOT NULL,
  logo_url TEXT,
  telefono_whatsapp TEXT NOT NULL,
  tipo_plan TEXT NOT NULL DEFAULT 'basico' CHECK (tipo_plan IN ('basico', 'pro', 'enterprise')),
  saldo_creditos INTEGER NOT NULL DEFAULT 0,
  estado_suscripcion TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado_suscripcion IN ('ACTIVO', 'VENCIDO_GRACIA', 'SUSPENDIDO')),
  prompt_personalidad TEXT NOT NULL DEFAULT 'Eres un asistente cordial y eficiente que agenda citas para nuestro negocio.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfiles (extiende auth.users de Supabase Auth)
CREATE TABLE perfiles (
  id_usuario UUID PRIMARY KEY REFERENCES auth.users NOT NULL,
  id_negocio TEXT REFERENCES negocios(id_negocio) ON DELETE SET NULL,
  correo TEXT,
  nombre_completo TEXT NOT NULL,
  avatar_url TEXT,
  rol TEXT NOT NULL DEFAULT 'admin' CHECK (rol IN ('superadmin', 'admin', 'personal')),
  es_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transacciones de Crédito
CREATE TABLE transacciones_credito (
  id_transaccion TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  monto INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('RECARGA_MANUAL', 'CONSUMO_BOT', 'PROMO', 'SUSCRIPCION')),
  descripcion TEXT,
  id_referencia TEXT,
  creado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Empleados (v2 - vacío en v1)
CREATE TABLE empleados (
  id_empleado TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Servicios
CREATE TABLE servicios (
  id_servicio TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  nombre TEXT NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  precio NUMERIC(10,2) NOT NULL,
  id_empleado TEXT REFERENCES empleados(id_empleado),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Clientes
CREATE TABLE clientes (
  id_cliente TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  ultima_visita DATE,
  total_visitas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Citas
CREATE TABLE citas (
  id_cita TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  id_cliente TEXT REFERENCES clientes(id_cliente) NOT NULL,
  id_servicio TEXT REFERENCES servicios(id_servicio),
  id_empleado TEXT,
  fecha_hora_inicio TIMESTAMPTZ NOT NULL,
  fecha_hora_fin TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'pendiente', 'en_proceso', 'completado', 'cancelado')),
  origen TEXT NOT NULL DEFAULT 'web' CHECK (origen IN ('whatsapp', 'web', 'app')),
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Chats
CREATE TABLE chats (
  id_chat TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  id_cliente TEXT REFERENCES clientes(id_cliente) NOT NULL,
  bot_activo BOOLEAN NOT NULL DEFAULT TRUE,
  mensajes_no_leidos INTEGER NOT NULL DEFAULT 0,
  ultimo_mensaje TEXT,
  ultimo_mensaje_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Mensajes
CREATE TABLE mensajes (
  id_mensaje TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  id_chat TEXT REFERENCES chats(id_chat) NOT NULL,
  tipo_remitente TEXT NOT NULL DEFAULT 'cliente' CHECK (tipo_remitente IN ('cliente', 'bot', 'agente')),
  contenido TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'enviado' CHECK (estado IN ('enviado', 'entregado', 'leido')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Lista Blanca Bot
CREATE TABLE lista_blanca_bot (
  id_lista_blanca TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Solicitudes de Recarga
CREATE TABLE solicitudes_recarga (
  id_solicitud TEXT PRIMARY KEY,
  id_negocio TEXT REFERENCES negocios(id_negocio) NOT NULL,
  negocio_nombre TEXT,
  id_usuario_solicitante TEXT REFERENCES perfiles(id_usuario),
  nombre_solicitante TEXT,
  correo_solicitante TEXT,
  paquete_creditos INTEGER NOT NULL,
  monto_cop_usd TEXT NOT NULL,
  metodo_pago TEXT NOT NULL,
  comprobante_url TEXT NOT NULL,
  numero_referencia TEXT,
  notas_negocio TEXT,
  notas_admin TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX idx_citas_id_negocio ON citas(id_negocio);
CREATE INDEX idx_citas_fecha_inicio ON citas(fecha_hora_inicio);
CREATE INDEX idx_servicios_id_negocio ON servicios(id_negocio);
CREATE INDEX idx_clientes_id_negocio ON clientes(id_negocio);
CREATE INDEX idx_chats_id_negocio ON chats(id_negocio);
CREATE INDEX idx_mensajes_id_chat ON mensajes(id_chat);
CREATE INDEX idx_transacciones_id_negocio ON transacciones_credito(id_negocio);
CREATE INDEX idx_solicitudes_id_negocio ON solicitudes_recarga(id_negocio);
CREATE INDEX idx_perfiles_id_negocio ON perfiles(id_negocio);

-- ============================================================
-- Datos Semilla (v1) - Usuarios Demo
-- ============================================================
-- NOTA: Los usuarios deben crearse en Supabase Auth (auth.users)
-- y luego insertarse sus perfiles en la tabla perfiles.
-- Las contraseñas deben configurarse en Supabase Auth, no en la DB.
-- ============================================================

INSERT INTO negocios (id_negocio, nombre_comercial, logo_url, telefono_whatsapp, tipo_plan, saldo_creditos, estado_suscripcion, prompt_personalidad, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Barbería Deluxe VIP', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150', '+573001234567', 'pro', 250, 'ACTIVO', 'Eres un barbero experto y cordial. Ayudas a los clientes a elegir cortes modernos, arreglos de barba y a agendar citas rápidamente.', '2026-01-10T08:00:00.000Z', NOW()),
('22222222-2222-2222-2222-222222222222', 'Clínica Dental Spa', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150', '+573109876543', 'enterprise', 1200, 'ACTIVO', 'Eres el asistente médico virtual de Clínica Dental Spa. Tu tono es empático, profesional y enfocado en la salud oral de nuestros pacientes.', '2026-02-01T10:00:00.000Z', NOW()),
('33333333-3333-3333-3333-333333333333', 'Estética & Spa Bella', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150', '+573205558899', 'basico', 15, 'VENCIDO_GRACIA', 'Eres un asistente relajante y acogedor de Estética Bella. Respondes con calidez sobre masajes, limpiezas faciales y manicura.', '2026-03-15T12:00:00.000Z', NOW());

-- Los perfiles deben insertarse después de crear los usuarios en Supabase Auth.
-- Ejemplo:
-- INSERT INTO perfiles (id_usuario, id_negocio, nombre_completo, avatar_url, rol, es_superadmin) VALUES
-- ('<UUID_DEL_USUARIO_SUPABASE>', '11111111-1111-1111-1111-111111111111', 'Mateo Morales (Admin Barbería)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'admin', FALSE);
