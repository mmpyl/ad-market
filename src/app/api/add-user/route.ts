import { NextRequest } from 'next/server';
import { requestMiddleware } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { hashString } from '@/lib/server-utils';
import { authCrudOperations } from '@/lib/auth';
import { userRegisterCallback } from '@/lib/user-register';

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email, password, role = 'vendedor' } = body;

    // -----------------------------
    // VALIDACIONES BÁSICAS
    ------------------------------
    if (!email || !password) {
      return createErrorResponse({
        errorMessage: 'Email and password are required',
        status: 400,
      });
    }

    // Validación simple de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse({
        errorMessage: 'Invalid email format',
        status: 400,
      });
    }

    const { usersCrud } = await authCrudOperations();

    // -----------------------------
    // VERIFICAR USUARIO EXISTENTE
    ------------------------------
    const existingUser = await usersCrud.findMany({
      where: { email }
    });

    if (existingUser?.length) {
      return createErrorResponse({
        errorMessage: 'User already exists',
        status: 409,
      });
    }

    // -----------------------------
    // CREAR USUARIO
    ------------------------------
    const hashedPassword = await hashString(password);

    const user = await usersCrud.create({
      email,
      password: hashedPassword
    });

    // -----------------------------
    // CREAR PERFIL / CALLBACK
    ------------------------------
    await userRegisterCallback({
      userId: user.id, // más explícito
      email: user.email,
      role,
    });

    return createSuccessResponse({
      data: {
        id: user.id,
        email: user.email,
        role,
      },
    });

  } catch (error: any) {
    console.error('Error creating user:', error);

    return createErrorResponse({
      errorMessage: 'Failed to create user',
      status: 500,
    });
  }
}, false);
