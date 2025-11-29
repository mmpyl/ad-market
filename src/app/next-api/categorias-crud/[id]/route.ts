import { NextRequest } from 'next/server';
import CrudOperations from '@/lib/crud-operations';
import { categoriaSchema } from '@/lib/schemas';
import { createErrorResponse, createSuccessResponse } from '@/lib/create-response';

/* ------------------------------
   Helpers reutilizables
--------------------------------*/

// Obtener token desde headers
function getToken(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  return token || null;
}

// Obtener ID dinámico del route
async function getRouteId(params: Promise<{ id: string }>): Promise<string> {
  const { id } = await params;
  return id;
}

/* =====================================
   GET → Obtener categoría por ID
======================================*/
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getToken(request);
    if (!token)
      return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const id = await getRouteId(params);

    const crud = new CrudOperations('categorias', token);
    const categoria = await crud.findById(id);

    if (!categoria) {
      return createErrorResponse({
        errorMessage: 'Categoría no encontrada',
        status: 404,
      });
    }

    return createSuccessResponse(categoria);
  } catch (err: any) {
    console.error('GET /categorias/[id] ERROR:', err);
    return createErrorResponse({
      errorMessage: 'Error interno al obtener la categoría',
      status: 500,
    });
  }
}

/* =====================================
   PUT → Actualizar categoría
======================================*/
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getToken(request);
    if (!token)
      return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const id = await getRouteId(params);

    const body = await request.json();

    // Validación estricta parcial (solo campos enviados)
    const validatedData = categoriaSchema.partial().parse(body);

    const crud = new CrudOperations('categorias', token);
    const updated = await crud.update(id, validatedData);

    return createSuccessResponse({
      message: 'Categoría actualizada correctamente',
      data: updated,
    });
  } catch (err: any) {
    console.error('PUT /categorias/[id] ERROR:', err);

    if (err.name === 'ZodError') {
      return Response.json(
        {
          success: false,
          message: 'Validación fallida',
          errors: err.errors,
        },
        { status: 400 }
      );
    }

    return createErrorResponse({
      errorMessage: 'Error interno al actualizar la categoría',
      status: 500,
    });
  }
}

/* =====================================
   DELETE → Eliminar categoría
======================================*/
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getToken(request);
    if (!token)
      return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const id = await getRouteId(params);

    const crud = new CrudOperations('categorias', token);
    const deleted = await crud.delete(id);

    return createSuccessResponse({
      message: 'Categoría eliminada correctamente',
      data: deleted,
    });
  } catch (err: any) {
    console.error('DELETE /categorias/[id] ERROR:', err);

    return createErrorResponse({
      errorMessage: 'Error interno al eliminar la categoría',
      status: 500,
    });
  }
}
