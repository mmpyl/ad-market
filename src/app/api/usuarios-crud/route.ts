import { NextRequest } from 'next/server';
import CrudOperations from '@/lib/crud-operations';
import { usuarioSchema } from '@/lib/schemas';
import { requestMiddleware, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';

// -------------------------------------------------------------
// GET → Listar usuarios con paginación real
// -------------------------------------------------------------
export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset, search } = parseQueryParams(request);

  const crud = new CrudOperations('usuarios', context.token);

  const filters: any = {};

  // Búsqueda opcional
  if (search) {
    filters.nombre = { operator: 'ilike', value: `%${search}%` };
  }

  // Obtener registros
  const usuarios = await crud.findMany(filters, {
    limit,
    offset,
    orderBy: { column: 'created_at', direction: 'desc' },
  });

  // Total real (sin limit/offset)
  const total = await crud.count(filters);

  return createSuccessResponse({
    data: usuarios,
    pagination: { limit, offset, total }
  });
}, true);

// -------------------------------------------------------------
// POST → Crear usuario validado con Zod
// -------------------------------------------------------------
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await request.json();

    // Validación con Zod
    const validatedData = usuarioSchema.parse(body);

    const crud = new CrudOperations('usuarios', context.token);
    const usuario = await crud.create(validatedData);

    return createSuccessResponse(
      { message: 'Usuario creado correctamente', data: usuario },
      201
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return createErrorResponse({
        status: 400,
        errorMessage: 'La validación falló',
        errors: error.errors,
      });
    }

    return createErrorResponse({
      status: 500,
      errorMessage: error.message || 'Error interno del servidor',
    });
  }
}, true);
