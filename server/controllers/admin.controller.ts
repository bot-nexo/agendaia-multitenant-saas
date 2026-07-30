import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { ApiResponse, Negocio, TransaccionCredito, Perfil, SolicitudRecarga } from '../types';

export const getAllNegocios = async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: negocios, error } = await supabaseAdmin
      .from('negocios')
      .select('*');

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const data = await Promise.all(
      (negocios || []).map(async (n) => {
        const { count: total_citas } = await supabaseAdmin
          .from('citas')
          .select('*', { count: 'exact', head: true })
          .eq('id_negocio', n.id_negocio);

        const { count: total_chats } = await supabaseAdmin
          .from('chats')
          .select('*', { count: 'exact', head: true })
          .eq('id_negocio', n.id_negocio);

        const { count: total_clientes } = await supabaseAdmin
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('id_negocio', n.id_negocio);

        const { data: perfil } = await supabaseAdmin
          .from('perfiles')
          .select('correo, nombre_completo')
          .eq('id_negocio', n.id_negocio)
          .maybeSingle();

        return {
          ...n,
          total_citas: total_citas || 0,
          total_chats: total_chats || 0,
          total_clientes: total_clientes || 0,
          admin_correo: perfil?.correo || 'Sin asignar',
          admin_nombre: perfil?.nombre_completo || 'Sin asignar',
        };
      })
    );

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createNegocio = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { nombre_comercial, telefono_whatsapp, tipo_plan, correo_admin, nombre_admin, saldo_inicial, prompt_personalidad } = req.body;

    if (!nombre_comercial || !telefono_whatsapp || !correo_admin) {
      return res.status(400).json({
        success: false,
        error: 'Nombre comercial, teléfono WhatsApp y correo del administrador son obligatorios.',
      });
    }

    const { data: existingNegocio } = await supabaseAdmin
      .from('negocios')
      .select('id_negocio')
      .eq('telefono_whatsapp', telefono_whatsapp)
      .maybeSingle();

    if (existingNegocio) {
      return res.status(400).json({
        success: false,
        error: 'El número de WhatsApp ya se encuentra registrado por otro negocio.',
      });
    }

    const now = new Date().toISOString();
    const newNegocioId = 'neg-' + Date.now();

    const nuevoNegocio: Negocio = {
      id_negocio: newNegocioId,
      nombre_comercial,
      logo_url: req.body.logo_url || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150',
      telefono_whatsapp,
      tipo_plan: tipo_plan || 'basico',
      saldo_creditos: Number(saldo_inicial) || 100,
      estado_suscripcion: 'ACTIVO',
      prompt_personalidad: prompt_personalidad || 'Eres un asistente cordial y eficiente que agenda citas para nuestro negocio.',
      created_at: now,
      updated_at: now,
    };

    const { error: negocioError } = await supabaseAdmin.from('negocios').insert(nuevoNegocio);

    if (negocioError) {
      return res.status(500).json({ success: false, error: negocioError.message });
    }

    const nuevoPerfil: Perfil = {
      id_usuario: 'usr-' + Date.now(),
      id_negocio: newNegocioId,
      correo: correo_admin,
      nombre_completo: nombre_admin || `Admin ${nombre_comercial}`,
      avatar_url: null,
      rol: 'admin',
      es_superadmin: false,
      created_at: now,
      updated_at: now,
    };

    const { error: perfilError } = await supabaseAdmin.from('perfiles').insert(nuevoPerfil);

    if (perfilError) {
      return res.status(500).json({ success: false, error: perfilError.message });
    }

    const nuevaTransaccion: TransaccionCredito = {
      id_transaccion: 'tc-' + Date.now(),
      id_negocio: newNegocioId,
      monto: nuevoNegocio.saldo_creditos,
      tipo: 'RECARGA_MANUAL',
      descripcion: 'Asignación inicial de créditos por creación de cuenta',
      id_referencia: 'INIT-CREATION',
      creado_por: req.user?.id_usuario || null,
      created_at: now,
    };

    await supabaseAdmin.from('transacciones_credito').insert(nuevaTransaccion);

    return res.status(201).json({
      success: true,
      data: { negocio: nuevoNegocio, perfil: nuevoPerfil },
      message: 'Negocio y usuario administrador creados exitosamente.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateNegocioSuscripcion = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id_negocio } = req.params;
    const { estado_suscripcion, tipo_plan } = req.body;

    const { data: negocio, error: fetchError } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', id_negocio)
      .single();

    if (fetchError || !negocio) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado.' });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (estado_suscripcion) updates.estado_suscripcion = estado_suscripcion;
    if (tipo_plan) updates.tipo_plan = tipo_plan;

    const { error } = await supabaseAdmin
      .from('negocios')
      .update(updates)
      .eq('id_negocio', id_negocio);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { data: updatedNegocio } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', id_negocio)
      .single();

    return res.json({
      success: true,
      data: updatedNegocio,
      message: 'Estado de suscripción actualizado correctamente.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const adjustCreditosNegocio = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id_negocio } = req.params;
    const { monto, tipo, descripcion } = req.body;

    const montoNum = Number(monto);
    if (isNaN(montoNum) || montoNum === 0) {
      return res.status(400).json({ success: false, error: 'Monto inválido. Debe ser diferente de 0.' });
    }

    const { data: negocio, error: fetchError } = await supabaseAdmin
      .from('negocios')
      .select('saldo_creditos, nombre_comercial')
      .eq('id_negocio', id_negocio)
      .single();

    if (fetchError || !negocio) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado.' });
    }

    const nuevoSaldo = negocio.saldo_creditos + montoNum;
    if (nuevoSaldo < 0) {
      return res.status(400).json({ success: false, error: 'El saldo resultante no puede ser negativo.' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('negocios')
      .update({ saldo_creditos: nuevoSaldo, updated_at: new Date().toISOString() })
      .eq('id_negocio', id_negocio);

    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }

    const transaccion: TransaccionCredito = {
      id_transaccion: 'tc-' + Date.now(),
      id_negocio,
      monto: montoNum,
      tipo: tipo || 'RECARGA_MANUAL',
      descripcion: descripcion || (montoNum > 0 ? 'Recarga manual de créditos' : 'Ajuste de créditos'),
      id_referencia: 'MANUAL-' + Date.now(),
      creado_por: req.user?.id_usuario || null,
      created_at: new Date().toISOString(),
    };

    await supabaseAdmin.from('transacciones_credito').insert(transaccion);

    const { data: updatedNegocio } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', id_negocio)
      .single();

    return res.json({
      success: true,
      data: { negocio: updatedNegocio, transaccion },
      message: `Saldo actualizado. Nuevo saldo: ${nuevoSaldo} créditos.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getTransaccionesCredito = async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: transacciones, error } = await supabaseAdmin
      .from('transacciones_credito')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const data = await Promise.all(
      (transacciones || []).map(async (t) => {
        const { data: negocio } = await supabaseAdmin
          .from('negocios')
          .select('nombre_comercial')
          .eq('id_negocio', t.id_negocio)
          .maybeSingle();

        return {
          ...t,
          nombre_negocio: negocio?.nombre_comercial || 'Negocio desconocido',
        };
      })
    );

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getGlobalAnalytics = async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { count: totalNegocios } = await supabaseAdmin
      .from('negocios')
      .select('*', { count: 'exact', head: true });

    const { count: negociosActivos } = await supabaseAdmin
      .from('negocios')
      .select('*', { count: 'exact', head: true })
      .eq('estado_suscripcion', 'ACTIVO');

    const { data: negocios } = await supabaseAdmin.from('negocios').select('saldo_creditos');
    const totalCreditosCirculacion = (negocios || []).reduce((acc, n) => acc + (n.saldo_creditos || 0), 0);

    const { count: totalCitasAgendadas } = await supabaseAdmin
      .from('citas')
      .select('*', { count: 'exact', head: true });

    const { count: totalChatsBot } = await supabaseAdmin
      .from('chats')
      .select('*', { count: 'exact', head: true });

    const { count: totalMensajesBot } = await supabaseAdmin
      .from('mensajes')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_remitente', 'bot');

    const { data: allNegocios } = await supabaseAdmin.from('negocios').select('tipo_plan');
    const planesCount = {
      basico: (allNegocios || []).filter((n) => n.tipo_plan === 'basico').length,
      pro: (allNegocios || []).filter((n) => n.tipo_plan === 'pro').length,
      enterprise: (allNegocios || []).filter((n) => n.tipo_plan === 'enterprise').length,
    };

    const mrrEstimado = (planesCount.basico * 29) + (planesCount.pro * 79) + (planesCount.enterprise * 199);

    const { data: recentTransacciones } = await supabaseAdmin
      .from('transacciones_credito')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return res.json({
      success: true,
      data: {
        totalNegocios: totalNegocios || 0,
        negociosActivos: negociosActivos || 0,
        totalCreditosCirculacion,
        totalCitasAgendadas: totalCitasAgendadas || 0,
        totalChatsBot: totalChatsBot || 0,
        totalMensajesBot: totalMensajesBot || 0,
        planesCount,
        mrrEstimado,
        recentTransacciones: recentTransacciones || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getSolicitudesRecargaAdmin = async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: solicitudes, error } = await supabaseAdmin
      .from('solicitudes_recarga')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const data = await Promise.all(
      (solicitudes || []).map(async (s) => {
        const { data: negocio } = await supabaseAdmin
          .from('negocios')
          .select('nombre_comercial')
          .eq('id_negocio', s.id_negocio)
          .maybeSingle();

        const { data: perfil } = await supabaseAdmin
          .from('perfiles')
          .select('correo')
          .eq('id_usuario', s.id_usuario_solicitante || '')
          .maybeSingle();

        return {
          ...s,
          negocio_nombre: negocio?.nombre_comercial || s.negocio_nombre || 'Negocio',
          correo_solicitante: perfil?.correo || s.correo_solicitante || 'Sin correo',
        };
      })
    );

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const aprobarSolicitudRecargaAdmin = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id_solicitud } = req.params;
    const { notas_admin } = req.body;

    const { data: solicitud, error: fetchError } = await supabaseAdmin
      .from('solicitudes_recarga')
      .select('*')
      .eq('id_solicitud', id_solicitud)
      .single();

    if (fetchError || !solicitud) {
      return res.status(404).json({ success: false, error: 'Solicitud de recarga no encontrada.' });
    }

    if (solicitud.estado === 'APROBADO') {
      return res.status(400).json({ success: false, error: 'Esta solicitud ya fue aprobada previamente.' });
    }

    const { data: negocio, error: negocioError } = await supabaseAdmin
      .from('negocios')
      .select('saldo_creditos, nombre_comercial')
      .eq('id_negocio', solicitud.id_negocio)
      .single();

    if (negocioError || !negocio) {
      return res.status(404).json({ success: false, error: 'El negocio asociado no existe.' });
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from('negocios')
      .update({
        saldo_creditos: negocio.saldo_creditos + solicitud.paquete_creditos,
        updated_at: now,
      })
      .eq('id_negocio', solicitud.id_negocio);

    const updates: any = {
      estado: 'APROBADO',
      updated_at: now,
    };
    if (notas_admin) updates.notas_admin = notas_admin;

    await supabaseAdmin
      .from('solicitudes_recarga')
      .update(updates)
      .eq('id_solicitud', id_solicitud);

    const transaccion: TransaccionCredito = {
      id_transaccion: 'tc-' + Date.now(),
      id_negocio: solicitud.id_negocio,
      monto: solicitud.paquete_creditos,
      tipo: 'RECARGA_MANUAL',
      descripcion: `Recarga aprobada por SuperAdmin (${solicitud.paquete_creditos} créditos - ${solicitud.monto_cop_usd})`,
      id_referencia: solicitud.numero_referencia || `SOL-${solicitud.id_solicitud}`,
      creado_por: req.user?.id_usuario || 'superadmin',
      created_at: now,
    };

    await supabaseAdmin.from('transacciones_credito').insert(transaccion);

    const { data: updatedSolicitud } = await supabaseAdmin
      .from('solicitudes_recarga')
      .select('*')
      .eq('id_solicitud', id_solicitud)
      .single();

    const { data: updatedNegocio } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', solicitud.id_negocio)
      .single();

    return res.json({
      success: true,
      data: { solicitud: updatedSolicitud, negocio: updatedNegocio, transaccion },
      message: `¡Recarga de ${solicitud.paquete_creditos} créditos aprobada exitosamente para ${negocio.nombre_comercial}! Nuevo saldo: ${updatedNegocio.saldo_creditos} créditos.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const rechazarSolicitudRecargaAdmin = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id_solicitud } = req.params;
    const { notas_admin } = req.body;

    const { data: solicitud, error: fetchError } = await supabaseAdmin
      .from('solicitudes_recarga')
      .select('*')
      .eq('id_solicitud', id_solicitud)
      .single();

    if (fetchError || !solicitud) {
      return res.status(404).json({ success: false, error: 'Solicitud de recarga no encontrada.' });
    }

    const { error } = await supabaseAdmin
      .from('solicitudes_recarga')
      .update({
        estado: 'RECHAZADO',
        notas_admin: notas_admin || 'Comprobante no válido o pago no verificado.',
        updated_at: new Date().toISOString(),
      })
      .eq('id_solicitud', id_solicitud);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { data: updatedSolicitud } = await supabaseAdmin
      .from('solicitudes_recarga')
      .select('*')
      .eq('id_solicitud', id_solicitud)
      .single();

    return res.json({
      success: true,
      data: updatedSolicitud,
      message: 'Solicitud de recarga rechazada.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
