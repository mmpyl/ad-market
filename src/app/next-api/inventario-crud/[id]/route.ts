import { NextRequest } from 'next/server';
import CrudOperations from '@/lib/crud-operations';
import { inventarioSchema } from '@/lib/schemas';
import { createErrorResponse, createSuccessResponse } from '@/lib/create-response';
import { safeParseJSON } from '@/lib/server-utils';

// Reutilizamos un helper para extraer el token
function getToken(req: NextRequest) {
  return req.headers.get('authorization')?.replace('Bearer ', '') || null;
}

// =============================
//        GET /inventario/:id
// =============================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getToken(request);

    if (!token)
      return createErrorResponse({ status: 401, errorMessage: 'No autorizado' });

    const crud = new CrudOperations('inventario', token);
    const registro = await crud.findById(id);

    if (!registro) {
      return createErrorResponse({
        status: 404,
        errorMessage: 'Registro no encontrado',
      });
    }

    return createSuccessResponse(registro);

  } catch (error: any) {
    console.error('GET /inventario/:id Error:', error);
    return createErrorResponse({
      status: 500,
      errorMessage: 'Error interno del servidor',
      details: error.message,
    });
  }
}

// =============================
//        PUT /inventario/:id
// =============================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getToken(request);

    if (!token)
      return createErrorResponse({ status: 401, errorMessage: 'No autorizado' });

    const rawBody = await request.text();
    const body = safeParseJSON(rawBody);

    if (!body)
      return createErrorResponse({
        status: 400,
        errorMessage: 'JSON inválido',
      });

    // Validación parcial para updates
    const parsed = inventarioSchema.partial().safeParse(body);

    if (!parsed.success) {
      return createErrorResponse({
        status: 400,
        errorMessage: 'Validación fallida',
        details: parsed.error.flatten(),
      });
    }

    const crud = new CrudOperations('inventario', token);

    const exists = await crud.findById(id);
    if (!exists) {
      return createErrorResponse({
        status: 404,
        errorMessage: 'Registro no encontrado',
      });
    }

    const updated = await crud.update(id, parsed.data);

    return createSuccessResponse(updated, 200, 'Registro actualizado');

  } catch (error: any) {
    console.error('PUT /inventario/:id Error:', error);

    return createErrorResponse({
      status: 500,
      errorMessage: 'Error interno del servidor',
      details: error.message,
    });
  }
}

// =============================
//        DELETE /inventario/:id
// =============================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getToken(request);

    if (!token)
      return createErrorResponse({ status: 401, errorMessage: 'No autorizado' });

    const crud = new CrudOperations('inventario', token);

    const exists = await crud.findById(id);
    if (!exists) {
      return createErrorResponse({
        status: 404,
        errorMessage: 'Registro no encontrado',
      });
    }

    // Aquí agregamos seguridad avanzada:
    if (exists.cantidad_actual > 0) {
      return createErrorResponse({
        status: 409,
        errorMessage: 'No se puede eliminar un inventario con stock existente',
      });
    }

    const deleted = await crud.delete(id);

    return createSuccessResponse(
      deleted,
      200,
      'Registro eliminado correctamente'
    );

  } catch (error: any) {
    console.error('DELETE /inventario/:id Error:', error);

    return createErrorResponse({
      status: 500,
      errorMessage: 'Error al eliminar el registro',
      details: error.message,
    });
  }
}
