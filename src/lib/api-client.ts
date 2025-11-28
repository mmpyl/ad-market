import { AUTH_CODE } from '@/constants/auth';

/**
 * Standard API response structure for all API endpoints
 * @template T - The type of data returned in successful responses
 */
interface ApiResponse<T = any> {
  /** Indicates if the API call was successful */
  success: boolean;
  /** The response data (only present when success is true) */
  data?: T;
  /** Optional success message */
  message?: string;
  /** Error message (only present when success is false) */
  errorMessage?: string;
  /** Error code for programmatic error handling */
  errorCode?: string;
}

/**
 * Custom error class for API-related errors
 * Extends the built-in Error class with HTTP status and error code information
 */
class ApiError extends Error {
  /** HTTP status code of the error */
  public status: number;
  /** Human-readable error message */
  public errorMessage: string;
  /** Optional error code for programmatic handling */
  public errorCode?: string;

  /**
   * Creates a new ApiError instance
   * @param status - HTTP status code
   * @param errorMessage - Human-readable error message
   * @param errorCode - Optional error code for programmatic handling
   */
  constructor(status: number, errorMessage: string, errorCode?: string) {
    super(errorMessage);
    this.name = 'ApiError';
    this.status = status;
    this.errorMessage = errorMessage;
    this.errorCode = errorCode;
  }
}

/** Flag to prevent multiple simultaneous token refresh attempts */
let isRefreshing = false;
/** Promise that resolves when token refresh is complete */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to refresh the authentication token
 * @returns Promise<boolean> - True if refresh was successful, false otherwise
 */
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/next-api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const result: ApiResponse = await response.json();

    if (result.success) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Redirects the user to the login page with the current path as a redirect parameter
 * Only works in browser environment (client-side)
 */
function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if(currentPath === '/login' || currentPath === '/login/') {
      return;
    }
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }
}

/**
 * Core API request function with automatic token refresh and error handling
 * @template T - The expected return type of the API response data
 * @param endpoint - API endpoint path (will be prefixed with '/next-api')
 * @param options - Fetch API options (headers, method, etc.)
 * @param isRetry - Internal flag to prevent infinite retry loops during token refresh
 * @returns Promise<T> - Resolves with the response data or rejects with ApiError
 */
async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
  isRetry = false
): Promise<T> {
  try {
    const response = await fetch(`/next-api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const result: ApiResponse<T> = await response.json();

    if (result.errorCode === AUTH_CODE.TOKEN_MISSING) {
      redirectToLogin();
      throw new ApiError(401, result.errorMessage || 'Token missing');
    }

    if (response.status === 401 && 
        result.errorCode === AUTH_CODE.TOKEN_EXPIRED && 
        !isRetry) {
      
      if (isRefreshing && refreshPromise) {
        const refreshSuccess = await refreshPromise;
        if (refreshSuccess) {
          return apiRequest<T>(endpoint, options, true);
        } else {
          redirectToLogin();
          throw new ApiError(401, 'Session expired');
        }
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshToken();
        
        try {
          const refreshSuccess = await refreshPromise;
          
          if (refreshSuccess) {
            return apiRequest<T>(endpoint, options, true);
          } else {
            redirectToLogin();
            throw new ApiError(401, 'Failed to refresh token');
          }
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }
    }

    if(!response.ok || !result.success) {
      throw new ApiError(response.status, result.errorMessage || 'API Error', result.errorCode);
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error or invalid response');
  }
}

/**
 * Centralized API client with automatic authentication handling
 * Provides HTTP methods (GET, POST, PUT, DELETE) with built-in token refresh
 */
export const api = {
  /**
   * Performs a GET request to the specified endpoint
   * @template T - Expected response data type
   * @param endpoint - API endpoint path (without '/next-api' prefix)
   * @param params - Optional query parameters as key-value pairs
   * @returns Promise<T> - Resolves with response data or rejects with ApiError
   */
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: 'GET' });
  },

  /**
   * Performs a POST request to the specified endpoint
   * @template T - Expected response data type
   * @param endpoint - API endpoint path (without '/next-api' prefix)
   * @param data - Request body data to be JSON serialized
   * @returns Promise<T> - Resolves with response data or rejects with ApiError
   */
  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * Performs a PUT request to the specified endpoint
   * @template T - Expected response data type
   * @param endpoint - API endpoint path (without '/next-api' prefix)
   * @param data - Request body data to be JSON serialized
   * @returns Promise<T> - Resolves with response data or rejects with ApiError
   */
  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * Performs a DELETE request to the specified endpoint
   * @template T - Expected response data type
   * @param endpoint - API endpoint path (without '/next-api' prefix)
   * @returns Promise<T> - Resolves with response data or rejects with ApiError
   */
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
export type { ApiResponse }; 