import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';

// -------------------------------------------------------------
// GET -> Obtener proveedores
// -------------------------------------------------------------
export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset, search } = parseQueryParams(request);
  const proveedoresCrud = new CrudOperations('proveedores', context.token);

  const filters = { activo: true };

  if (search) {
    filters['nombre'] = { operator: 'ilike', value: `%${search}%` };
  }

  const data = await proveedoresCrud.findMany(filters, { limit, offset });
  return createSuccessResponse(data);
}, true);

// -------------------------------------------------------------
// POST -> Crear proveedor
// -------------------------------------------------------------
export const POST = requestMiddleware(async (request, context) => {
  const body = await validateRequestBody(request);

  if (!body.nombre) {
    return createErrorResponse({
      errorMessage: 'El nombre del proveedor es requerido',
      status: 400,
    });
  }

  const proveedoresCrud = new CrudOperations('proveedores', context.token);

  const data = await proveedoresCrud.create({
    nombre: body.nombre,
    direccion: body.direccion ?? null,
    telefono: body.telefono ?? null,
    ruc: body.ruc ?? null,
    email: body.email ?? null,
  });

  return createSuccessResponse(data, 201);
}, true);

// -------------------------------------------------------------
// PUT -> Actualizar proveedor
// -------------------------------------------------------------
export const PUT = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return createErrorResponse({
      errorMessage: 'ID es requerido para actualizar',
      status: 400,
    });
  }

  const body = await validateRequestBody(request);

  const proveedoresCrud = new CrudOperations('proveedores', context.token);

  const existing = await proveedoresCrud.findById(id);
  if (!existing) {
    return createErrorResponse({
      errorMessage: 'Proveedor no encontrado',
      status: 404,
    });
  }

  const data = await proveedoresCrud.update(id, body);

  return createSuccessResponse(data);
}, true);

// -------------------------------------------------------------
// DELETE -> Soft Delete (recomendado)
// -------------------------------------------------------------
export const DELETE = requestMiddleware(async (request, context) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return createErrorResponse({
      errorMessage: 'ID es requerido para eliminar',
      status: 400,
    });
  }

  const proveedoresCrud = new CrudOperations('proveedores', context.token);

  const existing = await proveedoresCrud.findById(id);
  if (!existing) {
    return createErrorResponse({
      errorMessage: 'Proveedor no encontrado',
      status: 404,
    });
  }

  const data = await proveedoresCrud.update(id, { activo: false });

  return createSuccessResponse({
    message: 'Proveedor desactivado correctamente',
    data,
  });
}, true);
