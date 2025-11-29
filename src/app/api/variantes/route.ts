import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';

// -------------------------------------------------------------
// GET → obtener variante por ID
// -------------------------------------------------------------
export const GET = requestMiddleware(async (request, context) => {
  const { id } = context.params;

  const variantesCrud = new CrudOperations('producto_variantes', context.token);
  const variante = await variantesCrud.findById(id);

  if (!variante) {
    return createErrorResponse({
      errorMessage: 'Variante no encontrada',
      status: 404,
    });
  }

  return createSuccessResponse(variante);
}, true);

// -------------------------------------------------------------
// PUT → actualizar variante
// -------------------------------------------------------------
export const PUT = requestMiddleware(async (request, context) => {
  const { id } = context.params;
  const body = await validateRequestBody(request);

  const variantesCrud = new CrudOperations('producto_variantes', context.token);

  const existing = await variantesCrud.findById(id);
  if (!existing) {
    return createErrorResponse({
      errorMessage: 'Variante no encontrada',
      status: 404,
    });
  }

  const updated = await variantesCrud.update(id, body);
  return createSuccessResponse(updated);
}, true);

// -------------------------------------------------------------
// DELETE → soft delete recomendado
// -------------------------------------------------------------
export const DELETE = requestMiddleware(async (request, context) => {
  const { id } = context.params;

  const variantesCrud = new CrudOperations('producto_variantes', context.token);
  const existing = await variantesCrud.findById(id);

  if (!existing) {
    return createErrorResponse({
      errorMessage: 'Variante no encontrada',
      status: 404,
    });
  }

  // Soft delete → activo = false
  const deleted = await variantesCrud.update(id, { activo: false });

  return createSuccessResponse({
    message: 'Variante eliminada',
    data: deleted,
  });
}, true);
