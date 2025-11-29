import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';
import { z } from 'zod';

/* ============================================
   Esquemas de Validación con Zod
============================================ */
const comprobanteSchema = z.object({
  venta_id: z.number().int().positive(),
  tipo_comprobante: z.string().min(1),
  serie: z.string().min(1),
  numero: z.string().min(1),
  fecha_emision: z.string().optional(),
  hash: z.string().optional(),
  xml: z.string().optional(),
  cdr: z.string().optional(),
});

/** Para PUT (actualización parcial) */
const comprobantePartialSchema = comprobanteSchema.partial();

/* ============================================
   GET → Listado con paginación
============================================ */
export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset, venta_id, tipo } = parseQueryParams(request);

  const comprobantesCrud = new CrudOperations('comprobantes_electronicos', context.token);

  const filters: any = {};

  if (venta_id) filters.venta_id = Number(venta_id);
  if (tipo) filters.tipo_comprobante = tipo;

  const data = await comprobantesCrud.findMany(filters, { limit, offset });

  return createSuccessResponse(data);
}, true);

/* ============================================
   POST → Crear Comprobante
============================================ */
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);

    const validated = comprobanteSchema.parse(body);

    const comprobantesCrud = new CrudOperations('comprobantes_electronicos', context.token);
    const created = await comprobantesCrud.create(validated);

    return createSuccessResponse(created, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: 'Validación fallida',
        status: 400,
        errors: err.errors,
      });
    }

    return createErrorResponse({
      errorMessage: 'Error al crear el comprobante',
      status: 500,
    });
  }
}, true);

/* ============================================
   PUT → Actualizar Comprobante
============================================ */
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);

    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID es requerido',
        status: 400,
      });
    }

    const comprobantesCrud = new CrudOperations('comprobantes_electronicos', context.token);
    const existing = await comprobantesCrud.findById(id);

    if (!existing) {
      return createErrorResponse({
        errorMessage: 'Comprobante no encontrado',
        status: 404,
      });
    }

    const body = await validateRequestBody(request);

    const validated = comprobantePartialSchema.parse(body);

    const updated = await comprobantesCrud.update(id, validated);

    return createSuccessResponse(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: 'Validación fallida',
        status: 400,
        errors: err.errors,
      });
    }

    return createErrorResponse({
      errorMessage: 'Error al actualizar el comprobante',
      status: 500,
    });
  }
}, true);
