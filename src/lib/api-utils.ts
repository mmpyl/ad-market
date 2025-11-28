import { AUTH_CODE } from '@/constants/auth';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * @throws Error si falta alguna variable requerida
 */
export function validateEnv(): void {
  const requiredEnvVars = [
    'POSTGREST_URL',
    'POSTGREST_SCHEMA',
    'POSTGREST_API_KEY',
    'JWT_SECRET',
    'SCHEMA_ADMIN_USER',
    'HASH_SALT_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

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

// ==================== Cookie Utilities ====================

interface CookieOptions {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
}

/**
 * Establece una cookie en la respuesta
 */
export function setCookie(
  response: Response,
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const {
    path = '/',
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'lax',
    maxAge
  } = options;

  const cookieParts = [
    `${name}=${value}`,
    `Path=${path}`,
    `SameSite=${sameSite}`
  ];

  if (httpOnly) {
    cookieParts.push('HttpOnly');
  }

  if (secure) {
    cookieParts.push('Secure');
  }

  if (maxAge !== undefined) {
    cookieParts.push(`Max-Age=${maxAge}`);
  }

  response.headers.append('Set-Cookie', cookieParts.join('; '));
}

/**
 * Elimina una cookie estableciendo su expiración en el pasado
 */
export function clearCookie(response: Response, name: string, path: string = '/'): void {
  const cookieParts = [
    `${name}=`,
    `Path=${path}`,
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=lax'
  ];

  response.headers.append('Set-Cookie', cookieParts.join('; '));
}

/**
 * Obtiene múltiples cookies del request
 */
export function getCookies(request: NextRequest, names: string[]): string[] {
  const cookies = request.headers.get('cookie') || '';
  
  return names.map(name => {
    const escapedName = name.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    const match = cookies.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  });
}

/**
 * Obtiene una cookie individual del request
 */
export function getCookie(request: NextRequest, name: string): string {
  return getCookies(request, [name])[0];
}

// ==================== Response Utilities ====================

/**
 * Crea una respuesta de redirección
 */
export function responseRedirect(url: string, redirectUrl?: string): NextResponse {
  return NextResponse.redirect(redirectUrl || url);
}

/**
 * Crea una respuesta JSON exitosa
 */
export function responseSuccess<T>(data: T, message?: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    } as ApiResponse<T>),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Crea una respuesta JSON de error
 */
export function responseError(
  status: number,
  errorMessage: string,
  errorCode?: string
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      errorMessage,
      errorCode,
    } as ApiResponse),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// ==================== Request Utilities ====================

interface QueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  id?: string;
  [key: string]: string | number | undefined;
}

/**
 * Parsea query parameters del request
 */
export function parseQueryParams(request: NextRequest): QueryParams {
  const url = new URL(request.url);
  const params: QueryParams = {};

  // Parámetros comunes
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');
  const search = url.searchParams.get('search');
  const id = url.searchParams.get('id');

  if (limit) params.limit = parseInt(limit, 10);
  if (offset) params.offset = parseInt(offset, 10);
  if (search) params.search = search;
  if (id) params.id = id;

  // Agregar todos los demás params
  url.searchParams.forEach((value, key) => {
    if (!['limit', 'offset', 'search', 'id'].includes(key)) {
      params[key] = value;
    }
  });

  return params;
}

/**
 * Valida y parsea el body del request
 */
export async function validateRequestBody<T = any>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new ApiError(400, 'Invalid JSON in request body', 'INVALID_JSON');
  }
}

/**
 * Obtiene la IP del request
 */
export function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return '127.0.0.1';
}

// ==================== Auth Middleware ====================

interface RequestContext {
  token?: string;
  payload?: any;
}

type RouteHandler = (
  request: NextRequest,
  context: RequestContext
) => Promise<Response>;

/**
 * Middleware para rutas de API con autenticación opcional
 */
export function requestMiddleware(
  handler: RouteHandler,
  requireAuth: boolean = true
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const context: RequestContext = {};

      if (requireAuth) {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return responseError(
            401,
            'Authorization token required',
            AUTH_CODE.TOKEN_MISSING
          );
        }

        const token = authHeader.substring(7);
        const { verifyToken } = await import('./auth');
        const verification = await verifyToken(token);

        if (!verification.valid) {
          return responseError(
            401,
            'Invalid or expired token',
            verification.code
          );
        }

        context.token = token;
        context.payload = verification.payload;
      }

      return await handler(request, context);
    } catch (error) {
      console.error('Request middleware error:', error);
      
      if (error instanceof ApiError) {
        return responseError(error.status, error.errorMessage, error.errorCode);
      }
      
      return responseError(500, 'Internal server error', 'INTERNAL_ERROR');
    }
  };
}

// ==================== Email Utilities ====================

/**
 * Envía email de verificación usando Resend
 */
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return false;
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.FROM_EMAIL || 'noreply@tu-dominio.com';

    const { data, error } = await resend.emails.send({
      from: `Sistema Minimarket <${fromEmail}>`,
      to: [email],
      subject: 'Código de Verificación - Sistema Minimarket',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Código de Verificación</h2>
          <p>Hola,</p>
          <p>Tu código de verificación para el Sistema Minimarket es:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 0.5em;">${code}</span>
          </div>
          <p style="color: #ef4444; font-weight: 500;">Este código expirará en 10 minutos.</p>
          <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Sistema de Gestión Minimarket<br>
            Todos los derechos reservados.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

// ==================== Client-side API (should be in separate file) ====================

// NOTA: Este código debería estar en un archivo separado (api-client.ts)
// ya que es código de cliente y no debería estar en utilities de servidor

export { ApiError };
export type { ApiResponse, CookieOptions, QueryParams, RequestContext };
