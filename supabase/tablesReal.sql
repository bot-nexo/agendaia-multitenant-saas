-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.negocios (
  id_negocio uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre_comercial character varying NOT NULL,
  logo_url text,
  telefono_whatsapp character varying UNIQUE,
  tipo_plan character varying DEFAULT 'basico'::character varying,
  saldo_creditos integer NOT NULL DEFAULT 0 CHECK (saldo_creditos >= 0),
  estado_suscripcion character varying DEFAULT 'ACTIVO'::character varying CHECK (estado_suscripcion::text = ANY (ARRAY['ACTIVO'::character varying, 'VENCIDO_GRACIA'::character varying, 'SUSPENDIDO'::character varying]::text[])),
  prompt_personalidad text NOT NULL DEFAULT 'Eres un asistente amable y profesional que agenda citas.'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT negocios_pkey PRIMARY KEY (id_negocio)
);
CREATE TABLE public.perfiles (
  id_usuario uuid NOT NULL,
  id_negocio uuid,
  correo text NOT NULL,
  nombre_completo text,
  avatar_url text,
  rol USER-DEFINED NOT NULL DEFAULT 'personal'::rol_usuario,
  es_superadmin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT perfiles_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT perfiles_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES auth.users(id),
  CONSTRAINT perfiles_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio)
);
CREATE TABLE public.transacciones_credito (
  id_transaccion uuid NOT NULL DEFAULT gen_random_uuid(),
  id_negocio uuid NOT NULL,
  monto integer NOT NULL,
  tipo USER-DEFINED NOT NULL,
  descripcion text,
  id_referencia text,
  creado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transacciones_credito_pkey PRIMARY KEY (id_transaccion),
  CONSTRAINT transacciones_credito_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio),
  CONSTRAINT transacciones_credito_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES auth.users(id)
);
CREATE TABLE public.empleados (
  id_empleado uuid NOT NULL DEFAULT gen_random_uuid(),
  id_negocio uuid NOT NULL,
  nombre character varying NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT empleados_pkey PRIMARY KEY (id_empleado),
  CONSTRAINT empleados_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio)
);
CREATE TABLE public.servicios (
  id_servicio uuid NOT NULL DEFAULT gen_random_uuid(),
  id_negocio uuid NOT NULL,
  nombre character varying NOT NULL,
  duracion_minutos integer NOT NULL CHECK (duracion_minutos > 0),
  precio numeric NOT NULL CHECK (precio >= 0::numeric),
  id_empleado uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT servicios_pkey PRIMARY KEY (id_servicio),
  CONSTRAINT servicios_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio),
  CONSTRAINT servicios_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.empleados(id_empleado)
);
CREATE TABLE public.clientes (
  id_cliente uuid NOT NULL DEFAULT gen_random_uuid(),
  id_negocio uuid NOT NULL,
  nombre character varying NOT NULL,
  telefono character varying NOT NULL,
  ultima_visita date,
  total_visitas integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clientes_pkey PRIMARY KEY (id_cliente),
  CONSTRAINT clientes_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio)
);
CREATE TABLE public.citas (
  id_cita uuid NOT NULL DEFAULT gen_random_uuid(),
  id_negocio uuid NOT NULL,
  id_cliente uuid NOT NULL,
  id_empleado uuid,
  id_servicio uuid,
  fecha_hora_inicio timestamp with time zone NOT NULL,
  fecha_hora_fin timestamp with time zone NOT NULL,
  estado character varying DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['confirmado'::character varying, 'pendiente'::character varying, 'en_proceso'::character varying, 'completado'::character varying, 'cancelado'::character varying]::text[])),
  origen character varying DEFAULT 'whatsapp'::character varying CHECK (origen::text = ANY (ARRAY['whatsapp'::character varying, 'web'::character varying, 'app'::character varying]::text[])),
  precio numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT citas_pkey PRIMARY KEY (id_cita),
  CONSTRAINT citas_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio),
  CONSTRAINT citas_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente),
  CONSTRAINT citas_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.empleados(id_empleado),
  CONSTRAINT citas_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES public.servicios(id_servicio)
);
CREATE TABLE public.chats (
  id_chat uuid NOT NULL DEFAULT gen_random_uuid(),
  id_negocio uuid NOT NULL,
  id_cliente uuid NOT NULL,
  bot_activo boolean DEFAULT true,
  mensajes_no_leidos integer DEFAULT 0,
  ultimo_mensaje text,
  ultimo_mensaje_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id_chat),
  CONSTRAINT chats_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio),
  CONSTRAINT chats_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente)
);
CREATE TABLE public.mensajes (
  id_mensaje uuid NOT NULL DEFAULT gen_random_uuid(),
  id_negocio uuid NOT NULL,
  id_chat uuid NOT NULL,
  tipo_remitente character varying NOT NULL CHECK (tipo_remitente::text = ANY (ARRAY['cliente'::character varying, 'bot'::character varying, 'agente'::character varying]::text[])),
  contenido text NOT NULL,
  estado character varying DEFAULT 'enviado'::character varying CHECK (estado::text = ANY (ARRAY['enviado'::character varying, 'entregado'::character varying, 'leido'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mensajes_pkey PRIMARY KEY (id_mensaje),
  CONSTRAINT mensajes_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio),
  CONSTRAINT mensajes_id_chat_fkey FOREIGN KEY (id_chat) REFERENCES public.chats(id_chat)
);
CREATE TABLE public.lista_blanca_bot (
  id_lista_blanca uuid NOT NULL DEFAULT gen_random_uuid(),
  id_negocio uuid NOT NULL,
  nombre character varying NOT NULL,
  telefono character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lista_blanca_bot_pkey PRIMARY KEY (id_lista_blanca),
  CONSTRAINT lista_blanca_bot_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio)
);
CREATE TABLE public.solicitudes_recarga (
  id_solicitud text NOT NULL,
  id_negocio uuid NOT NULL,
  negocio_nombre text,
  id_usuario_solicitante uuid,
  nombre_solicitante text,
  correo_solicitante text,
  paquete_creditos integer NOT NULL,
  monto_cop_usd text NOT NULL,
  metodo_pago text NOT NULL,
  comprobante_url text NOT NULL,
  numero_referencia text,
  notas_negocio text,
  notas_admin text,
  estado text NOT NULL DEFAULT 'PENDIENTE'::text CHECK (estado = ANY (ARRAY['PENDIENTE'::text, 'APROBADO'::text, 'RECHAZADO'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT solicitudes_recarga_pkey PRIMARY KEY (id_solicitud),
  CONSTRAINT solicitudes_recarga_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio),
  CONSTRAINT solicitudes_recarga_id_usuario_solicitante_fkey FOREIGN KEY (id_usuario_solicitante) REFERENCES public.perfiles(id_usuario)
);
CREATE TABLE public.referencias_pago (
  id_referencia text NOT NULL,
  id_negocio uuid NOT NULL,
  referencia character varying NOT NULL,
  fecha_pago date NOT NULL,
  nombre_pagador character varying NOT NULL,
  cedula_pagador character varying NOT NULL,
  creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT referencias_pago_pkey PRIMARY KEY (id_referencia),
  CONSTRAINT referencias_pago_id_negocio_fkey1 FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio),
  CONSTRAINT referencias_pago_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocios(id_negocio)
);