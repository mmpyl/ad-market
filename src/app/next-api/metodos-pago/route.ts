import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';

// Valores permitidos para el tipo de método de pago
const ALLOWED_TYPES = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'DEPOSITO'];


// ==========================================================
//                   GET /metodos_pago
// ==========================================================
export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset } = parseQueryParams(request);

  const metodosCrud = new CrudOperations('metodos_pago', context.token);

  const data = await metodosCrud.findMany(
    { activo: true },
    {
      limit,
      offset,
      orderBy: { nombre: 'asc' },
    }
  );

  return createSuccessResponse(data);
}, true);


// ==========================================================
//                   POST /metodos_pago
// ==========================================================
export const POST = requestMiddleware(async (request, context) => {
  const body = await validateRequestBody(request);

  // -------------------- Validación base --------------------
  if (!body.nombre || !body.tipo) {
    return createErrorResponse({
      status: 400,
      errorMessage: 'Nombre y tipo del método de pago son requeridos',
    });
  }

  // Normalizar datos
  const nombre = body.nombre.trim().toUpperCase();
  const tipo = body.tipo.trim().toUpperCase();

  // -------------------- Validar tipo permitido --------------------
  if (!ALLOWED_TYPES.includes(tipo)) {
    return createErrorResponse({
      status: 400,
      errorMessage: 'Tipo de método de pago no válido',
      details: { permitidos: ALLOWED_TYPES },
    });
  }

  const metodosCrud = new CrudOperations('metodos_pago', context.token);

  // -------------------- Evitar duplicados --------------------
  const existing = await metodosCrud.findMany({ nombre });

  if (existing.length > 0) {
    return createErrorResponse({
      status: 409,
      errorMessage: 'Este método de pago ya existe',
      details: { id: existing[0].id },
    });
  }

  // -------------------- Crear registro --------------------
  const data = await metodosCrud.create({
    ...body,
    nombre,
    tipo,
    activo: true,
  });

  return createSuccessResponse(data, 201);
}, true);
