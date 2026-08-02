import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Perfil, Negocio, DemoAccount } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: Perfil | null;
  negocio: Negocio | null;
  demoAccounts: DemoAccount[];
  loading: boolean;
  error: string | null;
  login: (correo: string, password: string) => Promise<void>;
  registerTenant: (data: {
    nombre_comercial: string;
    correo: string;
    password: string;
    tipo_plan?: string;
    telefono_whatsapp?: string;
    nombre_contacto?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoAccount: (correo: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Perfil | null>(null);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isRegistering = useRef(false);
  // --- NUEVO: Estado para datos pendientes de pago ---
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    usuario: Perfil;
    negocio: Negocio;
    tipo_plan?: string;
  } | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchDemoAccounts = async () => {
    try {
      const accounts = await api.getDemoAccounts();
      setDemoAccounts(accounts);
    } catch (e: any) {
      console.error('Error loading demo accounts:', e);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.usuario);
      setNegocio(res.negocio);
    } catch (e: any) {
      console.error('Session check failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        if (mounted) {
          await refreshUser();
        }
      } else {
        if (mounted) {
          setUser(null);
          setNegocio(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session && !isRegistering.current) {
          if (mounted) {
            await refreshUser();
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            setNegocio(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchDemoAccounts();
  }, []);

  const login = async (correo: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: correo,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      const res = await api.getMe();
      console.log(res);

      if (!res.usuario.es_superadmin && res.negocio?.estado_verificacion === 'BLOQUEADO') {
        await supabase.auth.signOut();
        throw new Error('Su negocio ha sido bloqueado. Contacte al administrador.');
      }

      setUser(res.usuario);
      setNegocio(res.negocio);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  interface RegisterParams {
  nombre_comercial: string;
  nombre_contacto: string;
  telefono_whatsapp: string;
  correo: string;
  password: string;
  tipo_plan: string;
}

const registerTenant = async (data: {
  nombre_comercial: string;
  correo: string;
  password: string;
  tipo_plan?: string;
  telefono_whatsapp?: string;
  nombre_contacto?: string;
}) => {
  setError(null);
  setLoading(true);
  isRegistering.current = true;

  try {
    const nombreContactoFinal = data.nombre_contacto || `Admin ${data.nombre_comercial}`;
    const tipoPlanFinal = data.tipo_plan || 'basico';

    // 1. Crear el usuario enviando los datos necesarios para el Trigger
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.correo,
      password: data.password,
      options: {
        data: {
          nombre_contacto: nombreContactoFinal,
          nombre_comercial: data.nombre_comercial,
          tipo_plan: tipoPlanFinal,
          telefono_whatsapp: data.telefono_whatsapp || null,
        },
      },
    });

    if (signUpError) throw new Error(signUpError.message);
    if (!authData.user) throw new Error('No se pudo completar el registro.');

    // 2. Construir la estructura directamente desde los metadatos
    // Esto evita lecturas directas a la BD propensas a bloqueos por RLS o race conditions
    const datosNegocioPendiente = {
      usuario: {
        id_usuario: authData.user.id,
        correo: authData.user.email,
        nombre_completo: nombreContactoFinal,
        rol: 'admin',
      },
      negocio: {
        nombre_comercial: data.nombre_comercial,
        telefono_whatsapp: data.telefono_whatsapp || null,
        tipo_plan: tipoPlanFinal,
        estado_verificacion: 'pendiente',
      },
      tipo_plan: tipoPlanFinal,
    };

    // 3. Pasar los datos estructurados al Modal de Pago
    setPendingPaymentData(datosNegocioPendiente);

    // 4. Determinar si requiere flujo de pago o solo confirmación de espera
    if (tipoPlanFinal !== 'basico' && tipoPlanFinal !== 'free') {
      setShowPaymentModal(true);
    } 

  } catch (err: any) {
    console.error('Error al registrar tenant:', err);
    setError(err.message || 'Error al registrar el negocio');
    throw err;
  } finally {
    isRegistering.current = false;
    setLoading(false);
  }
};

  // const registerTenant = async (data: {
  //   nombre_comercial: string;
  //   correo: string;
  //   password: string;
  //   tipo_plan?: string;
  //   telefono_whatsapp?: string;
  //   nombre_contacto?: string;
  // }) => {
  //   setError(null);
  //   setLoading(true);
  //   isRegistering.current = true;

  //   try {
  //     // 1. Crear el usuario en Supabase
  //     const { data: authData, error: signUpError } = await supabase.auth.signUp({
  //       email: data.correo,
  //       password: data.password,
  //       options: {
  //         data: {
  //           nombre_completo: data.nombre_contacto || `Admin ${data.nombre_comercial}`,
  //           nombre_comercial: data.nombre_comercial,
  //           tipo_plan: data.tipo_plan || 'free',
  //           telefono_whatsapp: data.telefono_whatsapp || null,
  //         },
  //       },
  //     });

  //     if (signUpError) throw new Error(signUpError.message);
  //     if (!authData.user) throw new Error('No se pudo completar el registro.');

  //     // 2. Obtener el perfil y negocio recién creados por el trigger de SQL
  //     const { data: perfil, error: perfilError } = await supabase
  //       .from('perfiles')
  //       .select('*, negocios(*)')
  //       .eq('id_usuario', authData.user.id)
  //       .single();
  //     console.log(data, "perfil", perfil);
  //     if (perfilError) throw new Error('Error al obtener datos del registro.');

  //     // 3. CERRAR SESIÓN INMEDIATAMENTE
  //     // Supabase por defecto loguea al usuario tras el signUp. Esto revoca el token local.
  //     // await supabase.auth.signOut();

  //     // 4. No guardamos el usuario en el contexto de autenticación global (setUser)
  //     // En su lugar, guardas los datos necesarios para el Modal de Pago
  //     setPendingPaymentData({
  //       usuario: perfil,
  //       negocio: perfil.negocios,
  //       tipo_plan: data.tipo_plan,
  //     });

  //     // 5. Abrir el modal de pago
  //     setShowPaymentModal(true);

  //   } catch (err: any) {
  //     console.error(err);
  //     setError(err.message || 'Error al registrar el negocio');
  //     throw err;
  //   } finally {
  //     isRegistering.current = false;
  //     setLoading(false);
  //   }
  // };

  const switchDemoAccount = async (correo: string, password: string) => {
    await login(correo, password);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNegocio(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        negocio,
        demoAccounts,
        loading,
        error,
        login,
        registerTenant,
        logout,
        switchDemoAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
  
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
