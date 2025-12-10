import { SignJWT, jwtVerify } from "jose";
import { AUTH_CODE, DURATION_EXPIRE_TIME, ACCESS_TOKEN_EXPIRE_TIME, CACHE_DURATION } from "@/constants/auth";
import { User } from "@/types/auth";
import CrudOperations from '@/lib/crud-operations';

// ==================== Types ====================

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

interface CachedAuthCrud {
  usersCrud: CrudOperations;
  sessionsCrud: CrudOperations;
  refreshTokensCrud: CrudOperations;
  userPasscodeCrud: CrudOperations;
  createdAt: number;
}

interface TokenVerificationResult {
  valid: boolean;
  code: string;
  payload: JWTPayload | null;
}

// ==================== Configuration ====================

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Validar que JWT_SECRET exista
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// ==================== Cache ====================

let cachedAuthCrud: CachedAuthCrud | null = null;

/**
 * Obtiene instancias CRUD para operaciones de autenticación del sistema
 * Las instancias se cachean para mejor rendimiento
 * 
 * IMPORTANTE: Este método solo debe usarse para operaciones de autenticación del sistema.
 * Para operaciones CRUD normales, crear instancias propias de CrudOperations.
 * 
 * @returns Objeto con instancias CRUD para users, sessions, refresh_tokens y user_passcode
 */
export async function authCrudOperations(): Promise<{
  usersCrud: CrudOperations;
  sessionsCrud: CrudOperations;
  refreshTokensCrud: CrudOperations;
  userPasscodeCrud: CrudOperations;
}> {
  const now = Date.now();
  const cacheExpired = !cachedAuthCrud || now - cachedAuthCrud.createdAt > CACHE_DURATION * 1000;

  if (cacheExpired) {
    const adminUserToken = await generateAdminUserToken();
    
    cachedAuthCrud = {
      usersCrud: new CrudOperations("users", adminUserToken),
      sessionsCrud: new CrudOperations("sessions", adminUserToken),
      refreshTokensCrud: new CrudOperations("refresh_tokens", adminUserToken),
      userPasscodeCrud: new CrudOperations("user_passcode", adminUserToken),
      createdAt: now,
    };
  }

  return cachedAuthCrud;
}

/**
 * Limpia el cache de CRUD operations
 * Útil para testing o cuando se necesita forzar regeneración
 */
export function clearAuthCrudCache(): void {
  cachedAuthCrud = null;
}

// ==================== Token Generation ====================

/**
 * Genera un token de administrador del sistema
 * Usado internamente para operaciones CRUD del sistema de autenticación
 * 
 * @returns Token JWT de administrador con máxima duración
 */
export async function generateAdminUserToken(): Promise<string> {
  const adminRole = process.env.SCHEMA_ADMIN_USER;
  
  if (!adminRole) {
    throw new Error('SCHEMA_ADMIN_USER environment variable is required');
  }

  const adminUserToken = await generateToken(
    {
      sub: "",
      email: "",
      role: adminRole,
    },
    DURATION_EXPIRE_TIME
  );

  return adminUserToken;
}

/**
 * Genera un token JWT para un usuario
 * 
 * @param user - Datos del usuario (sin isAdmin, se calcula automáticamente)
 * @param expiresIn - Tiempo de expiración en segundos (default: ACCESS_TOKEN_EXPIRE_TIME)
 * @returns Token JWT firmado
 */
export async function generateToken(
  user: Omit<User, "isAdmin">,
  expiresIn: number = ACCESS_TOKEN_EXPIRE_TIME
): Promise<string> {
  const adminRole = process.env.SCHEMA_ADMIN_USER;

  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    sub: user.sub.toString(),
    email: user.email,
    role: user.role,
    isAdmin: user.role === adminRole,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(JWT_SECRET);

  return token;
}

// ==================== Token Verification ====================

/**
 * Verifica la validez de un token JWT
 * 
 * @param token - Token JWT a verificar
 * @returns Objeto con estado de validación, código y payload
 * 
 * Códigos posibles:
 * - SUCCESS: Token válido
 * - TOKEN_MISSING: Token no proporcionado
 * - TOKEN_EXPIRED: Token expirado (puede renovarse)
 * - TOKEN_INVALID: Token inválido (requiere re-login)
 */
export async function verifyToken(
  token?: string | null
): Promise<TokenVerificationResult> {
  // Validar que el token existe
  if (!token) {
    return {
      valid: false,
      code: AUTH_CODE.TOKEN_MISSING,
      payload: null,
    };
  }

  // Limpiar el token: remover espacios y el prefijo "Bearer " si existe
  let cleanToken = token.trim();
  if (cleanToken.startsWith('Bearer ')) {
    cleanToken = cleanToken.substring(7).trim();
  }

  // Validar formato básico del JWT (debe tener 3 partes separadas por puntos)
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    console.error('Token verification error: Invalid JWT format - expected 3 parts, got', parts.length);
    return {
      valid: false,
      code: AUTH_CODE.TOKEN_INVALID,
      payload: null,
    };
  }

  // Validar que ninguna parte esté vacía
  if (parts.some(part => !part || part.trim() === '')) {
    console.error('Token verification error: JWT has empty parts');
    return {
      valid: false,
      code: AUTH_CODE.TOKEN_INVALID,
      payload: null,
    };
  }

  try {
    const { payload } = await jwtVerify(cleanToken, JWT_SECRET);

    return {
      valid: true,
      code: AUTH_CODE.SUCCESS,
      payload: payload as unknown as JWTPayload,
    };
  } catch (error: any) {
    // Token expirado - el cliente puede intentar renovar
    if (error.code === "ERR_JWT_EXPIRED") {
      return {
        valid: false,
        code: AUTH_CODE.TOKEN_EXPIRED,
        payload: null,
      };
    }

    // Registrar el error específico para debugging
    console.error('Token verification error:', {
      name: error.name,
      code: error.code,
      message: error.message,
      tokenLength: cleanToken.length,
      tokenParts: parts.length,
    });

    // Firma inválida u otro error - requiere re-login
    return {
      valid: false,
      code: AUTH_CODE.TOKEN_INVALID,
      payload: null,
    };
  }
}

/**
 * Verifica si un token es de administrador
 * 
 * @param token - Token JWT a verificar
 * @returns true si el token pertenece a un administrador
 */
export async function isAdminToken(token: string): Promise<boolean> {
  const result = await verifyToken(token);
  return result.valid && result.payload?.isAdmin === true;
}

/**
 * Extrae el payload de un token sin verificar su validez
 * ADVERTENCIA: Solo usar para debugging o logging, no para autorización
 * 
 * @param token - Token JWT
 * @returns Payload decodificado o null si falla
 */
export function decodeTokenUnsafe(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// ==================== Exports ====================

export type { TokenVerificationResult, CachedAuthCrud };
