import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RecargaContent } from './RecargaContent';
import {
  ShieldAlert,
  RefreshCw,
  Clock,
  FileText,
  CheckCircle2,
  ArrowBigLeft,
} from 'lucide-react';

export const PendingVerificationScreen: React.FC = () => {
  const { negocio, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshUser();
    } finally {
      setChecking(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sb-pattorfdjhfhdhnkfssb-auth-token');
    window.location.href = '/login';
  };

  //************************ */55e9d4c7-da43-4fa1-ae00-9c5ebdde8141
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <button title='Volver al inicio' className="cursor-pointer text-sm flex items-center gap-2" onClick={logout} ><ArrowBigLeft className="w-6 h-6 text-indigo-600 " />Atrás</button>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto shadow-lg">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Negocio en Verificación
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tu negocio <span className="font-semibold text-slate-800">{negocio?.nombre_comercial.toUpperCase()}</span> está pendiente de aprobación.
            Realiza el pago de activación y sube tu comprobante para que el equipo de <span className="font-semibold text-slate-800">Nexo Bots</span> verifique y active su cuenta.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Activación Pendiente</h3>
              <p className="text-xs text-slate-600 mt-1">
                Una vez que el equipo de <span className="font-semibold text-slate-800">Nexo Bots</span> apruebe tu comprobante de pago,
                el asistente de IA de WhatsApp será activado y tendrás acceso completo al dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">¿Qué debes hacer?</h3>
              <ul className="text-xs text-slate-600 mt-1 space-y-1">
                <li>• Realiza una transferencia a una de las cuentas disponibles</li>
                <li>• Sube la captura del comprobante de pago</li>
                <li>• Ingresa la referencia de la transacción</li>
                <li>• El equipo de <span className="font-semibold text-slate-800">Nexo Bots</span> revisará tu comprobante y aprobará tu negocio</li>
                <li>• Recibirás un correo cuando el servicio esté activo</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">¿Ya realizaste el pago?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Usa el formulario de abajo para subir tu comprobante y enviar la solicitud de recarga.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center pt-2 border-t border-slate-200">
            <button
              onClick={handleRefresh}
              disabled={checking}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>Recargar estado de aprobación</span>
            </button>
          </div>
        </div>

        <RecargaContent info={negocio} />
      </div>
    </div>
  );
};
