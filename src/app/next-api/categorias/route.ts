import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';
import { categoriaSchema } from '@/lib/schemas';

/* =======================================================
   GET → Listado de categorías
   - Soporta filtros
   - Soporta paginación
========================================================= */
export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset, search } = parseQueryParams(request);

  const categoriasCrud = new CrudOperations('categorias', context.token);

  const query: any = { activo: true };

  if (search) {
    query.nombre = { $contains: search };
  }

  const data = await categoriasCrud.findMany(query, { limit, offset });
  return createSuccessResponse(data);
}, true);

/* =======================================================
   POST → Crear categoría
   - Validación fuerte con Zod
   - Manejo limpio de errores
========================================================= */
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);

    // Validación con Zod (segura)
    const parsed = categoriaSchema.parse(body);

    const categoriasCrud = new CrudOperations('categorias', context.token);
    const created = await categoriasCrud.create(parsed);

    return createSuccessResponse(created, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return createErrorResponse({
        errorMessage: 'Validación fallida',
        status: 400,
        errors: err.errors,
      });
    }

    return createErrorResponse({
      errorMessage: 'Error al crear la categoría',
      status: 500,
    });
  }
}, true);

/* =======================================================
   PUT → Actualizar categoría
   - Requiere ID en query params
   - Valida campos enviados (parcial)
========================================================= */
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);

    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID es requerido',
        status: 400,
      });
    }

    const categoriasCrud = new CrudOperations('categorias', context.token);
    const exists = await categoriasCrud.findById(id);

    if (!exists) {
      return createErrorResponse({
        errorMessage: 'Categoría no encontrada',
        status: 404,
      });
    }

    const body = await validateRequestBody(request);

    // Validación parcial (solo los campos enviados)
    const parsed = categoriaSchema.partial().parse(body);

    const updated = await categoriasCrud.update(id, parsed);

    return createSuccessResponse(updated);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return createErrorResponse({
        errorMessage: 'Validación fallida',
        status: 400,
        errors: err.errors,
      });
    }

    return createErrorResponse({
      errorMessage: 'Error al actualizar la categoría',
      status: 500,
    });
  }
}, true);
