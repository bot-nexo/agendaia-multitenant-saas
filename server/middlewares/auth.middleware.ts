import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { JwtUserPayload, ApiResponse } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Servicio de base de datos no disponible. Contacte al administrador.',
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Acceso no autorizado: Token de Supabase no proporcionado.',
      });
    }

    const token = authHeader.slice(7);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Acceso no autorizado: Token de Supabase inválido o expirado.',
      });
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id_usuario', user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de usuario no encontrado en la base de datos.',
      });
    }

    req.user = {
      id_usuario: user.id,
      correo: user.email || perfil.id_usuario,
      nombre_completo: perfil.nombre_completo,
      es_superadmin: perfil.es_superadmin,
      id_negocio: perfil.id_negocio || null,
      rol: perfil.rol,
    };

    return next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: 'Acceso no autorizado: Error verificando token de Supabase. (' + err.message + ')',
    });
  }
};

export const tenantIsolationMiddleware = (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Error de aislamiento multitenant: Usuario no autenticado.',
    });
  }

  if (req.user.es_superadmin) {
    const overrideTenantId = req.headers['x-tenant-id'] as string;
    if (overrideTenantId) {
      req.user.id_negocio = overrideTenantId;
    }
    return next();
  }

  if (!req.user.id_negocio) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado: El usuario no está asociado a ningún negocio registrado.',
    });
  }

  return next();
};

export const requireSuperAdminMiddleware = (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Error de autorización: Usuario no autenticado.',
    });
  }

  if (!req.user.es_superadmin) {
    return res.status(403).json({
      success: false,
      error: 'Acceso restringido: Esta acción requiere privilegios de SuperAdmin global.',
    });
  }

  return next();
};
