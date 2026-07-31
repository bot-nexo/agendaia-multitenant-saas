import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Building2,
  Zap,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { normalizarWhatsApp, validarPassword } from '../functions/functions';

export const LoginPage: React.FC = () => {
  const { login, registerTenant, demoAccounts, switchDemoAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [regNombreComercial, setRegNombreComercial] = useState('');
  const [regNombreContacto, setRegNombreContacto] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('123456');
  const [regPlan, setRegPlan] = useState<'basico' | 'pro' | 'enterprise'>('pro');

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const getDemoPassword = (correo: string) => {
    if (correo.includes('admin@agendaia.com')) return 'admin123';
    if (correo.includes('barberia')) return 'barberia123';
    if (correo.includes('contacto@dentalspa.com')) return 'dental123';
    if (correo.includes('hola@spabella.com')) return 'spabella123';
    return '123456';
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      await login(loginEmail.trim(), loginPassword);
      setAuthSuccess('¡Autenticación exitosa! Redirigiendo...');
    } catch (err: any) {
      setAuthError(err.message || 'Error al autenticar correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombreComercial.trim() || !regEmail.trim() || !regPassword.trim() || !regTelefono.trim()) {
      setAuthError('Por favor complete todos los campos obligatorios.');
      return;
    }

    const telefonoNormalizado = normalizarWhatsApp(regTelefono.trim());
    if (!telefonoNormalizado.valido) {
      setAuthError(telefonoNormalizado.mensaje);
      return;
    }
    const passwordNormalizado = validarPassword(regPassword.trim());
    if (!passwordNormalizado.valido) {
      setAuthError(passwordNormalizado.mensaje);
      return;
    }
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      await registerTenant({
        nombre_comercial: regNombreComercial.trim(),
        nombre_contacto: regNombreContacto.trim(),
        telefono_whatsapp: telefonoNormalizado.numeroNormalizado,
        correo: regEmail.trim(),
        password: passwordNormalizado.passNormal,
        tipo_plan: regPlan,
      });

      setAuthSuccess('¡Negocio creado e iniciado con éxito!');
    } catch (err: any) {
      console.log(err);
      setAuthError(err.message || 'Error al registrar el nuevo negocio.');
    } finally {
      setLoading(false);
    }
  };

  //*********************** */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mx-auto">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nexo Bots</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Plataforma Multitenant de Gestión de Citas & Bot WhatsApp con IA
          </p>
        </div>

        {/* Formulario de inicio de sesión */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${activeTab === 'login'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${activeTab === 'register'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrarme</span>
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="usuario@negocio.com"
                    value={loginEmail}
                    onChange={(e: any) => setLoginEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e: any) => setLoginPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Autenticando...' : 'Iniciar Sesión'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegisterTenant} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Comercial del Negocio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Spa & Belleza"
                  value={regNombreComercial}
                  onChange={(e: any) => setRegNombreComercial(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={regNombreContacto}
                    onChange={(e: any) => setRegNombreContacto(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+573000000000"
                    value={regTelefono}
                    onChange={(e: any) => setRegTelefono(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@minegocio.com"
                  value={regEmail}
                  onChange={(e: any) => setRegEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña * <span className="text-[12px] text-slate-400">(minimo 6 caracteres)</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Contraseña minimo 6 caracteres"
                  value={regPassword}
                  onChange={(e: any) => setRegPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan de Suscripción Inicial
                </label>
                <select
                  value={regPlan}
                  onChange={(e: any) => setRegPlan(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="basico">Básico (50 créditos bot - Gratis)</option>
                  <option value="pro">Pro (300 créditos bot - Recomendado)</option>
                  <option value="enterprise">Enterprise (1,000 créditos bot)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Creando negocio...' : 'Registrar Negocio & Crear Cuenta'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Cuentas Demo Preconfiguradas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cuentas Demo Preconfiguradas
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Selecciona una cuenta para autorellenar email + contraseña o ingresar en 1-clic:
              </p>
            </div>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-2">
            {demoAccounts.map((acc) => {
              const pass = getDemoPassword(acc.correo);
              return (
                <div
                  key={acc.id_usuario}
                  className={`p-3 rounded-xl border transition flex items-center justify-between group ${acc.es_superadmin
                    ? 'bg-purple-50/50 border-purple-200'
                    : 'bg-slate-50 border-slate-200'
                    }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${acc.es_superadmin
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-indigo-100 text-indigo-700'
                        }`}
                    >
                      {acc.es_superadmin ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-900 truncate">
                        {acc.nombre_completo}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {acc.correo} • Pass: <span className="font-mono text-slate-700 bg-slate-200/60 px-1 rounded">{pass}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setLoginEmail(acc.correo);
                        setLoginPassword(pass);
                      }}
                      className="px-2 py-1 bg-white border border-slate-300 text-[11px] font-medium text-slate-700 rounded-md hover:bg-slate-100 transition"
                      title="Cargar credenciales en el formulario"
                    >
                      Cargar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        setAuthError(null);
                        try {
                          await switchDemoAccount(acc.correo, pass);
                        } catch (e: any) {
                          setAuthError('Error al ingresar con la cuenta demo.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-medium rounded-md hover:bg-indigo-700 transition"
                    >
                      Entrar →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
