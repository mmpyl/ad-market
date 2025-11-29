import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * GET /auditoria
 * Obtiene registros con paginación y orden por fecha.
 */
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);

    const auditoriaCrud = new CrudOperations('auditoria', context.token);

    const data = await auditoriaCrud.findMany(
      {},
      {
        limit: limit ?? 20,
        offset: offset ?? 0,
        orderBy: {
          column: 'created_at',
          direction: 'desc',
        },
      }
    );

    return createSuccessResponse({ data });

  } catch (err) {
    console.error('Error in GET /auditoria:', err);
    return createErrorResponse({
      errorMessage: 'Failed to fetch audit logs',
      status: 500,
    });
  }
}, true);


/**
 * POST /auditoria
 * Registra acción de auditoría.
 */
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);

    if (!body?.tabla || !body?.accion) {
      return createErrorResponse({
        errorMessage: 'Table and action are required',
        status: 400,
      });
    }

    const userIdStr = context?.payload?.sub;
    if (!userIdStr) {
      return createErrorResponse({
        errorMessage: 'User ID is required',
        status: 400,
      });
    }

    const auditoriaCrud = new CrudOperations('auditoria', context.token);

    const data = await auditoriaCrud.create({
      ...body,
      usuario_id: parseInt(userIdStr, 10), // 👈 ahora consistente con el frontend
    });

    return createSuccessResponse({ data }, 201);

  } catch (err) {
    console.error('Error in POST /auditoria:', err);

    return createErrorResponse({
      errorMessage: 'Failed to create audit entry',
      status: 500,
    });
  }
}, true);
