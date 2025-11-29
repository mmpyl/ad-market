import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';
import { z } from 'zod';

// ============================
// ⭐ ZOD SCHEMAS
// ============================
export const pagoSchema = z.object({
  venta_id: z.number().int(),
  metodo_pago_id: z.number().int(),
  monto: z.number().positive(),
  referencia: z.string().optional(),
  nota: z.string().optional(),
});

export const pagoPartialSchema = pagoSchema.partial();

// ============================
// ⭐ GET - Listar Pagos
// ============================
export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset } = parseQueryParams(request);
  const pagosCrud = new CrudOperations('venta_pagos', context.token);

  const data = await pagosCrud.findMany({}, { limit, offset, orderBy: { column: 'created_at', direction: 'desc' } });
  return createSuccessResponse(data);
}, true);

// ============================
// ⭐ POST - Crear Pago
// ============================
export const POST = requestMiddleware(async (request, context) => {
  const body = await validateRequestBody(request);

  const parsed = pagoSchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse({
      errorMessage: 'Error de validación',
      status: 400,
      errorCode: 'VALIDATION_ERROR',
      errors: parsed.error.flatten(),
    });
  }

  const pagosCrud = new CrudOperations('venta_pagos', context.token);

  // ============================
  // VALIDACIÓN DE NEGOCIO
  // ============================

  // 1️⃣ Verificar que la venta exista
  const ventasCrud = new CrudOperations('ventas', context.token);
  const venta = await ventasCrud.findById(parsed.data.venta_id);

  if (!venta) {
    return createErrorResponse({
      errorMessage: 'La venta no existe',
      status: 404,
    });
  }

  // 2️⃣ Sumar pagos previos
  const pagosPrevios = await pagosCrud.findMany({ venta_id: venta.id });
  const sumaPagos = pagosPrevios.reduce((acc, p) => acc + p.monto, 0);

  // 3️⃣ Evitar sobrepago
  if (sumaPagos + parsed.data.monto > venta.total) {
    return createErrorResponse({
      errorMessage: `El monto excede el saldo pendiente. Disponible: ${venta.total - sumaPagos}`,
      status: 400,
    });
  }

  // ============================
  // CREAR
  // ============================
  const data = await pagosCrud.create({
    ...parsed.data,
    user_id: context.payload?.sub ? Number(context.payload.sub) : null,
  });

  return createSuccessResponse(data, 201);
}, true);

// ============================
// ⭐ PUT - Reemplazar Pago
// ============================
export const PUT = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });
  }

  const body = await validateRequestBody(request);
  const parsed = pagoSchema.safeParse(body);

  if (!parsed.success) {
    return createErrorResponse({
      errorMessage: 'Error de validación',
      status: 400,
      errors: parsed.error.flatten(),
    });
  }

  const pagosCrud = new CrudOperations('venta_pagos', context.token);
  const existing = await pagosCrud.findById(id);

  if (!existing) {
    return createErrorResponse({ errorMessage: 'Pago no encontrado', status: 404 });
  }

  // No permitir editar pagos conciliados
  if (existing.conciliado) {
    return createErrorResponse({
      errorMessage: 'Este pago ya fue conciliado y no puede modificarse',
      status: 403,
    });
  }

  const data = await pagosCrud.update(id, parsed.data);
  return createSuccessResponse(data);
}, true);

// ============================
// ⭐ PATCH - Actualizar Parcial
// ============================
export const PATCH = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });
  }

  const body = await validateRequestBody(request);
  const parsed = pagoPartialSchema.safeParse(body);

  if (!parsed.success) {
    return createErrorResponse({
      errorMessage: 'Error de validación',
      status: 400,
      errors: parsed.error.flatten(),
    });
  }

  const pagosCrud = new CrudOperations('venta_pagos', context.token);
  const existing = await pagosCrud.findById(id);

  if (!existing) {
    return createErrorResponse({ errorMessage: 'Pago no encontrado', status: 404 });
  }

  if (existing.conciliado) {
    return createErrorResponse({
      errorMessage: 'Este pago ya fue conciliado y no puede modificarse',
      status: 403,
    });
  }

  const data = await pagosCrud.update(id, parsed.data);
  return createSuccessResponse(data);
}, true);

// ============================
// ⭐ DELETE - Validación de dependencias
// ============================
export const DELETE = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });
  }

  const pagosCrud = new CrudOperations('venta_pagos', context.token);
  const existing = await pagosCrud.findById(id);

  if (!existing) {
    return createErrorResponse({ errorMessage: 'Pago no encontrado', status: 404 });
  }

  if (existing.conciliado) {
    return createErrorResponse({
      errorMessage: 'Los pagos conciliados no pueden eliminarse',
      status: 403,
    });
  }

  // Validación: no eliminar si es el único pago de la venta y la venta ya fue enviada a SUNAT
  const ventasCrud = new CrudOperations('ventas', context.token);
  const venta = await ventasCrud.findById(existing.venta_id);

  if (venta?.estado_sunat === 'ENVIADO') {
    return createErrorResponse({
      errorMessage: 'No se puede eliminar un pago si la venta ya fue declarada en SUNAT',
      status: 403,
    });
  }

  const result = await pagosCrud.delete(id);
  return createSuccessResponse(result, 200);
}, true);
