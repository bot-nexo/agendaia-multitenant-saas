// server/controllers/payments.controller.ts
import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { ApiResponse } from '../types';

// POST /api/payments/manual
// Expected body: {
//   negocio_id: string,
//   referencia: string,
//   fecha_pago: string (YYYY-MM-DD),
//   nombre_pagador: string,
//   cedula_pagador: string
// }
export const registrarPagoManual = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      negocio_id,
      referencia,
      fecha_pago,
      nombre_pagador,
      cedula_pagador,
    } = req.body;

    if (!negocio_id || !referencia || !fecha_pago || !nombre_pagador || !cedula_pagador) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios.',
      });
    }

    const now = new Date().toISOString();

    const { error: insertError } = await supabaseAdmin
      .from('referencias_pago')
      .insert({
        id_negocio: negocio_id,
        referencia,
        fecha_pago,
        nombre_pagador,
        cedula_pagador,
        creado_en: now,
      });

    if (insertError) {
      return res.status(500).json({ success: false, error: insertError.message });
    }

    // Opcional: crear una solicitud de recarga asociada para que el admin la apruebe
    // Aquí solo devolvemos éxito directo.
    return res.status(201).json({ success: true, message: 'Pago registrado correctamente.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
