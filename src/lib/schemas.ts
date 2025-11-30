import { z } from 'zod';

// ========== VENTAS SCHEMAS ==========
export const ventaSchema = z.object({
  id: z.number().optional(),
  numero_venta: z.string().min(1, 'Número de venta requerido'),
  fecha: z.string().or(z.date()),
  cliente_id: z.number().nullable().optional(),
  cliente_nombre: z.string().optional(),
  total: z.number().positive('Total debe ser positivo'),
  igv: z.number().min(0),
  estado: z.enum(['pendiente', 'completada', 'cancelada']).default('pendiente'),
  metodo_pago_id: z.number().optional(),
  comprobante_id: z.number().nullable().optional(),
  notas: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const ventaPatchSchema = ventaSchema.partial();

export const ventaDetalleSchema = z.object({
  id: z.number().optional(),
  venta_id: z.number(),
  producto_id: z.number(),
  cantidad: z.number().positive('Cantidad debe ser positiva'),
  precio_unitario: z.number().positive('Precio debe ser positivo'),
  descuento: z.number().min(0).default(0),
  subtotal: z.number().positive(),
  created_at: z.string().optional(),
});

// ========== ADMINISTRACIÓN SCHEMAS ==========
export const productoSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, 'Nombre requerido').min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
  codigo_barras: z.string().optional(),
  categoria_id: z.number(),
  proveedor_id: z.number().optional(),
  precio_costo: z.number().positive('Precio costo debe ser positivo'),
  precio_venta: z.number().positive('Precio venta debe ser positivo'),
  stock: z.number().int().min(0),
  stock_minimo: z.number().int().min(0).default(10),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  imagen_url: z.string().url().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const categoriaSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, 'Nombre requerido').min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const proveedorSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const usuarioSchema = z.object({
  id: z.number().optional(),
  email: z.string().email('Email inválido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().optional(),
  rol: z.enum(['administrador', 'vendedor', 'almacenero', 'auditor']),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  telefono: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ========== ALMACÉN SCHEMAS ==========
export const inventarioSchema = z.object({
  id: z.number().optional(),
  producto_id: z.number(),
  cantidad: z.number().int().min(0),
  ubicacion: z.string().optional(),
  lote: z.string().optional(),
  fecha_vencimiento: z.string().optional(),
  estado: z.enum(['disponible', 'reservado', 'dañado']).default('disponible'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const movimientoInventarioSchema = z.object({
  id: z.number().optional(),
  producto_id: z.number(),
  tipo: z.enum(['entrada', 'salida', 'ajuste', 'devolucion']),
  cantidad: z.number().int().positive('Cantidad debe ser positiva'),
  razon: z.string().min(1, 'Razón requerida'),
  referencia_id: z.number().optional(),
  usuario_id: z.number().optional(),
  created_at: z.string().optional(),
});

export const varianteSchema = z.object({
  id: z.number().optional(),
  producto_id: z.number(),
  nombre: z.string().min(1, 'Nombre requerido'),
  valores: z.string().or(z.record(z.string())), // JSON string or object
  sku: z.string().optional(),
  precio_adicional: z.number().default(0),
  stock: z.number().int().min(0),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ========== AUDITORÍA SCHEMAS ==========
export const auditLogSchema = z.object({
  id: z.number().optional(),
  usuario_id: z.number(),
  accion: z.string(),
  tabla: z.string(),
  registro_id: z.number().optional(),
  valores_anterior: z.string().optional(),
  valores_nuevo: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  created_at: z.string().optional(),
});

export const comprobanteSchema = z.object({
  id: z.number().optional(),
  numero: z.string().min(1, 'Número requerido'),
  tipo: z.enum(['factura', 'boleta', 'nota_credito', 'nota_debito']),
  venta_id: z.number(),
  estado: z.enum(['emitido', 'anulado', 'enviado']).default('emitido'),
  fecha_emision: z.string(),
  fecha_vencimiento: z.string().optional(),
  monto_total: z.number().positive(),
  monto_pagado: z.number().min(0).default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const metodoPagoSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  tipo: z.enum(['efectivo', 'tarjeta', 'transferencia', 'cheque', 'otro']),
  comision_porcentaje: z.number().min(0).max(100).default(0),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Export types
export type Venta = z.infer<typeof ventaSchema>;
export type VentaDetalle = z.infer<typeof ventaDetalleSchema>;
export type Producto = z.infer<typeof productoSchema>;
export type Categoria = z.infer<typeof categoriaSchema>;
export type Proveedor = z.infer<typeof proveedorSchema>;
export type Usuario = z.infer<typeof usuarioSchema>;
export type Inventario = z.infer<typeof inventarioSchema>;
export type MovimientoInventario = z.infer<typeof movimientoInventarioSchema>;
export type Variante = z.infer<typeof varianteSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type Comprobante = z.infer<typeof comprobanteSchema>;
export type MetodoPago = z.infer<typeof metodoPagoSchema>;
