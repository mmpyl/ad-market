'use client';

import { api } from '@/lib/api/client';
import { User } from '@/types/auth';
import { useRouter } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (access_token: string) => Promise<void>;
  register: (email: string, password: string, passcode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthProvider] Attempting login for:', email);
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('[AuthProvider] Login response:', response);
      
      const userData = response.user || response;
      
      if (userData && userData.email) {
        setUser(userData);
        setIsLoading(false);
        console.log('[AuthProvider] Login successful, user set:', userData);
        
        
        // ⭐ Redirigir después del login exitoso
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        router.push(redirect || '/dashboard');
        
      } else {
        console.log('[AuthProvider] No user in response, refreshing...');
        await refreshUser();
      }
    } catch (error) {
      console.error('[AuthProvider] Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, passcode: string): Promise<void> => {
    try {
      await api.post('/auth/register', {
        email,
        password,
        passcode,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('[AuthProvider] Logging out...');
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[AuthProvider] Logout error (non-critical):', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      console.log('[AuthProvider] Refreshing user data...');
      const userData = await api.get('/auth/user');
      console.log('[AuthProvider] User data refreshed:', userData);
      setUser(userData);
    } catch (error) {
      console.log('[AuthProvider] No active session or error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = async (access_token: string): Promise<void> => {
    try {
      await api.post('/auth/google-login', {
        access_token,
        callback_url: window.location.origin,
      });
      await refreshUser();
    } catch (error) {
      console.error('[AuthProvider] Google login failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  const value = {
    user,
    isLoading,
    login,
    googleLogin,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}