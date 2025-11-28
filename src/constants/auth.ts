/**
 * Authentication constants
 * Códigos de error y configuración de autenticación
 */

// ==================== Error Codes ====================

export const AUTH_CODE = {
  SUCCESS: 'SUCCESS',
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_PASSCODE: 'INVALID_PASSCODE',
  PASSCODE_EXPIRED: 'PASSCODE_EXPIRED',
} as const;

export type AuthCode = typeof AUTH_CODE[keyof typeof AUTH_CODE];

// ==================== Token Configuration ====================

/**
 * Access token expiration time in seconds (15 minutes)
 */
export const ACCESS_TOKEN_EXPIRE_TIME = 900;

/**
 * Refresh token expiration time in seconds (7 days)
 */
export const REFRESH_TOKEN_EXPIRE_TIME = 604800;

/**
 * Admin token expiration time in seconds (24 hours)
 * Used for system operations
 */
export const DURATION_EXPIRE_TIME = 86400;

/**
 * Cache duration in seconds (1 hour)
 * For caching CRUD operations and other data
 */
export const CACHE_DURATION = 3600;

// ==================== Session Configuration ====================

/**
 * Session cookie name
 */
export const SESSION_COOKIE_NAME = 'session_token';

/**
 * Refresh token cookie name
 */
export const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * Max login attempts before lockout
 */
export const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Account lockout duration in seconds (30 minutes)
 */
export const LOCKOUT_DURATION = 1800;

// ==================== Passcode Configuration ====================

/**
 * Passcode expiration time in seconds (10 minutes)
 */
export const PASSCODE_EXPIRE_TIME = 600;

/**
 * Passcode length
 */
export const PASSCODE_LENGTH = 6;

// ==================== Password Requirements ====================

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
} as const;

// ==================== OAuth Configuration ====================

export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  GITHUB: 'github',
} as const;

export type OAuthProvider = typeof OAUTH_PROVIDERS[keyof typeof OAUTH_PROVIDERS];

// ==================== Helper Functions ====================

/**
 * Valida si un código de error es de autenticación
 */
export function isAuthError(code: string): boolean {
  return Object.values(AUTH_CODE).includes(code as AuthCode);
}

/**
 * Valida si un error requiere re-login
 */
export function requiresReLogin(code: string): boolean {
  return [
    AUTH_CODE.TOKEN_MISSING,
    AUTH_CODE.TOKEN_INVALID,
    AUTH_CODE.INVALID_CREDENTIALS,
  ].includes(code as AuthCode);
}

/**
 * Valida si un error puede resolverse con refresh token
 */
export function canRefreshToken(code: string): boolean {
  return code === AUTH_CODE.TOKEN_EXPIRED;
}