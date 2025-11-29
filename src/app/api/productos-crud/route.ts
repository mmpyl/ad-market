import { NextRequest } from 'next/server';
import CrudOperations from '@/lib/crud-operations';
import { productoSchema } from '@/lib/schemas';
import { createErrorResponse } from '@/lib/create-response';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const categoria_id = searchParams.get('categoria_id');

    const crud = new CrudOperations('productos', token);
    const filters: Record<string, any> = { estado: 'activo' };
    if (categoria_id) filters.categoria_id = parseInt(categoria_id);

    const productos = await crud.findMany(filters, { limit, offset });

    return Response.json({
      success: true,
      data: productos,
      pagination: { limit, offset, total: productos.length },
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const body = await request.json();
    const validatedData = productoSchema.parse(body);

    const crud = new CrudOperations('productos', token);
    const producto = await crud.create(validatedData);

    return Response.json(
      { success: true, data: producto, message: 'Producto creado' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return Response.json(
        { success: false, message: 'Validación fallida', errors: error.errors },
        { status: 400 }
      );
    }
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
