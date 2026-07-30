import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SolicitudRecarga } from '../types';
import {
  X,
  CreditCard,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  ArrowRight,
  Building2,
  FileText
} from 'lucide-react';

const env = (import.meta as any).env || {};
const PAYMENT_NEQUI_PHONE = env.VITE_PAYMENT_NEQUI_PHONE || '';
const PAYMENT_BANCOLOMBIA_ACCOUNT = env.VITE_PAYMENT_BANCOLOMBIA_ACCOUNT || '';
const PAYMENT_NIT = env.VITE_PAYMENT_NIT || '';

interface RecargaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RecargaModal: React.FC<RecargaModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [subTab, setSubTab] = useState<'nueva' | 'historial'>('nueva');

  // Package options
  const [selectedPackage, setSelectedPackage] = useState<{
    creditos: number;
    monto: string;
    nombre: string;
  }>({
    creditos: 300,
    monto: '$25 USD / $100,000 COP',
    nombre: 'Paquete Pro (300 Créditos Bot)',
  });

  const [metodoPago, setMetodoPago] = useState('Nequi / Bancolombia');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [numReferencia, setNumReferencia] = useState('');
  const [notas, setNotas] = useState('');

  const [solicitudes, setSolicitudes] = useState<SolicitudRecarga[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const res = await api.tenant.getSolicitudesRecarga();
      setSolicitudes(res);
    } catch (err: any) {
      console.error('Error al obtener solicitudes de recarga:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSolicitudes();
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobanteUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comprobanteUrl) {
      setError('Por favor suba la imagen del comprobante de pago.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.tenant.createSolicitudRecarga({
        paquete_creditos: selectedPackage.creditos,
        monto_cop_usd: selectedPackage.monto,
        metodo_pago: metodoPago,
        comprobante_url: comprobanteUrl,
        numero_referencia: numReferencia || undefined,
        notas_negocio: notas || undefined,
      });

      setSuccessMsg('¡Solicitud de recarga enviada con éxito! El SuperAdmin revisará tu comprobante.');
      setNumReferencia('');
      setNotas('');
      fetchSolicitudes();
      if (onSuccess) onSuccess();
      setTimeout(() => setSubTab('historial'), 1200);
    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud de recarga.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Recargar Créditos IA Bot</h3>
              <p className="text-xs text-slate-400">
                Transfiere y sube tu comprobante para acreditación inmediata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-3">
          <button
            onClick={() => setSubTab('nueva')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
              subTab === 'nueva'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Nueva Recarga</span>
          </button>
          <button
            onClick={() => setSubTab('historial')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
              subTab === 'historial'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historial de Recargas ({solicitudes.length})</span>
          </button>
        </div>

        {/* TAB 1: NUEVA RECARGA */}
        {subTab === 'nueva' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
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

            {/* 1. Canales de Transferencia */}
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

            {/* 2. Paquetes de Créditos */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Selecciona tu Paquete de Créditos
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { creditos: 100, monto: '$10 USD / $40,000 COP', nombre: 'Básico (100 Créditos)' },
                  { creditos: 300, monto: '$25 USD / $100,000 COP', nombre: 'Pro (300 Créditos)' },
                  { creditos: 1000, monto: '$70 USD / $280,000 COP', nombre: 'Enterprise (1,000 Créditos)' },
                ].map((pkg) => (
                  <button
                    key={pkg.creditos}
                    type="button"
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedPackage.creditos === pkg.creditos
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-900">{pkg.creditos} Créditos</p>
                    <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{pkg.monto}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Método de Pago */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Canal de Pago Utilizado</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Nequi / Bancolombia">Nequi / Bancolombia</option>
                <option value="Daviplata">Daviplata</option>
                <option value="Transferencia Bancaria PSE">Transferencia Bancaria PSE</option>
                <option value="Zelle / Paypal (USD)">Zelle / Paypal (USD)</option>
              </select>
            </div>

            {/* 4. Subida de Comprobante */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Comprobante de Pago (Imagen/Captura) *</span>
                <span className="text-[11px] text-indigo-600">Requerido para verificación</span>
              </label>

              {/* Upload Input & Demo selector */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition">
                {comprobanteUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block max-h-48 rounded-lg overflow-hidden border border-slate-300 shadow-xs mx-auto">
                      <img
                        src={comprobanteUrl}
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
                    <p className="text-[11px] text-slate-400">JPG, PNG o WEBP (Captura de pantalla)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 5. Referencia y Notas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Referencia / Transacción
                </label>
                <input
                  type="text"
                  placeholder="Ej: NEQ-9847201"
                  value={numReferencia}
                  onChange={(e) => setNumReferencia(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas u Observaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago realizado a las 10:30am"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                <span>{submitting ? 'Enviando...' : 'Enviar Comprobante al SuperAdmin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: HISTORIAL DE SOLICITUDES */}
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
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                            sol.estado === 'APROBADO'
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
                        <p><span className="font-semibold text-slate-800">Monto:</span> {sol.monto_cop_usd}</p>
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
    </div>
  );
};
