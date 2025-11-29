import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';

// ==========================================================
//                   GET /inventario
// ==========================================================
export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset } = parseQueryParams(request);

  const inventarioCrud = new CrudOperations('inventario', context.token);

  const data = await inventarioCrud.findMany(
    {},
    { limit, offset, orderBy: { created_at: 'desc' } }
  );

  return createSuccessResponse(data);
}, true);

// ==========================================================
//                   POST /inventario
// ==========================================================
export const POST = requestMiddleware(async (request, context) => {
  const body = await validateRequestBody(request);

  if (!body.producto_id) {
    return createErrorResponse({
      status: 400,
      errorMessage: 'El ID del producto es requerido',
    });
  }

  const inventarioCrud = new CrudOperations('inventario', context.token);

  // ----------- Validación avanzada: no duplicar inventario por producto ----------
  const exists = await inventarioCrud.findMany({ producto_id: body.producto_id });

  if (exists.length > 0) {
    return createErrorResponse({
      status: 409,
      errorMessage: 'Este producto ya tiene un registro de inventario',
      details: { inventario_id: exists[0].id },
    });
  }

  // ----------- Validación de cantidades ----------
  if (body.cantidad_inicial != null && body.cantidad_inicial < 0) {
    return createErrorResponse({
      status: 400,
      errorMessage: 'La cantidad inicial no puede ser negativa',
    });
  }

  const registro = {
    ...body,
    cantidad_actual: body.cantidad_inicial ?? 0,
  };

  const data = await inventarioCrud.create(registro);

  return createSuccessResponse(data, 201);
}, true);

// ==========================================================
//                   PUT /inventario
// ==========================================================
export const PUT = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return createErrorResponse({
      status: 400,
      errorMessage: 'ID es requerido',
    });
  }

  const body = await validateRequestBody(request);

  const inventarioCrud = new CrudOperations('inventario', context.token);

  const existing = await inventarioCrud.findById(id);
  if (!existing) {
    return createErrorResponse({
      status: 404,
      errorMessage: 'Registro de inventario no encontrado',
    });
  }

  // ----------- Validación avanzada: evitar cantidades negativas ----------
  if (body.cantidad_actual != null && body.cantidad_actual < 0) {
    return createErrorResponse({
      status: 400,
      errorMessage: 'La cantidad actual no puede ser negativa',
    });
  }

  // ----------- Validar cambios en producto_id para evitar duplicados ----------
  if (body.producto_id && body.producto_id !== existing.producto_id) {
    const duplicate = await inventarioCrud.findMany({
      producto_id: body.producto_id,
    });

    if (duplicate.length > 0) {
      return createErrorResponse({
        status: 409,
        errorMessage:
          'Ya existe un registro de inventario para este producto',
        details: { inventario_id: duplicate[0].id },
      });
    }
  }

  const data = await inventarioCrud.update(id, body);

  return createSuccessResponse(data, 200);
}, true);
