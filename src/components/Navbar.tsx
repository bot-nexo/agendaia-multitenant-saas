import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  ShieldAlert,
  Coins,
  Bot,
  UserCheck,
  ChevronDown,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, negocio, demoAccounts, switchDemoAccount, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getSubscriptionBadge = (estado?: string) => {
    switch (estado) {
      case 'ACTIVO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Activo
          </span>
        );
      case 'VENCIDO_GRACIA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Gracia
          </span>
        );
      case 'SUSPENDIDO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Suspendido
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white text-slate-900 sticky top-0 z-40 shadow-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  AgendaIA
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Multitenant SaaS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Gestión de Citas & WhatsApp Bot IA</p>
            </div>
          </div>

          {/* Business Badges & Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {user?.es_superadmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                <ShieldAlert className="w-3.5 h-3.5" /> SuperAdmin Global
              </span>
            ) : (
              negocio && (
                <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-800">{negocio.nombre_comercial}</span>
                  </div>
                  {getSubscriptionBadge(negocio.estado_suscripcion)}
                  <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 text-amber-700 font-semibold text-xs">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>{negocio.saldo_creditos} crd</span>
                  </div>
                </div>
              )
            )}

            {/* Account Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                <span>Cambiar Rol / Negocio</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Seleccionar Perfil Demo
                    </p>
                  </div>
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.id_usuario}
                      onClick={async () => {
                        setDropdownOpen(false);
                        await switchDemoAccount(acc.correo);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start space-x-2 hover:bg-slate-50 transition ${
                        user?.correo === acc.correo ? 'bg-indigo-50/80 text-indigo-900 border-l-2 border-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      <div className="mt-0.5">
                        {acc.es_superadmin ? (
                          <ShieldAlert className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Building2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{acc.nombre_completo}</p>
                        <p className="text-[11px] text-slate-500 truncate">{acc.negocio_nombre}</p>
                      </div>
                    </button>
                  ))}
                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-rose-600 hover:bg-rose-50 transition font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-4 space-y-3">
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Perfil Actual</span>
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.nombre_completo}</p>
                <p className="text-xs text-slate-500">{negocio ? negocio.nombre_comercial : 'SuperAdmin Global'}</p>
              </div>
              {negocio && getSubscriptionBadge(negocio.estado_suscripcion)}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cambiar Usuario Demo</p>
            <div className="space-y-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id_usuario}
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await switchDemoAccount(acc.correo);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                    user?.correo === acc.correo ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{acc.nombre_completo}</span>
                  <span className="text-[10px] opacity-80">{acc.negocio_nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
