import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '../lib/supabase';
import {
  ApiResponse,
  Cita,
  Servicio,
  Cliente,
  Chat,
  Mensaje,
  ListaBlancaBot,
  TransaccionCredito,
  SolicitudRecarga
} from '../types';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export const getTenantDashboardSummary = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;

    const { data: negocio, error: negocioError } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', id_negocio)
      .single();

    if (negocioError || !negocio) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const { data: citasNegocio } = await supabaseAdmin
      .from('citas')
      .select('*')
      .eq('id_negocio', id_negocio);

    const citasHoy = (citasNegocio || []).filter((c) => c.fecha_hora_inicio.startsWith(todayStr));
    const citasPendientes = (citasNegocio || []).filter((c) => c.estado === 'pendiente').length;
    const citasConfirmadas = (citasNegocio || []).filter((c) => c.estado === 'confirmado').length;

    const { count: totalClientes } = await supabaseAdmin
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('id_negocio', id_negocio);

    const { count: totalServicios } = await supabaseAdmin
      .from('servicios')
      .select('*', { count: 'exact', head: true })
      .eq('id_negocio', id_negocio);

    const totalEmpleados = 0;

    const { count: totalChats } = await supabaseAdmin
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('id_negocio', id_negocio);

    const citasHoyList = await Promise.all(
      citasHoy.map(async (c) => {
        const { data: cliente } = await supabaseAdmin
          .from('clientes')
          .select('nombre, telefono')
          .eq('id_cliente', c.id_cliente)
          .single();

        const { data: servicio } = await supabaseAdmin
          .from('servicios')
          .select('nombre')
          .eq('id_servicio', c.id_servicio || '')
          .maybeSingle();

        return {
          ...c,
          cliente_nombre: cliente?.nombre || 'Cliente sin nombre',
          cliente_telefono: cliente?.telefono || '',
          servicio_nombre: servicio?.nombre || 'Servicio general',
          empleado_nombre: 'Propietario',
        };
      })
    );

    return res.json({
      success: true,
      data: {
        negocio,
        citasHoyCount: citasHoy.length,
        citasPendientesCount: citasPendientes,
        citasConfirmadasCount: citasConfirmadas,
        totalClientes: totalClientes || 0,
        totalServicios: totalServicios || 0,
        totalEmpleados,
        totalChats: totalChats || 0,
        citasHoyList,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getCitas = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;

    const { data: citas, error } = await supabaseAdmin
      .from('citas')
      .select('*')
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const enrichedCitas = await Promise.all(
      (citas || []).map(async (c) => {
        const { data: cliente } = await supabaseAdmin
          .from('clientes')
          .select('nombre, telefono')
          .eq('id_cliente', c.id_cliente)
          .single();

        const { data: servicio } = await supabaseAdmin
          .from('servicios')
          .select('nombre')
          .eq('id_servicio', c.id_servicio || '')
          .maybeSingle();

        return {
          ...c,
          cliente_nombre: cliente?.nombre || 'Cliente no encontrado',
          cliente_telefono: cliente?.telefono || '',
          servicio_nombre: servicio?.nombre || 'Servicio sin asignar',
          empleado_nombre: 'Propietario',
        };
      })
    );

    enrichedCitas.sort((a, b) => new Date(b.fecha_hora_inicio).getTime() - new Date(a.fecha_hora_inicio).getTime());

    return res.json({ success: true, data: enrichedCitas });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createCita = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_cliente, id_servicio, fecha_hora_inicio, origen, estado } = req.body;

    if (!id_cliente || !fecha_hora_inicio) {
      return res.status(400).json({ success: false, error: 'Cliente y fecha/hora de inicio son requeridos.' });
    }

    const { data: servicio } = await supabaseAdmin
      .from('servicios')
      .select('duracion_minutos, precio')
      .eq('id_servicio', id_servicio || '')
      .eq('id_negocio', id_negocio)
      .maybeSingle();

    const duracion = servicio ? servicio.duracion_minutos : 30;
    const precio = servicio ? servicio.precio : 0;

    const startDate = new Date(fecha_hora_inicio);
    const endDate = new Date(startDate.getTime() + duracion * 60000);

    const nuevaCita: Cita = {
      id_cita: 'cita-' + Date.now(),
      id_negocio,
      id_cliente,
      id_servicio: id_servicio || null,
      id_empleado: null,
      fecha_hora_inicio: startDate.toISOString(),
      fecha_hora_fin: endDate.toISOString(),
      estado: estado || 'confirmado',
      origen: origen || 'web',
      precio,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('citas').insert(nuevaCita);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { data: cliente } = await supabaseAdmin
      .from('clientes')
      .select('total_visitas, ultima_visita')
      .eq('id_cliente', id_cliente)
      .eq('id_negocio', id_negocio)
      .single();

    if (cliente) {
      await supabaseAdmin
        .from('clientes')
        .update({
          total_visitas: (cliente.total_visitas || 0) + 1,
          ultima_visita: startDate.toISOString().split('T')[0],
        })
        .eq('id_cliente', id_cliente)
        .eq('id_negocio', id_negocio);
    }

    return res.status(201).json({
      success: true,
      data: nuevaCita,
      message: 'Cita agendada exitosamente.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateEstadoCita = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_cita } = req.params;
    const { estado } = req.body;

    const { data: cita, error: fetchError } = await supabaseAdmin
      .from('citas')
      .select('*')
      .eq('id_cita', id_cita)
      .eq('id_negocio', id_negocio)
      .single();

    if (fetchError || !cita) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada o sin acceso.' });
    }

    const { error } = await supabaseAdmin
      .from('citas')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id_cita', id_cita);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { data: updatedCita } = await supabaseAdmin
      .from('citas')
      .select('*')
      .eq('id_cita', id_cita)
      .single();

    return res.json({ success: true, data: updatedCita, message: `Cita actualizada a estado '${estado}'.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteCita = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_cita } = req.params;

    const { error } = await supabaseAdmin
      .from('citas')
      .delete()
      .eq('id_cita', id_cita)
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'Cita eliminada correctamente.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getServicios = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;

    const { data: servicios, error } = await supabaseAdmin
      .from('servicios')
      .select('*')
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const enriched = (servicios || []).map((s) => ({
      ...s,
      empleado_nombre: 'Propietario',
    }));

    return res.json({ success: true, data: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createServicio = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { nombre, duracion_minutos, precio, id_empleado } = req.body;

    if (!nombre || !duracion_minutos || precio === undefined) {
      return res.status(400).json({ success: false, error: 'Nombre, duración y precio son obligatorios.' });
    }

    const nuevoServicio: Servicio = {
      id_servicio: 'srv-' + Date.now(),
      id_negocio,
      nombre,
      duracion_minutos: Number(duracion_minutos),
      precio: Number(precio),
      id_empleado: id_empleado || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('servicios').insert(nuevoServicio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, data: nuevoServicio, message: 'Servicio creado correctamente.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteServicio = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_servicio } = req.params;

    const { error } = await supabaseAdmin
      .from('servicios')
      .delete()
      .eq('id_servicio', id_servicio)
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'Servicio eliminado correctamente.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getEmpleados = (req: Request, res: Response<ApiResponse>) => {
  return res.json({ success: true, data: [], message: 'Módulo de empleados desactivado en V1.' });
};

export const createEmpleado = (req: Request, res: Response<ApiResponse>) => {
  return res.status(403).json({
    success: false,
    error: 'La creación de colaboradores/empleados está desactivada en la versión v1 de la plataforma.',
  });
};

export const deleteEmpleado = (req: Request, res: Response<ApiResponse>) => {
  return res.status(403).json({
    success: false,
    error: 'La eliminación de colaboradores/empleados está desactivada en la versión v1 de la plataforma.',
  });
};

export const getClientes = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;

    const { data: clientes, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: clientes || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createCliente = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { nombre, telefono } = req.body;

    if (!nombre || !telefono) {
      return res.status(400).json({ success: false, error: 'Nombre y teléfono son obligatorios.' });
    }

    const now = new Date().toISOString();
    const nuevoCliente: Cliente = {
      id_cliente: 'cli-' + Date.now(),
      id_negocio,
      nombre,
      telefono,
      total_visitas: 0,
      ultima_visita: null,
      created_at: now,
      updated_at: now,
    };

    const { error: clienteError } = await supabaseAdmin.from('clientes').insert(nuevoCliente);

    if (clienteError) {
      return res.status(500).json({ success: false, error: clienteError.message });
    }

    const nuevoChat: Chat = {
      id_chat: 'chat-' + Date.now(),
      id_negocio,
      id_cliente: nuevoCliente.id_cliente,
      bot_activo: true,
      mensajes_no_leidos: 0,
      ultimo_mensaje: 'Chat iniciado.',
      ultimo_mensaje_at: now,
      created_at: now,
    };

    const { error: chatError } = await supabaseAdmin.from('chats').insert(nuevoChat);

    if (chatError) {
      return res.status(500).json({ success: false, error: chatError.message });
    }

    return res.status(201).json({ success: true, data: nuevoCliente, message: 'Cliente agregado al directorio.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getChats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;

    const { data: chats, error } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const enrichedChats = await Promise.all(
      (chats || []).map(async (ch) => {
        const { data: cliente } = await supabaseAdmin
          .from('clientes')
          .select('nombre, telefono')
          .eq('id_cliente', ch.id_cliente)
          .single();

        return {
          ...ch,
          cliente_nombre: cliente?.nombre || 'Cliente sin nombre',
          cliente_telefono: cliente?.telefono || '',
        };
      })
    );

    enrichedChats.sort((a, b) => new Date(b.ultimo_mensaje_at).getTime() - new Date(a.ultimo_mensaje_at).getTime());

    return res.json({ success: true, data: enrichedChats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getMensajesChat = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_chat } = req.params;

    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id_chat', id_chat)
      .eq('id_negocio', id_negocio)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ success: false, error: 'Chat no encontrado.' });
    }

    await supabaseAdmin
      .from('chats')
      .update({ mensajes_no_leidos: 0 })
      .eq('id_chat', id_chat);

    const { data: mensajes, error } = await supabaseAdmin
      .from('mensajes')
      .select('*')
      .eq('id_chat', id_chat)
      .eq('id_negocio', id_negocio)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: mensajes || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleBotChat = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_chat } = req.params;
    const { bot_activo } = req.body;

    const { data: chat, error: fetchError } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id_chat', id_chat)
      .eq('id_negocio', id_negocio)
      .single();

    if (fetchError || !chat) {
      return res.status(404).json({ success: false, error: 'Chat no encontrado.' });
    }

    const newBotState = bot_activo !== undefined ? Boolean(bot_activo) : !chat.bot_activo;

    const { error } = await supabaseAdmin
      .from('chats')
      .update({ bot_activo: newBotState })
      .eq('id_chat', id_chat);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { data: updatedChat } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id_chat', id_chat)
      .single();

    return res.json({
      success: true,
      data: updatedChat,
      message: updatedChat?.bot_activo ? 'Bot de IA activado para este chat.' : 'Bot de IA pausado. Ahora en atención humana.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const sendMensajeAgent = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_chat } = req.params;
    const { contenido, tipo_remitente } = req.body;

    if (!contenido) {
      return res.status(400).json({ success: false, error: 'El contenido del mensaje es requerido.' });
    }

    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id_chat', id_chat)
      .eq('id_negocio', id_negocio)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ success: false, error: 'Chat no encontrado.' });
    }

    const senderType = tipo_remitente || 'agente';
    const nuevoMensaje: Mensaje = {
      id_mensaje: 'msg-' + Date.now(),
      id_negocio,
      id_chat,
      tipo_remitente: senderType,
      contenido,
      estado: 'enviado',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('mensajes').insert(nuevoMensaje);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    await supabaseAdmin
      .from('chats')
      .update({
        ultimo_mensaje: contenido,
        ultimo_mensaje_at: nuevoMensaje.created_at,
      })
      .eq('id_chat', id_chat);

    return res.status(201).json({ success: true, data: nuevoMensaje });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const triggerAiBotReply = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_chat } = req.params;
    const { prompt_usuario } = req.body;

    const { data: negocio, error: negocioError } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', id_negocio)
      .single();

    if (negocioError || !negocio) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado.' });
    }

    if (negocio.estado_suscripcion === 'SUSPENDIDO') {
      return res.status(403).json({
        success: false,
        error: 'Suscripción suspendida. El bot de IA no puede responder hasta reactivar el servicio.',
      });
    }

    if (negocio.saldo_creditos <= 0) {
      return res.status(402).json({
        success: false,
        error: 'Saldo de créditos insuficiente (0 créditos). Por favor realice una recarga.',
      });
    }

    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id_chat', id_chat)
      .eq('id_negocio', id_negocio)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ success: false, error: 'Chat no encontrado.' });
    }

    const { data: cliente } = await supabaseAdmin
      .from('clientes')
      .select('nombre, telefono')
      .eq('id_cliente', chat.id_cliente)
      .single();

    const { data: servicios } = await supabaseAdmin
      .from('servicios')
      .select('*')
      .eq('id_negocio', id_negocio);

    const empleados: any[] = [];

    if (prompt_usuario) {
      const msgUsuario: Mensaje = {
        id_mensaje: 'msg-' + Date.now(),
        id_negocio,
        id_chat,
        tipo_remitente: 'cliente',
        contenido: prompt_usuario,
        estado: 'leido',
        created_at: new Date().toISOString(),
      };
      await supabaseAdmin.from('mensajes').insert(msgUsuario);
    }

    const { data: historialMensajes } = await supabaseAdmin
      .from('mensajes')
      .select('*')
      .eq('id_chat', id_chat)
      .order('created_at', { ascending: true });

    const historial = (historialMensajes || [])
      .slice(-6)
      .map((m) => `${m.tipo_remitente.toUpperCase()}: ${m.contenido}`)
      .join('\n');

    const systemPrompt = `
Contexto de Negocio: "${negocio.nombre_comercial}"
Personalidad y Prompt Configurado: "${negocio.prompt_personalidad}"
Cliente: "${cliente?.nombre || 'Cliente WhatsApp'}" (${cliente?.telefono || 'N/A'})

Servicios Disponibles:
${(servicios || []).map((s) => `- ${s.nombre} ($${s.precio}, ${s.duracion_minutos} min)`).join('\n')}

Atención: El negocio es atendido directamente de manera personalizada por su propietario (dueño/único profesional).

Instrucción de Respuesta: Responde en español como el Bot oficial de WhatsApp de ${negocio.nombre_comercial}. Sé breve, muy servicial, directo y amable (máximo 3 párrafos cortos). Si el cliente solicita agendar, ofrécele los servicios o confirma disponibilidad.

Historial Reciente del Chat:
${historial}
`;

    let respuestaBotText = '';

    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const aiRes = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt_usuario || 'Hola, ¿qué servicios tienen disponible?',
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });
        respuestaBotText = aiRes.text || `¡Hola! Gracias por escribir a ${negocio.nombre_comercial}. ¿En qué te puedo ayudar hoy?`;
      } catch (geminiError: any) {
        console.error('Error calling Gemini API:', geminiError);
        respuestaBotText = `¡Hola! Gracias por comunicarte con ${negocio.nombre_comercial}. ¿Te gustaría agendar una cita para nuestros servicios de atención?`;
      }
    } else {
      respuestaBotText = `[Respuesta Automática Bot ${negocio.nombre_comercial}]: Hola ${cliente?.nombre || ''}, con gusto te ayudamos a agendar tu cita.`;
    }

    const now = new Date().toISOString();
    const msgBot: Mensaje = {
      id_mensaje: 'msg-' + (Date.now() + 1),
      id_negocio,
      id_chat,
      tipo_remitente: 'bot',
      contenido: respuestaBotText,
      estado: 'entregado',
      created_at: now,
    };

    await supabaseAdmin.from('mensajes').insert(msgBot);

    await supabaseAdmin
      .from('chats')
      .update({
        ultimo_mensaje: respuestaBotText,
        ultimo_mensaje_at: now,
      })
      .eq('id_chat', id_chat);

    const newSaldo = negocio.saldo_creditos - 1;
    await supabaseAdmin
      .from('negocios')
      .update({ saldo_creditos: newSaldo })
      .eq('id_negocio', id_negocio);

    const transaccion: TransaccionCredito = {
      id_transaccion: 'tc-' + Date.now(),
      id_negocio,
      monto: -1,
      tipo: 'CONSUMO_BOT',
      descripcion: `Respuesta automatizada bot WhatsApp para ${cliente?.nombre || 'cliente'}`,
      id_referencia: `BOT-MSG-${msgBot.id_mensaje}`,
      creado_por: null,
      created_at: new Date().toISOString(),
    };

    await supabaseAdmin.from('transacciones_credito').insert(transaccion);

    return res.json({
      success: true,
      data: {
        mensaje: msgBot,
        saldo_creditos: newSaldo,
      },
      message: 'Respuesta generada por el Bot de IA y 1 crédito consumido.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getBusinessConfig = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;

    const { data: negocio } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', id_negocio)
      .single();

    const { data: listaBlanca } = await supabaseAdmin
      .from('lista_blanca_bot')
      .select('*')
      .eq('id_negocio', id_negocio);

    return res.json({
      success: true,
      data: {
        negocio,
        listaBlanca: listaBlanca || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateBusinessConfig = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { prompt_personalidad, telefono_whatsapp, nombre_comercial, logo_url } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (prompt_personalidad) updates.prompt_personalidad = prompt_personalidad;
    if (telefono_whatsapp) updates.telefono_whatsapp = telefono_whatsapp;
    if (nombre_comercial) updates.nombre_comercial = nombre_comercial;
    if (logo_url !== undefined) updates.logo_url = logo_url;

    const { error } = await supabaseAdmin
      .from('negocios')
      .update(updates)
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { data: negocio } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', id_negocio)
      .single();

    return res.json({ success: true, data: negocio, message: 'Configuración guardada correctamente.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createListaBlancaItem = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { nombre, telefono } = req.body;

    if (!nombre || !telefono) {
      return res.status(400).json({ success: false, error: 'Nombre y teléfono son obligatorios.' });
    }

    const nuevoItem: ListaBlancaBot = {
      id_lista_blanca: 'lb-' + Date.now(),
      id_negocio,
      nombre,
      telefono,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('lista_blanca_bot').insert(nuevoItem);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, data: nuevoItem, message: 'Contacto agregado a la Lista Blanca.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteListaBlancaItem = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { id_lista_blanca } = req.params;

    const { error } = await supabaseAdmin
      .from('lista_blanca_bot')
      .delete()
      .eq('id_lista_blanca', id_lista_blanca)
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'Contacto eliminado de la lista blanca.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getSolicitudesRecargaTenant = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;

    const { data: solicitudes, error } = await supabaseAdmin
      .from('solicitudes_recarga')
      .select('*')
      .eq('id_negocio', id_negocio)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: solicitudes || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createSolicitudRecargaTenant = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const id_negocio = req.user!.id_negocio!;
    const { paquete_creditos, monto_cop_usd, metodo_pago, comprobante_url, numero_referencia, notas_negocio } = req.body;

    if (!paquete_creditos || !monto_cop_usd || !comprobante_url) {
      return res.status(400).json({
        success: false,
        error: 'El paquete de créditos, monto y la imagen del comprobante de pago son obligatorios.',
      });
    }

    const { data: negocio } = await supabaseAdmin
      .from('negocios')
      .select('nombre_comercial')
      .eq('id_negocio', id_negocio)
      .single();

    const now = new Date().toISOString();

    const nuevaSolicitud: SolicitudRecarga = {
      id_solicitud: 'sol-' + Date.now(),
      id_negocio,
      negocio_nombre: negocio?.nombre_comercial || 'Negocio',
      id_usuario_solicitante: req.user!.id_usuario,
      nombre_solicitante: req.user!.nombre_completo,
      correo_solicitante: req.user!.correo,
      paquete_creditos: Number(paquete_creditos),
      monto_cop_usd: String(monto_cop_usd),
      metodo_pago: metodo_pago || 'Transferencia',
      comprobante_url,
      numero_referencia: numero_referencia || null,
      notas_negocio: notas_negocio || null,
      estado: 'PENDIENTE',
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabaseAdmin.from('solicitudes_recarga').insert(nuevaSolicitud);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      data: nuevaSolicitud,
      message: 'Solicitud de recarga enviada al SuperAdmin con éxito. Se verificarán tus créditos en breve.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
