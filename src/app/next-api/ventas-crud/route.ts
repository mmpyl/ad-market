import { NextRequest, NextResponse } from 'next/server';
import CrudOperations from '@/lib/crud-operations';
import { ventaSchema, ventaPatchSchema } from '@/lib/schemas';
import { createErrorResponse } from '@/lib/create-response';
import { generarUBL, generarPDFVenta, enviarSunat } from '@/lib/facturacion-sunat';

// GET: Listado de ventas con filtros
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const estado = searchParams.get('estado');
    const fecha_inicio = searchParams.get('fecha_inicio');
    const fecha_fin = searchParams.get('fecha_fin');

    const filters: Record<string, any> = {};
    if (estado) filters.estado = estado;
    if (fecha_inicio && fecha_fin) filters.fecha = { gte: fecha_inicio, lte: fecha_fin };

    const crud = new CrudOperations('ventas', token);
    const ventas = await crud.findMany(filters, {
      limit,
      offset,
      orderBy: { column: 'fecha', direction: 'desc' },
    });

    return NextResponse.json({ success: true, data: ventas, pagination: { limit, offset, total: ventas.length } });
  } catch (error: any) {
    console.error('Error fetching ventas:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Crear venta + generar UBL y PDF + enviar a SUNAT
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const body = await request.json();
    const validatedData = ventaSchema.parse(body);

    const crud = new CrudOperations('ventas', token);
    const venta = await crud.create(validatedData);

    // Generar UBL 2.1 y PDF
    const ublXML = await generarUBL(venta);
    const pdfFile = await generarPDFVenta(venta);

    // Enviar a SUNAT
    const sunatResponse = await enviarSunat(ublXML);
    await crud.update(venta.id, { estado_sunat: sunatResponse.status });

    return NextResponse.json({ success: true, data: { ...venta, pdfFile, sunatResponse } }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating venta:', error);
    if (error.name === 'ZodError') return NextResponse.json({ success: false, message: 'Validación fallida', errors: error.errors }, { status: 400 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH: Actualización parcial
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });

    const body = await request.json();
    const validatedData = ventaPatchSchema.parse(body);

    const crud = new CrudOperations('ventas', token);
    const existing = await crud.findById(id);
    if (!existing) return createErrorResponse({ errorMessage: 'Venta no encontrada', status: 404 });
    if (existing.estado_sunat === 'ENVIADO') return createErrorResponse({ errorMessage: 'No se puede modificar una venta enviada a SUNAT', status: 403 });

    const updated = await crud.update(id, validatedData);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ success: false, message: 'Validación fallida', errors: error.errors }, { status: 400 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Validación de dependencias
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return createErrorResponse({ errorMessage: 'No autorizado', status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return createErrorResponse({ errorMessage: 'ID es requerido', status: 400 });

    const crud = new CrudOperations('ventas', token);
    const existing = await crud.findById(id);
    if (!existing) return createErrorResponse({ errorMessage: 'Venta no encontrada', status: 404 });

    // Validar dependencias
    const detalles = await crud.findRelation(id, 'venta_detalles');
    const pagos = await crud.findRelation(id, 'venta_pagos');
    if (detalles.length > 0 || pagos.length > 0 || existing.estado_sunat === 'ENVIADO') {
      return createErrorResponse({ errorMessage: 'No se puede eliminar la venta por dependencias o envío a SUNAT', status: 403 });
    }

    const result = await crud.delete(id);
    return NextResponse.json({ success: true, data: result, message: 'Venta eliminada' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
