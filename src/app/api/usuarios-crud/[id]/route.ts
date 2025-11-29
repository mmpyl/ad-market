import CrudOperations from '@/lib/crud-operations';
import { usuarioSchema } from '@/lib/schemas';
import { requestMiddleware } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';

// -------------------------------------------------------------
// GET → Obtener usuario por ID
// -------------------------------------------------------------
export const GET = requestMiddleware(async (request, context) => {
  const { id } = context.params;

  const crud = new CrudOperations('usuarios', context.token);
  const usuario = await crud.findById(id);

  if (!usuario) {
    return createErrorResponse({
      status: 404,
      errorMessage: 'Usuario no encontrado',
    });
  }

  return createSuccessResponse(usuario);
}, true);

// -------------------------------------------------------------
// PUT → Actualizar usuario
// -------------------------------------------------------------
export const PUT = requestMiddleware(async (request, context) => {
  const { id } = context.params;

  const body = await request.json();

  // Validación parcial
  const validatedData = usuarioSchema.partial().parse(body);

  const crud = new CrudOperations('usuarios', context.token);

  // Verificar existencia
  const existing = await crud.findById(id);
  if (!existing) {
    return createErrorResponse({
      status: 404,
      errorMessage: 'Usuario no encontrado',
    });
  }

  const usuarioActualizado = await crud.update(id, validatedData);

  return createSuccessResponse({
    message: 'Usuario actualizado',
    data: usuarioActualizado,
  });
}, true);

// -------------------------------------------------------------
// DELETE → Soft delete (recomendado)
// -------------------------------------------------------------
export const DELETE = requestMiddleware(async (request, context) => {
  const { id } = context.params;

  const crud = new CrudOperations('usuarios', context.token);

  const existing = await crud.findById(id);
  if (!existing) {
    return createErrorResponse({
      status: 404,
      errorMessage: 'Usuario no encontrado',
    });
  }

  // Soft delete → activo = false
  const usuarioEliminado = await crud.update(id, { activo: false });

  return createSuccessResponse({
    message: 'Usuario desactivado',
    data: usuarioEliminado,
  });
}, true);
