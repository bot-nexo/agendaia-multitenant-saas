import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { TenantDashboard } from './pages/TenantDashboard';
import { LoginPage } from './pages/LoginPage';
import { RegistrationComplete } from './components/RegistrationComplete';
import { ShieldAlert, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, negocio, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Iniciando plataforma multitenant AgendaIA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4">
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl max-w-md text-center space-y-3 shadow-xs">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Error de Sesión</h2>
          <p className="text-xs text-rose-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (negocio?.estado_suscripcion === 'SUSPENDIDO' && !user.es_superadmin) {
    return <RegistrationComplete />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1">
        {user.es_superadmin ? <SuperAdminDashboard /> : <TenantDashboard />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
