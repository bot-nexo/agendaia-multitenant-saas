-- ==========================================
-- 1. EXTENSIONES Y TIPOS ENUM
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.estado_verificacion_enum AS ENUM (
    'pendiente',
    'en_revision',
    'aprobado',
    'rechazado',
    'abandonado'
);

CREATE TYPE public.estado_suscripcion_enum AS ENUM (
    'ACTIVO',
    'VENCIDO_GRACIA',
    'SUSPENDIDO'
);

CREATE TYPE public.rol_usuario AS ENUM (
    'superadmin',
    'admin',
    'personal'
);

CREATE TYPE public.tipo_trans_credito AS ENUM (
    'RECARGA_MANUAL',
    'BONUS',
    'CONSUMO_BOT',
    'SISTEMA',
    'REGISTRO_INICIAL'
);

CREATE TYPE public.estado_trans_credito AS ENUM (
    'PENDIENTE',
    'COMPLETADO',
    'RECHAZADO'
);

CREATE TYPE public.tipo_solicitud_enum AS ENUM (
    'ONBOARDING_INICIAL',
    'RECARGA_CREDITOS'
);

-- ==========================================
-- 2. TABLAS PRINCIPALES
-- ==========================================

-- Tabla: Negocios (Tenants)
CREATE TABLE public.negocios (
    id_negocio uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial text NOT NULL,
    logo_url text,
    telefono_whatsapp text UNIQUE,
    tipo_plan text NOT NULL DEFAULT 'basico',
    saldo_creditos integer NOT NULL DEFAULT 0 CHECK (saldo_creditos >= 0),
    estado_suscripcion public.estado_suscripcion_enum NOT NULL DEFAULT 'ACTIVO',
    estado_verificacion public.estado_verificacion_enum NOT NULL DEFAULT 'pendiente',
    prompt_personalidad text NOT NULL DEFAULT 'Eres un asistente amable y profesional que agenda citas.',
    motivo_rechazo text,
    aprobado_por uuid REFERENCES auth.users(id),
    fecha_aprobacion timestamp with time zone,
    fec_expiracion date,
    fec_ult_pago date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla: Perfiles (Asociados a auth.users de Supabase)
CREATE TABLE public.perfiles (
    id_usuario uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    id_negocio uuid REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    correo text NOT NULL,
    nombre_completo text,
    avatar_url text,
    rol public.rol_usuario NOT NULL DEFAULT 'personal',
    es_superadmin boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla: Referencias de Pago
CREATE TABLE public.referencias_pago (
    id_referencia uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    referencia text NOT NULL,
    fecha_pago date NOT NULL,
    nombre_pagador text NOT NULL,
    cedula_pagador text NOT NULL,
    canal_pago text DEFAULT 'Nequi / Bancolombia',
    url_referencia text,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: Solicitudes de Recarga / Registro
CREATE TABLE public.solicitudes_recarga (
    id_solicitud uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    id_usuario_solicitante uuid REFERENCES public.perfiles(id_usuario),
    tipo_solicitud public.tipo_solicitud_enum NOT NULL DEFAULT 'ONBOARDING_INICIAL',
    paquete_creditos integer NOT NULL CHECK (paquete_creditos >= 0),
    monto_monto_text text NOT NULL,
    metodo_pago text NOT NULL,
    comprobante_url text NOT NULL,
    hash_comprobante text UNIQUE, -- Evita subir el mismo comprobante dos veces
    numero_referencia text,
    notas_negocio text,
    notas_admin text,
    estado public.estado_verificacion_enum NOT NULL DEFAULT 'pendiente',
    atendido_por uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: Transacciones de Crédito
CREATE TABLE public.transacciones_credito (
    id_transaccion uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    monto integer NOT NULL,
    descripcion text,
    id_referencia uuid REFERENCES public.referencias_pago(id_referencia),
    creado_por uuid REFERENCES auth.users(id),
    tipo public.tipo_trans_credito NOT NULL DEFAULT 'RECARGA_MANUAL',
    estado public.estado_trans_credito NOT NULL DEFAULT 'PENDIENTE',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla: Empleados
CREATE TABLE public.empleados (
    id_empleado uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    nombre text NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: Servicios
CREATE TABLE public.servicios (
    id_servicio uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    id_empleado uuid REFERENCES public.empleados(id_empleado) ON DELETE SET NULL,
    nombre text NOT NULL,
    duracion_minutos integer NOT NULL CHECK (duracion_minutos > 0),
    precio numeric NOT NULL CHECK (precio >= 0),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: Clientes del Negocio
CREATE TABLE public.clientes (
    id_cliente uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    nombre text NOT NULL,
    telefono text NOT NULL,
    ultima_visita date,
    total_visitas integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla: Citas
CREATE TABLE public.citas (
    id_cita uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    id_cliente uuid NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    id_empleado uuid REFERENCES public.empleados(id_empleado) ON DELETE SET NULL,
    id_servicio uuid REFERENCES public.servicios(id_servicio) ON DELETE SET NULL,
    fecha_hora_inicio timestamp with time zone NOT NULL,
    fecha_hora_fin timestamp with time zone NOT NULL,
    estado text DEFAULT 'pendiente' CHECK (estado IN ('confirmado', 'pendiente', 'en_proceso', 'completado', 'cancelado')),
    origen text DEFAULT 'whatsapp' CHECK (origen IN ('whatsapp', 'web', 'app')),
    precio numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla: Chats
CREATE TABLE public.chats (
    id_chat uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    id_cliente uuid NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    bot_activo boolean DEFAULT true,
    mensajes_no_leidos integer DEFAULT 0,
    ultimo_mensaje text,
    ultimo_mensaje_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla: Mensajes
CREATE TABLE public.mensajes (
    id_mensaje uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    id_chat uuid NOT NULL REFERENCES public.chats(id_chat) ON DELETE CASCADE,
    tipo_remitente text NOT NULL CHECK (tipo_remitente IN ('cliente', 'bot', 'agente')),
    contenido text NOT NULL,
    estado text DEFAULT 'enviado' CHECK (estado IN ('enviado', 'entregado', 'leido')),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla: Lista Blanca Bot
CREATE TABLE public.lista_blanca_bot (
    id_lista_blanca uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    nombre text NOT NULL,
    telefono text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla: Auditoría de Aprobaciones
CREATE TABLE public.auditoria_verificaciones (
    id_auditoria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_negocio uuid NOT NULL REFERENCES public.negocios(id_negocio) ON DELETE CASCADE,
    id_solicitud uuid REFERENCES public.solicitudes_recarga(id_solicitud),
    id_admin uuid NOT NULL REFERENCES auth.users(id),
    accion text NOT NULL CHECK (accion IN ('APROBADO', 'RECHAZADO', 'SUSPENDIDO')),
    motivo text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ==========================================

-- Trigger: Crear automáticamente un registro en public.perfiles cuando se registra un usuario en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id_usuario, correo, nombre_completo, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nombre_completo',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función Auxiliar: Saber si un usuario es Superadmin
CREATE OR REPLACE FUNCTION public.es_superadmin(user_id uuid)
RETURNS boolean AS $$
  SELECT COALESCE((SELECT es_superadmin FROM public.perfiles WHERE id_usuario = user_id), false);
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- 4. RPC: APROBACIÓN ATÓMICA DE REGISTRO / PAGO (Anti Race-Conditions)
-- ==========================================

CREATE OR REPLACE FUNCTION public.aprobar_solicitud_registro(
    p_id_solicitud uuid,
    p_id_admin uuid,
    p_notas text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_solicitud public.solicitudes_recarga%ROWTYPE;
BEGIN
    -- Verificar si el ejecutor es Superadmin
    IF NOT public.es_superadmin(p_id_admin) THEN
        RAISE EXCEPTION 'Acceso denegado: Se requieren permisos de Superadmin.';
    END IF;

    -- Lock pesimista sobre la fila de la solicitud
    SELECT * INTO v_solicitud
    FROM public.solicitudes_recarga
    WHERE id_solicitud = p_id_solicitud
    FOR UPDATE;

    IF v_solicitud.id_solicitud IS NULL THEN
        RAISE EXCEPTION 'La solicitud especificada no existe.';
    END IF;

    IF v_solicitud.estado != 'pendiente' AND v_solicitud.estado != 'en_revision' THEN
        RAISE EXCEPTION 'La solicitud ya fue procesada anteriormente.';
    END IF;

    -- 1. Actualizar estado de la solicitud
    UPDATE public.solicitudes_recarga
    SET estado = 'aprobado',
        atendido_por = p_id_admin,
        notas_admin = p_notas,
        updated_at = now()
    WHERE id_solicitud = p_id_solicitud;

    -- 2. Activar el negocio y sumar créditos
    UPDATE public.negocios
    SET estado_verificacion = 'aprobado',
        saldo_creditos = saldo_creditos + v_solicitud.paquete_creditos,
        aprobado_por = p_id_admin,
        fecha_aprobacion = now(),
        updated_at = now()
    WHERE id_negocio = v_solicitud.id_negocio;

    -- 3. Registrar Transacción de Crédito
    INSERT INTO public.transacciones_credito (
        id_negocio, monto, descripcion, creado_por, tipo, estado
    ) VALUES (
        v_solicitud.id_negocio,
        v_solicitud.paquete_creditos,
        'Acreditación inicial / Recarga por aprobación de solicitud',
        p_id_admin,
        'RECARGA_MANUAL',
        'COMPLETADO'
    );

    -- 4. Audit Log
    INSERT INTO public.auditoria_verificaciones (
        id_negocio, id_solicitud, id_admin, accion, motivo
    ) VALUES (
        v_solicitud.id_negocio, p_id_solicitud, p_id_admin, 'APROBADO', p_notas
    );

    RETURN jsonb_build_object('success', true, 'message', 'Solicitud aprobada y workspace activado con éxito.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
-- ==========================================

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_recarga ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: negocios
CREATE POLICY "Superadmin acceso total a negocios" ON public.negocios
  FOR ALL USING (public.es_superadmin(auth.uid()));

CREATE POLICY "Usuarios ven únicamente su propio negocio" ON public.negocios
  FOR SELECT USING (
    id_negocio IN (SELECT id_negocio FROM public.perfiles WHERE id_usuario = auth.uid())
  );

-- POLÍTICAS: perfiles
CREATE POLICY "Superadmin acceso total a perfiles" ON public.perfiles
  FOR ALL USING (public.es_superadmin(auth.uid()));

CREATE POLICY "Usuarios leen perfiles de su propio negocio" ON public.perfiles
  FOR SELECT USING (
    id_negocio IN (SELECT id_negocio FROM public.perfiles WHERE id_usuario = auth.uid())
    OR id_usuario = auth.uid()
  );

CREATE POLICY "Usuarios editan su propio perfil" ON public.perfiles
  FOR UPDATE USING (id_usuario = auth.uid());

-- POLÍTICAS GENERALES DE MULTI-TENANCY (Clientes, Citas, Servicios, Empleados, Chats, Mensajes)
-- Aisladas por `id_negocio` y solo accesibles si el negocio está en estado 'aprobado'
CREATE POLICY "Tenant Aislamiento - Clientes" ON public.clientes
  FOR ALL USING (
    id_negocio IN (
      SELECT p.id_negocio FROM public.perfiles p
      JOIN public.negocios n ON n.id_negocio = p.id_negocio
      WHERE p.id_usuario = auth.uid() AND n.estado_verificacion = 'aprobado'
    ) OR public.es_superadmin(auth.uid())
  );

CREATE POLICY "Tenant Aislamiento - Citas" ON public.citas
  FOR ALL USING (
    id_negocio IN (
      SELECT p.id_negocio FROM public.perfiles p
      JOIN public.negocios n ON n.id_negocio = p.id_negocio
      WHERE p.id_usuario = auth.uid() AND n.estado_verificacion = 'aprobado'
    ) OR public.es_superadmin(auth.uid())
  );

CREATE POLICY "Tenant Aislamiento - Servicios" ON public.servicios
  FOR ALL USING (
    id_negocio IN (
      SELECT p.id_negocio FROM public.perfiles p
      JOIN public.negocios n ON n.id_negocio = p.id_negocio
      WHERE p.id_usuario = auth.uid() AND n.estado_verificacion = 'aprobado'
    ) OR public.es_superadmin(auth.uid())
  );

CREATE POLICY "Tenant Aislamiento - Empleados" ON public.empleados
  FOR ALL USING (
    id_negocio IN (
      SELECT p.id_negocio FROM public.perfiles p
      JOIN public.negocios n ON n.id_negocio = p.id_negocio
      WHERE p.id_usuario = auth.uid() AND n.estado_verificacion = 'aprobado'
    ) OR public.es_superadmin(auth.uid())
  );

-- POLÍTICAS: solicitudes_recarga
CREATE POLICY "Superadmin gestiona solicitudes" ON public.solicitudes_recarga
  FOR ALL USING (public.es_superadmin(auth.uid()));

CREATE POLICY "Negocio crea y ve sus propias solicitudes" ON public.solicitudes_recarga
  FOR ALL USING (
    id_negocio IN (SELECT id_negocio FROM public.perfiles WHERE id_usuario = auth.uid())
  );