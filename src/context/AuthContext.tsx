import React, { createContext, useContext, useState, useEffect } from 'react';
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
      setUser(null);
      setNegocio(null);
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
        if (event === 'SIGNED_IN' && session) {
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
      setUser(res.usuario);
      setNegocio(res.negocio);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.correo,
        password: data.password,
        options: {
          data: {
            nombre_completo: data.nombre_contacto || `Admin ${data.nombre_comercial}`,
            nombre_comercial: data.nombre_comercial,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      const res = await api.registerTenant(data);
      setUser(res.usuario);
      setNegocio(res.negocio);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el negocio');
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
