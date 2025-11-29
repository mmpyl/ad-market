import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';
import { ventaSchema, ventaPatchSchema } from '@/lib/schemas';

export const runtime = 'edge';

// GET: listado con paginación
export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset } = parseQueryParams(request);
  const ventasCrud = new CrudOperations('ventas', context.token);

  const data = await ventasCrud.findMany({}, { limit, offset, orderBy: { column: 'fecha', direction: 'desc' } });
  return createSuccessResponse({ data });
}, true);

// POST: crear venta
export const POST = requestMiddleware(async (request, context) => {
  const body = await validateRequestBody(request);

  // Validaciones básicas
  if (!body.numero_venta || !body.tipo_comprobante || !body.total) {
    return createErrorResponse({
      errorMessage: 'Número de venta, tipo de comprobante y total son requeridos',
      status: 400,
    });
  }

  const user_id = context.payload?.sub;
  if (!user_id) return createErrorResponse({ errorMessage: 'Usuario no autenticado', status: 401 });

  const validatedData = ventaSchema.parse({ ...body, user_id: parseInt(user_id) });
  const ventasCrud = new CrudOperations('ventas', context.token);
  const data = await ventasCrud.create(validatedData);

  return createSuccessResponse(data, 201);
}, true);

// PUT / PATCH: actualizar venta
export const PUT = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);
  if (!id) return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });

  const body = await validateRequestBody(request);
  const validatedData = ventaPatchSchema.parse(body);

  const ventasCrud = new CrudOperations('ventas', context.token);
  const existing = await ventasCrud.findById(id);
  if (!existing) return createErrorResponse({ errorMessage: 'Venta no encontrada', status: 404 });

  // Validación: no se puede modificar si ya fue enviada a SUNAT
  if (existing.estado_sunat === 'ENVIADO') return createErrorResponse({ errorMessage: 'No se puede modificar una venta enviada a SUNAT', status: 403 });

  const data = await ventasCrud.update(id, validatedData);
  return createSuccessResponse(data);
}, true);

// DELETE: eliminar venta con validación de dependencias
export const DELETE = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);
  if (!id) return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });

  const ventasCrud = new CrudOperations('ventas', context.token);
  const existing = await ventasCrud.findById(id);
  if (!existing) return createErrorResponse({ errorMessage: 'Venta no encontrada', status: 404 });

  // Validar dependencias: detalles o pagos
  const detalles = await ventasCrud.findRelation(id, 'venta_detalles');
  const pagos = await ventasCrud.findRelation(id, 'venta_pagos');
  if (detalles.length > 0 || pagos.length > 0 || existing.estado_sunat === 'ENVIADO') {
    return createErrorResponse({
      errorMessage: 'No se puede eliminar la venta por dependencias o envío a SUNAT',
      status: 403,
    });
  }

  const data = await ventasCrud.delete(id);
  return createSuccessResponse(data, 200);
}, true);
