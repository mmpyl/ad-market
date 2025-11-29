// src/app/api/ventas/route.ts
import { NextRequest } from 'next/server';
import CrudOperations from '@/lib/crud-operations';
import { ventaSchema, ventaPatchSchema } from '@/lib/schemas';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';
import { generarUBL, generarPDFVenta, enviarSunat } from '@/lib/facturacion-sunat';

export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset } = parseQueryParams(request);
  const ventasCrud = new CrudOperations('ventas', context.token);

  const data = await ventasCrud.findMany({}, { limit, offset, orderBy: { column: 'created_at', direction: 'desc' } });
  return createSuccessResponse(data);
}, true);

export const POST = requestMiddleware(async (request, context) => {
  const body = await validateRequestBody(request);
  const validatedData = ventaSchema.parse(body);

  const ventasCrud = new CrudOperations('ventas', context.token);

  // Crear venta
  const venta = await ventasCrud.create(validatedData);

  // Generar UBL y PDF
  const ublXML = await generarUBL(venta);
  const pdfFile = await generarPDFVenta(venta);

  // Enviar a SUNAT
  const sunatResponse = await enviarSunat(ublXML);

  // Actualizar estado SUNAT en DB
  await ventasCrud.update(venta.id, { estado_sunat: sunatResponse.status });

  return createSuccessResponse({ ...venta, pdfFile, sunatResponse }, 201);
}, true);

export const PATCH = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);
  if (!id) return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });

  const body = await validateRequestBody(request);
  const validatedData = ventaPatchSchema.parse(body);

  const ventasCrud = new CrudOperations('ventas', context.token);
  const existing = await ventasCrud.findById(id);

  if (!existing) return createErrorResponse({ errorMessage: 'Venta no encontrada', status: 404 });
  if (existing.estado_sunat === 'ENVIADO') return createErrorResponse({ errorMessage: 'No se puede modificar una venta enviada a SUNAT', status: 403 });

  const updated = await ventasCrud.update(id, validatedData);
  return createSuccessResponse(updated, 200);
}, true);

export const PUT = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);
  if (!id) return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });

  const body = await validateRequestBody(request);
  const validatedData = ventaSchema.parse(body);

  const ventasCrud = new CrudOperations('ventas', context.token);
  const existing = await ventasCrud.findById(id);
  if (!existing) return createErrorResponse({ errorMessage: 'Venta no encontrada', status: 404 });

  const updated = await ventasCrud.update(id, validatedData);
  return createSuccessResponse(updated, 200);
}, true);

export const DELETE = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);
  if (!id) return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });

  const ventasCrud = new CrudOperations('ventas', context.token);
  const existing = await ventasCrud.findById(id);
  if (!existing) return createErrorResponse({ errorMessage: 'Venta no encontrada', status: 404 });

  // Validar dependencias
  const detalles = await ventasCrud.findRelation(id, 'venta_detalles');
  const pagos = await ventasCrud.findRelation(id, 'venta_pagos');
  if (detalles.length > 0 || pagos.length > 0 || existing.estado_sunat === 'ENVIADO') {
    return createErrorResponse({
      errorMessage: 'No se puede eliminar la venta por dependencias o envío a SUNAT',
      status: 403,
    });
  }

  const result = await ventasCrud.delete(id);
  return createSuccessResponse(result, 200);
}, true);
