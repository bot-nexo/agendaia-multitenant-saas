import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SolicitudRecarga } from '../types';
import {
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  ArrowRight,
  Building2,
  FileWarning,
} from 'lucide-react';
import { planes_data } from '../functions/arreglos';
import { supabase } from '../lib/supabase';

const env = (import.meta as any).env || {};
const PAYMENT_NEQUI_PHONE = env.VITE_PAYMENT_NEQUI_PHONE || '';
const PAYMENT_BANCOLOMBIA_ACCOUNT = env.VITE_PAYMENT_BANCOLOMBIA_ACCOUNT || '';
const PAYMENT_NIT = env.VITE_PAYMENT_NIT || '';

interface RecargaContentProps {
  onSuccess?: () => void;
  info: any;
}

export const RecargaContent: React.FC<RecargaContentProps> = ({ onSuccess, info }) => {
  const [subTab, setSubTab] = useState<'nueva' | 'historial'>('nueva');
  const [nombrePagador, setNombrePagador] = useState('');
  const [cedulaPagador, setCedulaPagador] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]); // Fecha de hoy por defecto (YYYY-MM-DD)

  const [selectedPackage, setSelectedPackage] = useState<any>({
    id: 'demo',
    name: 'Demo',
    price: 0,
    credits: 5,
    description: 'Plan de prueba 5 créditos, 1 negocio'
  });

  const [metodoPago, setMetodoPago] = useState('Nequi / Bancolombia');

  // Guardamos el objeto File y la URL de previsualización local
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [numReferencia, setNumReferencia] = useState('');
  const [notas, setNotas] = useState('');

  const [solicitudes, setSolicitudes] = useState<SolicitudRecarga[]>([]);
  const [transacciones, setTransacciones] = useState<SolicitudRecarga[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchTransacciones = async () => {
    try {
      setLoading(true);
      const res = await api.obtenerTransaccionesPorNegocio(info.id_negocio);
      // console.log("Transacciones", res);
      setSolicitudes(res);
      const pendientes = res.filter((item: any) => item.estado === 'PENDIENTE');
      // console.log("Pendientes", pendientes);
      setTransacciones(pendientes);
    } catch (err: any) {
      console.error('Error al obtener transacciones de recarga:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransacciones();
  }, []);

  useEffect(() => {
    // console.log(info);
    if (planes_data && planes_data.length > 0 && info) {
      const plan = planes_data.find((plan) => plan.id === info.tipo_plan);
      if (plan) {
        setSelectedPackage(plan);
      }
    }
  }, []);

  // Función para subir el archivo a Supabase Storage
  const uploadComprobanteToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `solicitudes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(uploadError);
      throw new Error(`Error al subir la imagen: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprobanteFile(file);
      // Creamos una URL temporal para mostrar la vista previa en el cliente
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comprobanteFile) {
      setError('Por favor suba la imagen del comprobante de pago.');
      return;
    }

    // Validaciones básicas de los nuevos datos del pagador
    if (!nombrePagador.trim() || !cedulaPagador.trim() || !numReferencia.trim()) {
      setError('Por favor complete la referencia, el nombre y la cédula del pagador.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Subir la imagen del recibo a Supabase Storage
      const comprobanteUrl = await uploadComprobanteToStorage(comprobanteFile);
      if (comprobanteUrl === "") {
        throw new Error('Error al subir la imagen.');
      }
      // 2. Guardar el detalle de la transferencia en la tabla 'referencias_pago'
      const res = await api.crearReferencia({
        id_referencia: crypto.randomUUID(), // Genera un ID único para la tabla
        id_negocio: info?.id_negocio || "", // El UUID del negocio autenticado
        referencia: numReferencia,
        fecha_pago: fechaPago,
        nombre_pagador: nombrePagador,
        cedula_pagador: cedulaPagador,
        url_referencia: comprobanteUrl,
        canal_pago: metodoPago
      });
      // console.log(res);
      if (!res) {
        throw new Error("Error al enviar la solicitud.");
      }
      const res1 = await api.crearTransaccionCreditos({
        id_transaccion: crypto.randomUUID(),
        id_negocio: info?.id_negocio || "",
        id_referencia: res.id_referencia,
        monto: selectedPackage.price || 0,
        tipo: "SUSCRIPCION",
        descripcion: `Pago de Suscripción a Nexo Bots`,
      });
      // console.log(res1);
      if (!res1) {
        throw new Error("Error al enviar la solicitud.");
      }

      setSuccessMsg('¡Solicitud enviada con éxito! El equipo de Nexo Bots revisará tu comprobante.');

      // Limpiar formulario
      setNumReferencia('');
      setNombrePagador('');
      setCedulaPagador('');
      setNotas('');
      setComprobanteFile(null);
      setPreviewUrl('');

      fetchTransacciones();
      if (onSuccess) onSuccess();
      setTimeout(() => setSubTab('historial'), 1200);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  //************************* */
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex bg-slate-100 p-1 rounded-xl m-5">
        <button
          type="button"
          onClick={() => setSubTab('nueva')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${subTab === 'nueva'
            ? 'bg-white text-indigo-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Zap className="w-4 h-4" />
          <span>Pagar Suscripción</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('historial')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${subTab === 'historial'
            ? 'bg-white text-indigo-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historial ({solicitudes.length})</span>
        </button>
      </div>

      {subTab === 'nueva' && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Canales de Transferencia Disponibles</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <p className="font-bold text-slate-900">Nequi / Daviplata</p>
                <p className="font-mono text-slate-600 mt-0.5">📱 {PAYMENT_NEQUI_PHONE || 'N/A'}</p>
                <p className="text-[10px] text-slate-400">Titular: AgendaIA SaaS SAS</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <p className="font-bold text-slate-900">Bancolombia Ahorros</p>
                <p className="font-mono text-slate-600 mt-0.5">🏦 # {PAYMENT_BANCOLOMBIA_ACCOUNT || 'N/A'}</p>
                <p className="text-[10px] text-slate-400">NIT: {PAYMENT_NIT || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold mb-3 text-slate-800 uppercase tracking-wider">
              Plan seleccionado
            </label>
            <div className="grid grid-cols-1">
              <div className="relative overflow-hidden rounded-2xl border border-indigo-400 bg-indigo-200 p-3 shadow-lg shadow-indigo-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-0.5 ring-1 ring-indigo-500/10">
                <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                    {selectedPackage.name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-300 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    Seleccionado
                  </span>
                </div>

                <div className="flex items-baseline justify-between py-2">
                  <div>
                    <span className="text-xl font-black text-indigo-950 tracking-tight">
                      {selectedPackage.credits || selectedPackage.creditos}
                    </span>
                    <span className="ml-1 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Créditos
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-0.5 justify-end items-center">
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      ${selectedPackage.price || selectedPackage.monto}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">/ mes</span>
                  </div>
                </div>

                <p className="text-sm text-slate-500 leading-relaxed font-normal">
                  {selectedPackage.description}
                </p>
              </div>
            </div>
          </div>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {transacciones.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-medium flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Su solicitud de recarga está en proceso. Espere la verificación del equipo de Nexo Bots.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Canal de Pago Utilizado
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Nequi / Bancolombia">Nequi / Bancolombia</option>
              <option value="Daviplata">Daviplata</option>
              <option value="Transferencia Bancaria PSE">Transferencia Bancaria PSE</option>
              <option value="Corresponsal Bancario / Efectivo">Corresponsal Bancario / Efectivo</option>
              <option value="Zelle / Paypal (USD)">Zelle / Paypal (USD)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Comprobante de Pago (Imagen/Captura) *</span>
              <span className="text-[11px] text-indigo-600">Requerido para verificación</span>
            </label>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition">
              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative inline-block max-h-48 rounded-lg overflow-hidden border border-slate-300 shadow-xs mx-auto">
                    <img
                      src={previewUrl}
                      alt="Comprobante preview"
                      className="max-h-40 object-contain mx-auto"
                    />
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <label className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100">
                      <span>Cambiar Imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Haz clic para subir imagen del comprobante
                  </p>
                  <p className="text-[11px] text-slate-400">JPG, PNG o WEBP (Captura o foto del recibo)</p>
                  <input
                    type="file"
                    disabled={transacciones.length > 0}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Referencia / Transacción *
              </label>
              <input
                type="text"
                placeholder="Ej: NEQ-9847201"
                value={numReferencia}
                onChange={(e) => setNumReferencia(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Pago *
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Pagador *
              </label>
              <input
                type="text"
                placeholder="Nombre de quien hizo la transferencia"
                value={nombrePagador}
                onChange={(e) => setNombrePagador(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cédula / NIT del Pagador *
              </label>
              <input
                type="text"
                placeholder="Ej: 1098765432"
                value={cedulaPagador}
                onChange={(e) => setCedulaPagador(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="submit"
              disabled={submitting || transacciones.length > 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <span>{submitting ? 'Subiendo comprobante...' : 'Enviar Comprobante al SuperAdmin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {subTab === 'historial' && (
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-8">Cargando solicitudes...</p>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No hay solicitudes de recarga previas</p>
              <p className="text-[11px] text-slate-400">Tus pagos y recargas aparecerán listados aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudes.map((sol) => (
                <div
                  key={sol.id_solicitud}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${sol.estado === 'APROBADO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sol.estado === 'RECHAZADO'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                          }`}
                      >
                        {sol.estado === 'APROBADO' && <CheckCircle2 className="w-3 h-3" />}
                        {sol.estado === 'RECHAZADO' && <XCircle className="w-3 h-3" />}
                        {sol.estado === 'PENDIENTE' && <Clock className="w-3 h-3" />}
                        <span>{sol.estado}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        +{sol.paquete_creditos} Créditos
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(sol.created_at).toLocaleDateString()} {new Date(sol.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <p><span className="font-semibold text-slate-800">Monto:</span> ${sol.monto_cop_usd}</p>
                      <p><span className="font-semibold text-slate-800">Método:</span> {sol.metodo_pago}</p>
                      {sol.numero_referencia && (
                        <p><span className="font-semibold text-slate-800">Ref:</span> {sol.numero_referencia}</p>
                      )}
                    </div>

                    {sol.comprobante_url && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 mb-1">Comprobante Adjunto:</p>
                        <a
                          href={sol.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <img
                            src={sol.comprobante_url}
                            alt="Comprobante"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-300 ml-auto hover:scale-105 transition"
                          />
                        </a>
                      </div>
                    )}
                  </div>

                  {sol.notas_admin && (
                    <div className="p-2 bg-slate-100 rounded-lg text-[11px] text-slate-700">
                      <span className="font-bold text-slate-900">Nota SuperAdmin:</span> {sol.notas_admin}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};