import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { decodeAccessToken } from '@/lib/jwt-utils'; // lo explicaré abajo

export const runtime = 'edge';

// Habilita/deshabilita modo dev para mock
const DEV_MODE = true;

// Mock users
const MOCK_USERS = {
  'admin@adminmarket.com':   { id: 1, email: 'admin@adminmarket.com', rol_sistema: 'administrador' },
  'vendedor@adminmarket.com': { id: 2, email: 'vendedor@adminmarket.com', rol_sistema: 'vendedor' },
  'almacen@adminmarket.com':  { id: 3, email: 'almacen@adminmarket.com', rol_sistema: 'almacenero' },
  'auditor@adminmarket.com':  { id: 4, email: 'auditor@adminmarket.com', rol_sistema: 'auditor' },
};

export const GET = async (request: NextRequest) => {
  try {
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
      return createErrorResponse({
        errorMessage: 'No authentication token',
        status: 401,
      });
    }

    /**
     * ================================================
     * 🔧 MODO DESARROLLO CON MOCKS
     * ================================================
     */
    if (DEV_MODE) {
      const emailMatch = Object.keys(MOCK_USERS).find(email => token.includes(email));
      if (emailMatch) {
        return createSuccessResponse(MOCK_USERS[emailMatch]);
      }
    }

    /**
     * ================================================
     * 🔐 DECODIFICAR TOKEN REAL
     * ================================================
     */
    let payload: any = null;

    try {
      payload = await decodeAccessToken(token); 
    } catch (err) {
      console.error('Token decode failed:', err);
      return createErrorResponse({
        errorMessage: 'Invalid or expired token',
        status: 401,
      });
    }

    if (!payload || !payload.sub) {
      return createErrorResponse({
        errorMessage: 'Invalid token payload',
        status: 401,
      });
    }

    /**
     * ================================================
     * 🧠 ESTRUCTURA DE RETORNO REAL
     * ================================================
     */
    const user = {
      id: payload.sub,
      email: payload.email,
      rol_sistema: payload.rol_sistema ?? 'usuario',
      permisos: payload.permisos ?? [],
      nombre: payload.nombre ?? null,
    };

    return createSuccessResponse(user);

  } catch (error) {
    console.error('Error in auth/user:', error);

    return createErrorResponse({
      errorMessage: 'Failed to obtain user information',
      status: 500,
    });
  }
};
