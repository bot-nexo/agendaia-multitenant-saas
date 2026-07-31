// server/controllers/pending.controller.ts
import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { ApiResponse, Negocio } from '../types';
import { sendEmail } from '../utils/email';

// Obtener negocios con estado_verificacion = 'PENDIENTE'
export const getNegociosPendientes = async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: negocios, error } = await supabaseAdmin
      .from('negocios')
      .select('*')
      .eq('estado_verificacion', 'PENDIENTE');
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data: negocios });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Aprobar negocio y enviar notificación por email
export const aprobarNegocio = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id_negocio } = req.params;
    const now = new Date().toISOString();
    const { data: negocio, error: fetchError } = await supabaseAdmin
      .from('negocios')
      .select('nombre_comercial, email_contacto')
      .eq('id_negocio', id_negocio)
      .single();
    if (fetchError || !negocio) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado.' });
    }
    if ((negocio as any).estado_verificacion === 'APROBADO') {
      return res.status(400).json({ success: false, error: 'Negocio ya aprobado.' });
    }
    await supabaseAdmin
      .from('negocios')
      .update({ estado_verificacion: 'APROBADO', updated_at: now })
      .eq('id_negocio', id_negocio);

    // Enviar email de notificación (placeholder email field)
    const email = (negocio as any).email_contacto || (negocio as any).correo || '';
    if (email) {
      await sendEmail({
        to: email,
        subject: 'Su negocio ha sido aprobado',
        html: `<p>Hola,</p><p>Su negocio <strong>${(negocio as any).nombre_comercial}</strong> ha sido aprobado y está activo.</p>`,
      });
    }
    return res.json({ success: true, message: 'Negocio aprobado.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Bloquear negocio
export const bloquearNegocio = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id_negocio } = req.params;
    const now = new Date().toISOString();
    const { data: negocio, error: fetchError } = await supabaseAdmin
      .from('negocios')
      .select('id_negocio')
      .eq('id_negocio', id_negocio)
      .single();
    if (fetchError || !negocio) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado.' });
    }
    await supabaseAdmin
      .from('negocios')
      .update({ estado_verificacion: 'BLOQUEADO', updated_at: now })
      .eq('id_negocio', id_negocio);
    return res.json({ success: true, message: 'Negocio bloqueado.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
