'use client';

import React, { createContext, use, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/types/auth';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

/**
 * Authentication context interface defining all available auth operations
 */
interface AuthContextType {
  /** Currently authenticated user or null if not authenticated */
  user: User | null;
  /** Loading state during authentication operations */
  isLoading: boolean;
  /** Login function with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** Google OAuth login function */
  googleLogin: (access_token: string) => Promise<void>;
  /** User registration function */
  register: (email: string, password: string, passcode: string) => Promise<void>;
  /** Logout function */
  logout: () => Promise<void>;
  /** Refresh current user data from server */
  refreshUser: () => Promise<void>;
}

/**
 * React context for authentication state management
 * Provides authentication state and methods throughout the application
 */
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
      const response = await api.post('/auth/login', { email, password });
      // User data is now included in the login response
      if (response && response.user) {
        setUser(response.user);
        setIsLoading(false);
        // Don't redirect here - let the component handle it
      } else {
        await refreshUser();
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Registers a new user account
   * @param email - User's email address
   * @param password - User's password
   * @param passcode - Registration passcode for verification
   * @throws Error if registration fails
   */
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

  /**
   * Logs out the current user and redirects to login page
   * Clears user state and navigates to login regardless of API call success
   */
  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      router.push('/login');
    } catch (error) {
      setUser(null);
      router.push('/login');
    }
  };

  /**
   * Refreshes current user data from the server
   * Updates user state and loading state accordingly
   * Memoized with useCallback to prevent unnecessary re-renders
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const userData = await api.get('/auth/user');
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Authenticates user using Google OAuth access token
   * @param access_token - Google OAuth access token
   * @throws Error if Google authentication fails
   */
  const googleLogin = async (access_token: string): Promise<void> => {
    try {
      await api.post('/auth/google-login', {
        access_token,
        callback_url: window.location.origin,
      });
      await refreshUser();
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
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