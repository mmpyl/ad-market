import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';

/* ---------------------------------------------------------
   GET: Lista de detalles de venta
--------------------------------------------------------- */
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const detallesCrud = new CrudOperations('venta_detalles', context.token);

    const data = await detallesCrud.findMany({}, { limit, offset });

    return createSuccessResponse(data);
  } catch (err) {
    return createErrorResponse({
      errorMessage: 'Error obteniendo los detalles de venta',
      status: 500,
      error: err,
    });
  }
}, true);


/* ---------------------------------------------------------
   POST: Crear detalle de venta
--------------------------------------------------------- */
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);

    // Validación manual más segura
    const requiredFields = ['venta_id', 'producto_id', 'cantidad', 'precio_unitario'];

    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse({
          errorMessage: `El campo '${field}' es obligatorio`,
          status: 400,
        });
      }
    }

    // Validaciones numéricas
    if (isNaN(Number(body.cantidad)) || Number(body.cantidad) <= 0) {
      return createErrorResponse({
        errorMessage: 'La cantidad debe ser un número mayor a 0',
        status: 400,
      });
    }

    if (isNaN(Number(body.precio_unitario)) || Number(body.precio_unitario) <= 0) {
      return createErrorResponse({
        errorMessage: 'El precio unitario debe ser un número mayor a 0',
        status: 400,
      });
    }

    // Sanitización
    const payload = {
      venta_id: Number(body.venta_id),
      producto_id: Number(body.producto_id),
      cantidad: Number(body.cantidad),
      precio_unitario: Number(body.precio_unitario),
      subtotal: Number(body.cantidad) * Number(body.precio_unitario),
      ...body, // por si vienen otros campos opcionales
    };

    const detallesCrud = new CrudOperations('venta_detalles', context.token);
    const data = await detallesCrud.create(payload);

    return createSuccessResponse(data, 201);

  } catch (err) {
    return createErrorResponse({
      errorMessage: 'Error registrando el detalle de venta',
      status: 500,
      error: err,
    });
  }
}, true);
