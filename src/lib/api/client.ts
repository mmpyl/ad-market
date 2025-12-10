import { AUTH_CODE } from '@/constants/auth';

// ==================== Types ====================

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public errorMessage: string,
    public errorCode?: string
  ) {
    super(errorMessage);
    this.name = 'ApiError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// ==================== Refresh Token State ====================

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Intenta refrescar el token de autenticación
 * @returns Promise<boolean> - true si el refresh fue exitoso
 */
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', { // ✅ Cambiado a /api
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const result: ApiResponse = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

/**
 * Redirige al usuario a la página de login
 * Preserva la ruta actual para redirección post-login
 */
function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const currentPath = window.location.pathname;
  
  if (currentPath === '/login' || currentPath === '/login/') {
    return;
  }

  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
  window.location.href = loginUrl;
}

/**
 * Realiza una petición HTTP a la API con manejo automático de refresh token
 * @param endpoint - Ruta del endpoint (sin /api)
 * @param options - Opciones de fetch
 * @param isRetry - Indica si es un reintento después de refresh
 * @returns Promise<T> - Datos de respuesta tipados
 */
async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
  isRetry = false
): Promise<T> {
  try {
    console.log('[API Client] Request:', options?.method || 'GET', endpoint); // ✅ Debug log

    // Obtener el token de las cookies para incluirlo en el header Authorization
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return '';
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
      return '';
    };

    const accessToken = getCookie('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`/api${endpoint}`, { // ✅ Cambiado a /api
      headers,
      credentials: 'include',
      ...options,
    });

    console.log('[API Client] Response status:', response.status); // ✅ Debug log

    const result: ApiResponse<T> = await response.json();
    console.log('[API Client] Response data:', result); // ✅ Debug log

    // Token faltante - redirigir inmediatamente
    if (result.errorCode === AUTH_CODE.TOKEN_MISSING) {
      redirectToLogin();
      throw new ApiError(401, result.errorMessage || 'Token missing', result.errorCode);
    }

    // Token expirado - intentar refresh
    if (
      response.status === 401 &&
      result.errorCode === AUTH_CODE.TOKEN_EXPIRED &&
      !isRetry
    ) {
      // Si ya hay un refresh en proceso, esperar a que termine
      if (isRefreshing && refreshPromise) {
        const refreshSuccess = await refreshPromise;
        
        if (refreshSuccess) {
          return apiRequest<T>(endpoint, options, true);
        } else {
          redirectToLogin();
          throw new ApiError(401, 'Session expired', result.errorCode);
        }
      }

      // Iniciar nuevo proceso de refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshToken();

        try {
          const refreshSuccess = await refreshPromise;

          if (refreshSuccess) {
            return apiRequest<T>(endpoint, options, true);
          } else {
            redirectToLogin();
            throw new ApiError(401, 'Failed to refresh token', result.errorCode);
          }
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }
    }

    // Error de respuesta
    if (!response.ok || !result.success) {
      throw new ApiError(
        response.status,
        result.errorMessage || 'API Error',
        result.errorCode
      );
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('API request error:', error);
    throw new ApiError(500, 'Network error or invalid response');
  }
}

// ==================== API Client ====================

/**
 * Cliente API con métodos HTTP
 */
export const api = {
  /**
   * Petición GET
   * @param endpoint - Ruta del endpoint
   * @param params - Query parameters opcionales
   */
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: 'GET' });
  },

  /**
   * Petición POST
   * @param endpoint - Ruta del endpoint
   * @param data - Datos a enviar en el body
   */
  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * Petición PUT
   * @param endpoint - Ruta del endpoint
   * @param data - Datos a actualizar
   */
  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * Petición PATCH
   * @param endpoint - Ruta del endpoint
   * @param data - Datos a actualizar parcialmente
   */
  patch: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * Petición DELETE
   * @param endpoint - Ruta del endpoint
   */
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// ==================== Exports ====================

export { ApiError };
export type { ApiResponse };