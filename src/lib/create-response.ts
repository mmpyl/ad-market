import { NextResponse } from 'next/server';

// ==================== Types ====================

interface SuccessResponseData<T> {
  data: T;
  message?: string;
}

interface ErrorResponseData {
  errorMessage: string;
  status: number;
  errorCode?: string;
}

interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  user?: any;
}

interface CookieOptions {
  maxAge?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}

// ==================== Constants ====================

const DEFAULT_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

const ACCESS_TOKEN_MAX_AGE = 86400; // 24 horas
const REFRESH_TOKEN_MAX_AGE = 604800; // 7 días

// ==================== Cookie Helpers ====================

/**
 * Crea un string de cookie con las opciones especificadas
 */
function createCookieString(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const {
    maxAge,
    secure = DEFAULT_COOKIE_OPTIONS.secure,
    sameSite = DEFAULT_COOKIE_OPTIONS.sameSite,
    path = DEFAULT_COOKIE_OPTIONS.path,
  } = options;

  const cookieParts = [
    `${name}=${value}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];

  if (DEFAULT_COOKIE_OPTIONS.httpOnly) {
    cookieParts.push('HttpOnly');
  }

  if (secure) {
    cookieParts.push('Secure');
  }

  if (maxAge !== undefined) {
    cookieParts.push(`Max-Age=${maxAge}`);
  }

  return cookieParts.join('; ');
}

/**
 * Crea un string de cookie para eliminar (expirada)
 */
function createExpiredCookieString(name: string, path: string = '/'): string {
  return `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax`;
}

// ==================== Response Creators ====================

/**
 * Crea una respuesta JSON exitosa
 * 
 * @param data - Objeto con data y mensaje opcional
 * @param status - Código de estado HTTP (default: 200)
 * @returns NextResponse con success: true
 */
export function createSuccessResponse<T = any>(
  data: SuccessResponseData<T>,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data: data.data,
      message: data.message,
    },
    { status }
  );
}

/**
 * Crea una respuesta JSON de error
 * 
 * @param data - Objeto con errorMessage, status y errorCode opcional
 * @returns NextResponse con success: false
 */
export function createErrorResponse(data: ErrorResponseData): NextResponse {
  return NextResponse.json(
    {
      success: false,
      errorMessage: data.errorMessage,
      errorCode: data.errorCode,
    },
    { status: data.status }
  );
}

/**
 * Crea una respuesta de autenticación exitosa con tokens en cookies
 * 
 * IMPORTANTE: Esta función tiene una limitación - solo puede establecer una cookie
 * debido a que headers.set() sobrescribe la cookie anterior.
 * 
 * Para solucionar esto, se recomienda usar NextResponse.json() con headers
 * que soporten múltiples Set-Cookie.
 * 
 * @param data - Objeto con accessToken, refreshToken y user opcional
 * @returns Response con tokens en cookies HTTP-only
 */
export function createAuthResponse(data: AuthResponseData): Response {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  // Agregar cookies usando append para permitir múltiples Set-Cookie
  headers.append(
    'Set-Cookie',
    createCookieString('access_token', data.accessToken, {
      maxAge: ACCESS_TOKEN_MAX_AGE,
    })
  );

  headers.append(
    'Set-Cookie',
    createCookieString('refresh_token', data.refreshToken, {
      maxAge: REFRESH_TOKEN_MAX_AGE,
    })
  );

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    }),
    {
      status: 200,
      headers,
    }
  );
}

/**
 * Crea una respuesta de autenticación usando NextResponse
 * Esta es la versión recomendada que maneja correctamente múltiples cookies
 * 
 * @param data - Objeto con accessToken, refreshToken y user opcional
 * @returns NextResponse con tokens en cookies HTTP-only
 */
export function createAuthResponseNext(data: AuthResponseData): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    },
    { status: 200 }
  );

  // NextResponse maneja correctamente múltiples cookies
  response.cookies.set('access_token', data.accessToken, {
    httpOnly: true,
    secure: DEFAULT_COOKIE_OPTIONS.secure,
    sameSite: DEFAULT_COOKIE_OPTIONS.sameSite,
    path: DEFAULT_COOKIE_OPTIONS.path,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  response.cookies.set('refresh_token', data.refreshToken, {
    httpOnly: true,
    secure: DEFAULT_COOKIE_OPTIONS.secure,
    sameSite: DEFAULT_COOKIE_OPTIONS.sameSite,
    path: DEFAULT_COOKIE_OPTIONS.path,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return response;
}

/**
 * Crea una respuesta de logout que elimina las cookies de autenticación
 * 
 * @returns Response con cookies expiradas
 */
export function createLogoutResponse(): Response {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  // Eliminar ambas cookies
  headers.append('Set-Cookie', createExpiredCookieString('access_token'));
  headers.append('Set-Cookie', createExpiredCookieString('refresh_token'));

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Logged out successfully',
    }),
    {
      status: 200,
      headers,
    }
  );
}

/**
 * Versión NextResponse del logout
 * Recomendada por mejor manejo de cookies
 * 
 * @returns NextResponse con cookies eliminadas
 */
export function createLogoutResponseNext(): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      message: 'Logged out successfully',
    },
    { status: 200 }
  );

  // Eliminar cookies usando NextResponse
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');

  return response;
}

/**
 * Crea una respuesta de redirección con cookies eliminadas
 * Útil para logout que redirige al login
 * 
 * @param redirectUrl - URL de destino
 * @returns NextResponse de redirección
 */
export function createLogoutRedirectResponse(redirectUrl: string = '/login'): NextResponse {
  const response = NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));

  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');

  return response;
}

// ==================== Exports ====================

export type {
  SuccessResponseData,
  ErrorResponseData,
  AuthResponseData,
  CookieOptions,
};
