// ============================================================
// Archivo: src/app/api/productos/route.ts
// ============================================================

import { requestMiddleware, responseSuccess, responseError, parseQueryParams } from '@/lib/api-utils';
import { NextRequest } from 'next/server';
import CrudOperations from '@/lib/crud-operations';

// GET - Obtener productos (requiere autenticación)
export const GET = requestMiddleware(async (request, context) => {
  try {
    // context.token contiene el token válido
    // context.payload contiene: { sub, email, role, isAdmin }
    
    const productosCrud = new CrudOperations('productos', context.token!);
    const productos = await productosCrud.getAll();
    
    return responseSuccess(productos, 'Productos obtenidos correctamente');
  } catch (error) {
    console.error('Error fetching productos:', error);
    return responseError(500, 'Error al obtener productos');
  }
});

// POST - Crear producto (requiere autenticación Y ser admin)
export const POST = requestMiddleware(async (request, context) => {
  try {
    // Verificar que sea administrador
    if (!context.payload?.isAdmin) {
      return responseError(403, 'Acceso denegado: se requieren permisos de administrador', 'FORBIDDEN');
    }
    
    const body = await request.json();
    const productosCrud = new CrudOperations('productos', context.token!);
    const nuevoProducto = await productosCrud.create(body);
    
    return responseSuccess(nuevoProducto, 'Producto creado correctamente');
  } catch (error) {
    console.error('Error creating producto:', error);
    return responseError(500, 'Error al crear producto');
  }
});

// ============================================================
// Archivo: src/app/api/public/info/route.ts
// Endpoint público (NO requiere autenticación)
// ============================================================

// GET - Información pública (NO requiere autenticación)
export const GET = requestMiddleware(async (request, context) => {
// GET - Información pública (NO requiere autenticación)
export const GET = requestMiddleware(async (request, context) => {
  const info = {
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  };
  
  return responseSuccess(info);
}, false); // ← false = NO requiere autenticación

// ============================================================
// Archivo: src/app/api/usuarios/route.ts
// ============================================================
export const GET = requestMiddleware(async (request, context) => {
  try {
    // Solo admins pueden ver la lista de usuarios
    if (!context.payload?.isAdmin) {
// GET - Listar usuarios (solo admins)
export const GET = requestMiddleware(async (request, context) => {
  try {
    // Solo admins pueden ver la lista de usuarios
    if (!context.payload?.isAdmin) {
      return responseError(403, 'Acceso denegado', 'FORBIDDEN');
    }
    
    const params = parseQueryParams(request);
    const usuariosCrud = new CrudOperations('usuarios', context.token!);
    
    const usuarios = await usuariosCrud.getAll({
      limit: params.limit,
      offset: params.offset,
      search: params.search
    });
    
    return responseSuccess(usuarios);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    return responseError(500, 'Error al obtener usuarios');
  }
});

// ============================================================
// Archivo: src/app/api/perfil/route.ts
// ============================================================

// GET - Obtener perfil del usuario autenticado
export const GET = requestMiddleware(async (request, context) => {
  try {
    const userId = context.payload?.sub;
    
    if (!userId) {
      return responseError(400, 'ID de usuario no encontrado en el token');
    }
    
    const usuariosCrud = new CrudOperations('usuarios', context.token!);
    const usuario = await usuariosCrud.getById(userId);
    
    // Remover información sensible antes de devolver
    const { password_hash, ...perfilPublico } = usuario;
    
    return responseSuccess(perfilPublico);
  } catch (error) {
    console.error('Error fetching perfil:', error);
    return responseError(500, 'Error al obtener perfil');
  }
});

// PUT - Actualizar perfil del usuario autenticado
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const userId = context.payload?.sub;
    
    if (!userId) {
      return responseError(400, 'ID de usuario no encontrado en el token');
    }
    
    const body = await request.json();
    
    // Prevenir que el usuario modifique campos sensibles
    const { role, isAdmin, password_hash, ...datosPermitidos } = body;
    
    const usuariosCrud = new CrudOperations('usuarios', context.token!);
    const usuarioActualizado = await usuariosCrud.update(userId, datosPermitidos);
    
    return responseSuccess(usuarioActualizado, 'Perfil actualizado correctamente');
  } catch (error) {
    console.error('Error updating perfil:', error);
    return responseError(500, 'Error al actualizar perfil');
  }
});