import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';

// ============================================================
// 🔧 MODO MOCK — Datos para desarrollo
// ============================================================
let mockProductos = [
  {
    id: 1,
    nombre: 'Arroz Superior 5kg',
    descripcion: 'Arroz blanco de primera calidad',
    categoria_id: 1,
    precio_compra: 18.50,
    precio_venta: 22.00,
    precio_mayorista: 20.50,
    unidad_medida: 'unidad',
    stock_minimo: 10,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    nombre: 'Aceite Vegetal 1L',
    descripcion: 'Aceite de girasol refinado',
    categoria_id: 1,
    precio_compra: 8.20,
    precio_venta: 10.50,
    precio_mayorista: 9.80,
    unidad_medida: 'unidad',
    stock_minimo: 15,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const REQUIRED_FIELDS = [
  'nombre',
  'categoria_id',
  'precio_compra',
  'precio_venta',
  'unidad_medida',
];


// ============================================================
// 📌 GET — Listar productos
// ============================================================
export const GET = async (request: NextRequest) => {
  try {
    return createSuccessResponse({
      data: mockProductos,
      total: mockProductos.length,
    });
  } catch (error) {
    console.error('Error fetching productos:', error);
    return createErrorResponse({
      errorMessage: 'Internal server error',
      status: 500,
    });
  }
};


// ============================================================
// 📌 POST — Crear producto con validaciones avanzadas
// ============================================================
export const POST = async (request: NextRequest) => {
  try {
    const rawBody = await request.json();

    // ============================================================
    // 🔎 Validaciones básicas
    // ============================================================
    for (const field of REQUIRED_FIELDS) {
      if (rawBody[field] === undefined || rawBody[field] === null) {
        return createErrorResponse({
          errorMessage: `El campo '${field}' es obligatorio`,
          status: 400,
        });
      }
    }

    // ============================================================
    // 🧹 Sanitización y normalización
    // ============================================================
    const body = {
      nombre: String(rawBody.nombre).trim(),
      descripcion: rawBody.descripcion ? String(rawBody.descripcion).trim() : '',
      categoria_id: parseInt(rawBody.categoria_id),
      precio_compra: parseFloat(rawBody.precio_compra),
      precio_venta: parseFloat(rawBody.precio_venta),
      precio_mayorista: rawBody.precio_mayorista ? parseFloat(rawBody.precio_mayorista) : null,
      unidad_medida: String(rawBody.unidad_medida),
      stock_minimo: rawBody.stock_minimo ? parseInt(rawBody.stock_minimo) : 0,
      activo: rawBody.activo !== false, // default true
    };

    if (body.precio_compra <= 0 || body.precio_venta <= 0) {
      return createErrorResponse({
        errorMessage: 'Los precios deben ser mayores a cero',
        status: 400,
      });
    }

    if (body.precio_venta < body.precio_compra) {
      return createErrorResponse({
        errorMessage: 'El precio de venta no puede ser menor al de compra',
        status: 400,
      });
    }

    // ============================================================
    // 🆕 Crear producto MOCK
    // ============================================================
    const newProduct = {
      id: mockProductos.length + 1,
      ...body,
      stock_minimo: body.stock_minimo || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockProductos.push(newProduct);

    return createSuccessResponse({
      message: 'Producto creado exitosamente',
      data: newProduct,
    });

  } catch (error) {
    console.error('Error creating producto:', error);
    return createErrorResponse({
      errorMessage: 'Internal server error',
      status: 500,
    });
  }
};
