/**
 * Development test users configuration
 * 
 * ⚠️ ADVERTENCIA IMPORTANTE:
 * - Este archivo SOLO debe usarse en desarrollo
 * - En producción, todos los usuarios deben venir de la base de datos
 * - Las funciones retornan arrays vacíos si NODE_ENV !== 'development'
 * 
 * @module dev-users
 */

// ==================== Types ====================

interface DevUser {
  email: string;
  password: string;
  rol_sistema: 'administrador' | 'vendedor' | 'almacenero' | 'auditor';
  nombre?: string;
  descripcion?: string;
}

type RolSistema = DevUser['rol_sistema'];

// ==================== Configuration ====================

/**
 * Usuarios de prueba para desarrollo
 * Configurables vía variables de entorno
 */
const DEV_USERS: ReadonlyArray<DevUser> = [
  {
    email: process.env.DEV_USER_ADMIN || 'admin@adminmarket.com',
    password: process.env.DEV_PASSWORD_ADMIN || 'admin123',
    rol_sistema: 'administrador',
    nombre: 'Admin Usuario',
    descripcion: 'Cuenta de administrador para testing',
  },
  {
    email: process.env.DEV_USER_VENDEDOR || 'vendedor@adminmarket.com',
    password: process.env.DEV_PASSWORD_VENDEDOR || 'vendedor123',
    rol_sistema: 'vendedor',
    nombre: 'Vendedor Usuario',
    descripcion: 'Cuenta de vendedor para testing',
  },
  {
    email: process.env.DEV_USER_ALMACEN || 'almacen@adminmarket.com',
    password: process.env.DEV_PASSWORD_ALMACEN || 'almacen123',
    rol_sistema: 'almacenero',
    nombre: 'Almacén Usuario',
    descripcion: 'Cuenta de almacenero para testing',
  },
  {
    email: process.env.DEV_USER_AUDITOR || 'auditor@adminmarket.com',
    password: process.env.DEV_PASSWORD_AUDITOR || 'auditor123',
    rol_sistema: 'auditor',
    nombre: 'Auditor Usuario',
    descripcion: 'Cuenta de auditor para testing',
  },
] as const;

// ==================== Helper Functions ====================

/**
 * Verifica si estamos en ambiente de desarrollo
 * @returns true si NODE_ENV es 'development'
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Log de advertencia si se intenta usar dev users en producción
 */
function warnProductionUsage(): void {
  console.warn(
    '[SECURITY WARNING] Dev users should only be used in development environment. ' +
    'Current NODE_ENV: ' + (process.env.NODE_ENV || 'undefined')
  );
}

// ==================== Public API ====================

/**
 * Obtiene la lista de usuarios de desarrollo
 * 
 * @returns Array de usuarios de desarrollo (vacío si no es development)
 * 
 * @example
 * const users = getDevUsers();
 * console.log(`Available test users: ${users.length}`);
 */
export function getDevUsers(): DevUser[] {
  if (!isDevelopment()) {
    warnProductionUsage();
    return [];
  }

  // Retornar copia para evitar mutaciones
  return DEV_USERS.map(user => ({ ...user }));
}

/**
 * Valida si un email corresponde a un usuario de desarrollo
 * 
 * @param email - Email a validar
 * @returns true si el email existe en los usuarios de desarrollo
 * 
 * @example
 * if (validateDevUserExists('admin@adminmarket.com')) {
 *   console.log('Valid dev user');
 * }
 */
export function validateDevUserExists(email: string): boolean {
  if (!isDevelopment()) {
    return false;
  }

  if (!email || typeof email !== 'string') {
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();
  return DEV_USERS.some(user => 
    user.email.toLowerCase().trim() === normalizedEmail
  );
}

/**
 * Obtiene un usuario de desarrollo por su email
 * 
 * @param email - Email del usuario a buscar
 * @returns Usuario encontrado o null
 * 
 * @example
 * const admin = getDevUserByEmail('admin@adminmarket.com');
 * if (admin) {
 *   console.log(`Role: ${admin.rol_sistema}`);
 * }
 */
export function getDevUserByEmail(email: string): DevUser | null {
  if (!isDevelopment()) {
    return null;
  }

  if (!email || typeof email !== 'string') {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = DEV_USERS.find(user => 
    user.email.toLowerCase().trim() === normalizedEmail
  );

  // Retornar copia para evitar mutaciones
  return user ? { ...user } : null;
}

/**
 * Obtiene un usuario de desarrollo por su rol
 * 
 * @param rol - Rol del sistema a buscar
 * @returns Usuario encontrado o null
 * 
 * @example
 * const vendedor = getDevUserByRole('vendedor');
 * if (vendedor) {
 *   console.log(`Email: ${vendedor.email}`);
 * }
 */
export function getDevUserByRole(rol: RolSistema): DevUser | null {
  if (!isDevelopment()) {
    return null;
  }

  const user = DEV_USERS.find(user => user.rol_sistema === rol);
  
  // Retornar copia para evitar mutaciones
  return user ? { ...user } : null;
}

/**
 * Valida las credenciales de un usuario de desarrollo
 * 
 * @param email - Email del usuario
 * @param password - Contraseña a validar
 * @returns Usuario si las credenciales son válidas, null si no
 * 
 * @example
 * const user = validateDevCredentials('admin@adminmarket.com', 'admin123');
 * if (user) {
 *   console.log('Login successful:', user.rol_sistema);
 * }
 */
export function validateDevCredentials(
  email: string,
  password: string
): DevUser | null {
  if (!isDevelopment()) {
    return null;
  }

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = DEV_USERS.find(user => 
    user.email.toLowerCase().trim() === normalizedEmail &&
    user.password === password
  );

  // Retornar copia para evitar mutaciones
  return user ? { ...user } : null;
}

/**
 * Obtiene todos los roles disponibles en usuarios de desarrollo
 * 
 * @returns Array de roles únicos
 * 
 * @example
 * const roles = getAvailableDevRoles();
 * console.log('Available roles:', roles);
 */
export function getAvailableDevRoles(): RolSistema[] {
  if (!isDevelopment()) {
    return [];
  }

  return DEV_USERS.map(user => user.rol_sistema);
}

/**
 * Imprime información de usuarios de desarrollo en consola
 * Útil para recordar credenciales durante desarrollo
 * 
 * @example
 * printDevUsersInfo();
 * // Output:
 * // === Available Development Users ===
 * // Admin: admin@adminmarket.com / admin123
 * // ...
 */
export function printDevUsersInfo(): void {
  if (!isDevelopment()) {
    console.log('Dev users info only available in development environment');
    return;
  }

  console.log('\n=== Available Development Users ===');
  DEV_USERS.forEach(user => {
    console.log(
      `${user.nombre || user.rol_sistema}: ${user.email} / ${user.password}` +
      (user.descripcion ? ` (${user.descripcion})` : '')
    );
  });
  console.log('===================================\n');
}

// ==================== Exports ====================

export type { DevUser, RolSistema };
