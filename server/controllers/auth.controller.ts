import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { ApiResponse } from '../types';

export const loginUser = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { correo, password } = req.body;

    if (!correo) {
      return res.status(400).json({
        success: false,
        error: 'El correo electrónico es requerido para iniciar sesión.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña es requerida para iniciar sesión.',
      });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas. Verifique su correo y contraseña.',
      });
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id_usuario', data.user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de usuario no encontrado. Contacte al administrador.',
      });
    }

    if (perfil.rol === 'personal') {
      return res.status(403).json({
        success: false,
        error: 'El acceso para colaboradores (personal) está desactivado en la versión v1 de la plataforma. Cada negocio tiene un único usuario administrador.',
      });
    }

    let negocio = null;
    if (perfil.id_negocio) {
      const { data: neg } = await supabaseAdmin
        .from('negocios')
        .select('*')
        .eq('id_negocio', perfil.id_negocio)
        .single();
      negocio = neg;
    }

    return res.json({
      success: true,
      data: {
        token: data.session?.access_token || '',
        usuario: perfil,
        negocio,
      },
      message: 'Inicio de sesión exitoso.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Error interno en login: ' + err.message,
    });
  }
};

export const registerTenant = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { nombre_comercial, correo, password, tipo_plan, telefono_whatsapp, nombre_contacto } = req.body;

    if (!nombre_comercial || !correo || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nombre comercial, correo y contraseña son campos obligatorios.',
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido.',
      });
    }
    const token = authHeader.slice(7);

    const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    if (tokenError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado.',
      });
    }

    const { data: existingPerfil } = await supabaseAdmin
      .from('perfiles')
      .select('id_usuario')
      .eq('id_usuario', user.id)
      .maybeSingle();

    if (existingPerfil) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un perfil registrado para este usuario.',
      });
    }

    const now = new Date().toISOString();

    const creditosIniciales = tipo_plan === 'enterprise' ? 1000 : tipo_plan === 'pro' ? 300 : 50;

    const { data: newNegocio, error: negocioError } = await supabaseAdmin
      .from('negocios')
      .insert({
        nombre_comercial,
        logo_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150',
        telefono_whatsapp: telefono_whatsapp || '+573000000000',
        tipo_plan: tipo_plan || 'basico',
        saldo_creditos: creditosIniciales,
        estado_suscripcion: 'SUSPENDIDO',
        prompt_personalidad: `Eres el asistente virtual con IA de ${nombre_comercial}. Respondes con amabilidad y ayudas a agendar citas.`,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (negocioError || !newNegocio) {
      return res.status(500).json({
        success: false,
        error: 'Error al crear el negocio: ' + negocioError?.message,
      });
    }

    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id_usuario: user.id,
        id_negocio: newNegocio.id_negocio,
        correo: user.email || correo,
        nombre_completo: nombre_contacto || `Admin ${nombre_comercial}`,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        rol: 'admin',
        es_superadmin: false,
        created_at: now,
        updated_at: now,
      });

    if (perfilError) {
      return res.status(500).json({
        success: false,
        error: 'Error al crear el perfil de usuario: ' + perfilError.message,
      });
    }

    const { data: negocio } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('id_negocio', newNegocio.id_negocio)
      .single();

    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id_usuario', user.id)
      .single();

    return res.status(201).json({
      success: true,
      data: {
        token,
        usuario: perfil,
        negocio,
      },
      message: 'Registro de negocio y usuario completado con éxito.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Error al registrar negocio: ' + err.message,
    });
  }
};

export const getMe = async (req: Request, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id_usuario', req.user.id_usuario)
      .single();

    let negocio = null;
    if (req.user.id_negocio) {
      const { data: neg } = await supabaseAdmin
        .from('negocios')
        .select('*')
        .eq('id_negocio', req.user.id_negocio)
        .single();
      negocio = neg;
    }

    return res.json({
      success: true,
      data: {
        usuario: perfil || req.user,
        negocio: negocio || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getDemoAccounts = async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: perfiles, error } = await supabaseAdmin
      .from('perfiles')
      .select(`
        id_usuario,
        correo,
        nombre_completo,
        es_superadmin,
        rol,
        id_negocio,
        negocio:negocios!inner(nombre_comercial, tipo_plan, estado_suscripcion, saldo_creditos)
      `);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const demoAccounts = perfiles?.map((p: any) => ({
      id_usuario: p.id_usuario,
      correo: p.correo,
      nombre_completo: p.nombre_completo,
      es_superadmin: p.es_superadmin,
      rol: p.rol,
      negocio_nombre: p.negocio?.nombre_comercial || 'SuperAdmin Global',
      negocio_plan: p.negocio?.tipo_plan || 'N/A',
      negocio_estado: p.negocio?.estado_suscripcion || 'N/A',
      saldo_creditos: p.negocio?.saldo_creditos || 'N/A',
    })) || [];

    return res.json({
      success: true,
      data: demoAccounts,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
