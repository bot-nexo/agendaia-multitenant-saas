import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RecargaModal } from './RecargaModal';
import {
  Zap,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export const RegistrationComplete: React.FC = () => {
  const { negocio, refreshUser } = useAuth();
  const [step, setStep] = useState<'welcome' | 'payment' | 'pending'>('welcome');
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    setStep('pending');
  };

  if (step === 'pending' && paymentCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              ¡Registro Completado!
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Tu negocio <span className="font-semibold text-slate-800">{negocio?.nombre_comercial}</span> está pendiente de activación.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Activación en 12 horas</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Nuestro equipo está verificando tu comprobante de pago. El asistente de IA de WhatsApp será activado en menos de 12 horas hábiles.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">¿Qué sigue?</h3>
                <ul className="text-xs text-slate-600 mt-1 space-y-1">
                  <li>• Recibirás un email cuando el servicio esté activo</li>
                  <li>• El SuperAdmin revisará tu solicitud de recarga</li>
                  <li>• Se ajustará el crédito de bot según tu paquete</li>
                  <li>• El bot de WhatsApp comenzará a atender tus mensajes</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Estado actual: PENDIENTE</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Mientras tanto, puedes revisar tu solicitud en el historial de recargas desde tu panel de negocio.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => refreshUser()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recargar estado de activación</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mx-auto">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ¡Bienvenido a AgendaIA!
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tu negocio <span className="font-semibold text-slate-800">{negocio?.nombre_comercial}</span> ha sido registrado exitosamente.
            Ahora necesitas completar el pago de activación para que tu asistente de IA de WhatsApp comience a funcionar.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span className={step === 'welcome' ? 'text-indigo-600' : 'text-slate-300'}>
                Bienvenida
              </span>
              <ArrowRight className="w-3 h-3 text-slate-300" />
              <span className={step === 'payment' ? 'text-indigo-600' : 'text-slate-300'}>
                Pago de Activación
              </span>
              <ArrowRight className="w-3 h-3 text-slate-300" />
              <span className={step === 'pending' ? 'text-indigo-600' : 'text-slate-300'}>
                Activación Pendiente
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  step === 'welcome' ? 'w-1/3 bg-indigo-600' :
                  step === 'payment' ? 'w-2/3 bg-indigo-600' :
                  'w-full bg-indigo-600'
                }`}
              />
            </div>
          </div>

          {step === 'welcome' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-600">
                Para activar tu asistente de IA, necesitas realizar un pago de activación.
                Una vez verificado tu pago, tu bot comenzará a atender clientes en WhatsApp.
              </p>
              <button
                onClick={() => setStep('payment')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center space-x-2"
              >
                <span>Continuar al Pago de Activación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'payment' && (
            <RecargaModal
              isOpen={true}
              onClose={() => setStep('welcome')}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};
