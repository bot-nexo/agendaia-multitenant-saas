import { CreateReferenciaPagoInput, CreateTransaccionCreditos, ReferenciaPago } from '@/server/types';
import { supabase } from '../lib/supabase';

import {
  Negocio,
  Cita,
  Servicio,
  Empleado,
  Cliente,
  Chat,
  Mensaje,
  ListaBlancaBot,
  TransaccionCredito,
  SolicitudRecarga,
  DemoAccount
} from '../types';

const API_BASE = '/api/v1';

const getHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Ocurrió un error en la solicitud.');
  }
  return data.data;
}

export const api = {
  login: async (correo: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Error al iniciar sesión.');
    }

    const res = await fetch(`${API_BASE}/auth/me`, { headers: await getHeaders() });
    return handleResponse<{ token: string; usuario: any; negocio: Negocio | null }>(res);
  },

  registerTenant: async (data: {
    nombre_comercial: string;
    correo: string;
    password: string;
    tipo_plan?: string;
    telefono_whatsapp?: string;
    nombre_contacto?: string;
  }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ token: string; usuario: any; negocio: Negocio | null }>(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: await getHeaders() });
    return handleResponse<{ usuario: any; negocio: Negocio | null }>(res);
  },

  getDemoAccounts: async () => {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`, { headers: await getHeaders() });
    return handleResponse<DemoAccount[]>(res);
  },

  admin: {
    getNegocios: async () => {
      const res = await fetch(`${API_BASE}/admin/negocios`, { headers: await getHeaders() });
      return handleResponse<Negocio[]>(res);
    },

    createNegocio: async (body: any) => {
      const res = await fetch(`${API_BASE}/admin/negocios`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<{ negocio: Negocio; perfil: any }>(res);
    },

    updateSuscripcion: async (id_negocio: string, estado_suscripcion: string, tipo_plan: string) => {
      const res = await fetch(`${API_BASE}/admin/negocios/${id_negocio}/suscripcion`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ estado_suscripcion, tipo_plan }),
      });
      return handleResponse<Negocio>(res);
    },

    adjustCreditos: async (id_negocio: string, monto: number, tipo?: string, descripcion?: string) => {
      const res = await fetch(`${API_BASE}/admin/negocios/${id_negocio}/creditos`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ monto, tipo, descripcion }),
      });
      return handleResponse<{ negocio: Negocio; transaccion: TransaccionCredito }>(res);
    },

    getTransacciones: async () => {
      const res = await fetch(`${API_BASE}/admin/transacciones`, { headers: await getHeaders() });
      return handleResponse<TransaccionCredito[]>(res);
    },

    getAnalytics: async () => {
      const res = await fetch(`${API_BASE}/admin/analytics`, { headers: await getHeaders() });
      return handleResponse<any>(res);
    },

    getSolicitudesRecarga: async () => {
      const res = await fetch(`${API_BASE}/admin/solicitudes-recarga`, { headers: await getHeaders() });
      return handleResponse<SolicitudRecarga[]>(res);
    },
    // Pending verification API
    getNegociosPendientes: async () => {
      const res = await fetch(`${API_BASE}/pending/negocios-pendientes`, { headers: await getHeaders() });
      return handleResponse<Negocio[]>(res);
    },

    aprobarNegocio: async (id_negocio: string) => {
      const res = await fetch(`${API_BASE}/pending/negocios/${id_negocio}/aprobar`, {
        method: 'PATCH',
        headers: await getHeaders(),
      });
      return handleResponse<any>(res);
    },

    bloquearNegocio: async (id_negocio: string) => {
      const res = await fetch(`${API_BASE}/pending/negocios/${id_negocio}/bloquear`, {
        method: 'PATCH',
        headers: await getHeaders(),
      });
      return handleResponse<any>(res);
    },

    //Aprobar solicitud de recarga
    aprobarSolicitudRecarga: async (id_solicitud: string, notas_admin?: string) => {
      const res = await fetch(`${API_BASE}/admin/solicitudes-recarga/${id_solicitud}/aprobar`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ notas_admin }),
      });
      return handleResponse<{ solicitud: SolicitudRecarga; negocio: Negocio; transaccion: TransaccionCredito }>(res);
    },

    rechazarSolicitudRecarga: async (id_solicitud: string, notas_admin?: string) => {
      const res = await fetch(`${API_BASE}/admin/solicitudes-recarga/${id_solicitud}/rechazar`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ notas_admin }),
      });
      return handleResponse<SolicitudRecarga>(res);
    },
  },

  tenant: {
    getDashboardSummary: async () => {
      const res = await fetch(`${API_BASE}/tenant/dashboard-summary`, { headers: await getHeaders() });
      return handleResponse<any>(res);
    },

    getCitas: async () => {
      const res = await fetch(`${API_BASE}/tenant/citas`, { headers: await getHeaders() });
      return handleResponse<Cita[]>(res);
    },

    createCita: async (body: any) => {
      const res = await fetch(`${API_BASE}/tenant/citas`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<Cita>(res);
    },

    updateEstadoCita: async (id_cita: string, estado: string) => {
      const res = await fetch(`${API_BASE}/tenant/citas/${id_cita}/estado`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ estado }),
      });
      return handleResponse<Cita>(res);
    },

    deleteCita: async (id_cita: string) => {
      const res = await fetch(`${API_BASE}/tenant/citas/${id_cita}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      return handleResponse<any>(res);
    },

    getServicios: async () => {
      const res = await fetch(`${API_BASE}/tenant/servicios`, { headers: await getHeaders() });
      return handleResponse<Servicio[]>(res);
    },

    createServicio: async (body: any) => {
      const res = await fetch(`${API_BASE}/tenant/servicios`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<Servicio>(res);
    },

    deleteServicio: async (id_servicio: string) => {
      const res = await fetch(`${API_BASE}/tenant/servicios/${id_servicio}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      return handleResponse<any>(res);
    },

    getEmpleados: async () => {
      const res = await fetch(`${API_BASE}/tenant/empleados`, { headers: await getHeaders() });
      return handleResponse<Empleado[]>(res);
    },

    createEmpleado: async (body: any) => {
      const res = await fetch(`${API_BASE}/tenant/empleados`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<Empleado>(res);
    },

    deleteEmpleado: async (id_empleado: string) => {
      const res = await fetch(`${API_BASE}/tenant/empleados/${id_empleado}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      return handleResponse<any>(res);
    },

    getClientes: async () => {
      const res = await fetch(`${API_BASE}/tenant/clientes`, { headers: await getHeaders() });
      return handleResponse<Cliente[]>(res);
    },

    createCliente: async (body: any) => {
      const res = await fetch(`${API_BASE}/tenant/clientes`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<Cliente>(res);
    },

    getChats: async () => {
      const res = await fetch(`${API_BASE}/tenant/chats`, { headers: await getHeaders() });
      return handleResponse<Chat[]>(res);
    },

    getMensajes: async (id_chat: string) => {
      const res = await fetch(`${API_BASE}/tenant/chats/${id_chat}/mensajes`, { headers: await getHeaders() });
      return handleResponse<Mensaje[]>(res);
    },

    toggleBot: async (id_chat: string, bot_activo: boolean) => {
      const res = await fetch(`${API_BASE}/tenant/chats/${id_chat}/toggle-bot`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ bot_activo }),
      });
      return handleResponse<Chat>(res);
    },

    sendMensajeAgent: async (id_chat: string, contenido: string) => {
      const res = await fetch(`${API_BASE}/tenant/chats/${id_chat}/mensajes`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ contenido, tipo_remitente: 'agente' }),
      });
      return handleResponse<Mensaje>(res);
    },

    triggerAiBotReply: async (id_chat: string, prompt_usuario?: string) => {
      const res = await fetch(`${API_BASE}/tenant/chats/${id_chat}/ai-reply`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ prompt_usuario }),
      });
      return handleResponse<{ mensaje: Mensaje; saldo_creditos: number }>(res);
    },

    getConfiguracion: async () => {
      const res = await fetch(`${API_BASE}/tenant/configuracion`, { headers: await getHeaders() });
      return handleResponse<{ negocio: Negocio; listaBlanca: ListaBlancaBot[] }>(res);
    },

    updateConfiguracion: async (body: any) => {
      const res = await fetch(`${API_BASE}/tenant/configuracion`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<Negocio>(res);
    },

    createListaBlancaItem: async (nombre: string, telefono: string) => {
      const res = await fetch(`${API_BASE}/tenant/lista-blanca`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ nombre, telefono }),
      });
      return handleResponse<ListaBlancaBot>(res);
    },

    deleteListaBlancaItem: async (id_lista_blanca: string) => {
      const res = await fetch(`${API_BASE}/tenant/lista-blanca/${id_lista_blanca}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      return handleResponse<any>(res);
    },

    getSolicitudesRecarga: async () => {
      const res = await fetch(`${API_BASE}/tenant/solicitudes-recarga`, { headers: await getHeaders() });
      return handleResponse<SolicitudRecarga[]>(res);
    },

    createSolicitudRecarga: async (body: {
      paquete_creditos: number;
      monto_cop_usd: string;
      metodo_pago: string;
      comprobante_url: string;
      numero_referencia?: string;
      notas_negocio?: string;
    }) => {
      const res = await fetch(`${API_BASE}/tenant/solicitudes-recarga`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<SolicitudRecarga>(res);
    },
  },


  crearReferencia: async (payload: CreateReferenciaPagoInput): Promise<ReferenciaPago> => {
    const { data, error } = await supabase
      .from('referencias_pago')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al registrar la referencia de pago: ${error.message}`);
    }

    return data;
  },

  obtenerTransaccionesPorNegocio: async (idNegocio: string): Promise<ReferenciaPago[]> => {
    const { data, error } = await supabase
      .from('transacciones_credito')
      .select('*')
      .eq('id_negocio', idNegocio)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al consultar referencias: ${error.message}`);
    }

    return data || [];
  },

  buscarPorReferencia: async (referencia: string): Promise<ReferenciaPago | null> => {
    const { data, error } = await supabase
      .from('referencias_pago')
      .select('*')
      .eq('referencia', referencia)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar la referencia: ${error.message}`);
    }

    return data;
  },

  crearTransaccionCreditos: async (payload: CreateTransaccionCreditos): Promise<TransaccionCredito> => {
    const { data, error } = await supabase
      .from('transacciones_credito')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al registrar la transaccion de creditos: ${error.message}`);
    }

    return data;
  }
};
