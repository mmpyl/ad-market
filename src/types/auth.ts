/**
 * Types Schema - Sistema Minimarket
 * 
 * Este archivo contiene todas las interfaces TypeScript que representan
 * las entidades del sistema y sus relaciones con la base de datos.
 * 
 * @module types
 */

// ==================== Enums y Tipos Reutilizables ====================

export type RolSistema = 'vendedor' | 'almacenero' | 'administrador' | 'auditor';
export type TipoComprobante = 'boleta' | 'factura' | 'ticket';
export type EstadoVenta = 'pendiente' | 'completada' | 'anulada';
export type EstadoPago = 'pendiente' | 'completado' | 'rechazado';
export type EstadoSunat = 'pendiente' | 'aceptado' | 'rechazado' | 'anulado';
export type TipoMetodoPago = 'efectivo' | 'tarjeta' | 'yape' | 'plin' | 'transferencia';
export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste' | 'transferencia' | 'venta' | 'devolucion';
export type AccionAuditoria = 'crear' | 'actualizar' | 'eliminar' | 'venta' | 'pago' | 'inventario' | 'login' | 'logout';

// ==================== Interfaces Base ====================

/**
 * Timestamps comunes a todas las entidades
 */
interface BaseTimestamps {
  created_at: string;
  updated_at: string;
}

/**
 * Entidad activable (puede desactivarse sin eliminarse)
 */
interface Activable {
  activo: boolean;
}

// ==================== Auth & Users ====================

/**
 * Usuario autenticado en el sistema (JWT payload)
 */
export interface User {
  sub: string;
  email: string;
  role: string;
  isAdmin: boolean;
  rol_sistema?: RolSistema;
  nombre_completo?: string;
}

/**
 * Perfil completo de usuario
 */
export interface UserProfile extends BaseTimestamps, Activable {
  id: number;
  user_id: number;
  nombre_completo: string;
  documento_identidad?: string;
  telefono?: string;
  direccion?: string;
  rol_sistema: RolSistema;
}

// ==================== Catálogo de Productos ====================

/**
 * Categoría de productos
 */
export interface Categoria extends BaseTimestamps, Activable {
  id: number;
  nombre: string;
  descripcion?: string;
  color: string;
  icono?: string;
}

/**
 * Proveedor de productos
 */
export interface Proveedor extends BaseTimestamps, Activable {
  id: number;
  nombre: string;
  ruc?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

/**
 * Producto base
 */
export interface Producto extends BaseTimestamps, Activable {
  id: number;
  categoria_id: number;
  proveedor_id?: number;
  nombre: string;
  descripcion?: string;
  codigo_barras?: string;
  precio_venta: number;
  precio_costo: number;
  stock_minimo: number;
  tiene_variantes: boolean;
  imagen_url?: string;
}

/**
 * Variante de producto (tallas, colores, etc.)
 */
export interface ProductoVariante extends BaseTimestamps, Activable {
  id: number;
  producto_id: number;
  nombre_variante: string;
  valor_variante: string;
  codigo_barras?: string;
  precio_adicional: number;
  stock_actual: number;
}

// ==================== Ventas ====================

/**
 * Método de pago disponible
 */
export interface MetodoPago {
  id: number;
  nombre: string;
  tipo: TipoMetodoPago;
  requiere_referencia: boolean;
  activo: boolean;
  created_at: string;
}

/**
 * Venta (cabecera)
 */
export interface Venta extends BaseTimestamps {
  id: number;
  user_id: number;
  numero_venta: string;
  tipo_comprobante: TipoComprobante;
  serie_comprobante?: string;
  numero_comprobante?: string;
  cliente_nombre?: string;
  cliente_documento?: string;
  cliente_email?: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  estado: EstadoVenta;
  observaciones?: string;
}

/**
 * Detalle de venta (línea de producto)
 */
export interface VentaDetalle {
  id: number;
  venta_id: number;
  producto_id: number;
  variante_id?: number;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  created_at: string;
}

/**
 * Pago asociado a una venta
 */
export interface VentaPago {
  id: number;
  venta_id: number;
  metodo_pago_id: number;
  monto: number;
  referencia?: string;
  estado: EstadoPago;
  created_at: string;
}

// ==================== Inventario ====================

/**
 * Stock actual de producto/variante
 */
export interface Inventario extends BaseTimestamps {
  id: number;
  producto_id: number;
  variante_id?: number;
  stock_actual: number;
  stock_reservado: number;
  ultima_actualizacion: string;
}

/**
 * Registro de movimiento de inventario
 */
export interface MovimientoInventario {
  id: number;
  user_id: number;
  producto_id: number;
  variante_id?: number;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string;
  referencia?: string;
  created_at: string;
}

// ==================== Facturación Electrónica ====================

/**
 * Comprobante electrónico SUNAT
 */
export interface ComprobanteElectronico extends BaseTimestamps {
  id: number;
  venta_id: number;
  tipo_comprobante: 'boleta' | 'factura';
  serie: string;
  numero: string;
  ruc_emisor: string;
  razon_social_emisor: string;
  documento_cliente?: string;
  nombre_cliente?: string;
  fecha_emision: string;
  moneda: string;
  total: number;
  xml_content?: string;
  pdf_url?: string;
  cdr_content?: string;
  hash_cpe?: string;
  estado_sunat: EstadoSunat;
  mensaje_sunat?: string;
  fecha_envio_sunat?: string;
}

// ==================== Auditoría ====================

/**
 * Registro de auditoría del sistema
 */
export interface Auditoria {
  id: number;
  user_id: number;
  tabla: string;
  registro_id?: number;
  accion: AccionAuditoria;
  datos_anteriores?: Record<string, any>;
  datos_nuevos?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  descripcion?: string;
  created_at: string;
}

// ==================== DTOs (Data Transfer Objects) ====================

/**
 * DTO para crear una nueva venta
 */
export interface CreateVentaDTO {
  tipo_comprobante: TipoComprobante;
  cliente_nombre?: string;
  cliente_documento?: string;
  cliente_email?: string;
  descuento?: number;
  observaciones?: string;
  detalles: CreateVentaDetalleDTO[];
  pagos: CreateVentaPagoDTO[];
}

export interface CreateVentaDetalleDTO {
  producto_id: number;
  variante_id?: number;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
}

export interface CreateVentaPagoDTO {
  metodo_pago_id: number;
  monto: number;
  referencia?: string;
}

/**
 * DTO para crear/actualizar producto
 */
export interface CreateProductoDTO {
  categoria_id: number;
  proveedor_id?: number;
  nombre: string;
  descripcion?: string;
  codigo_barras?: string;
  precio_venta: number;
  precio_costo: number;
  stock_minimo: number;
  tiene_variantes: boolean;
  imagen_url?: string;
}

/**
 * DTO para movimiento de inventario
 */
export interface CreateMovimientoInventarioDTO {
  producto_id: number;
  variante_id?: number;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  motivo?: string;
  referencia?: string;
}

// ==================== Vistas Extendidas ====================

/**
 * Producto con información relacionada
 */
export interface ProductoConRelaciones extends Producto {
  categoria?: Categoria;
  proveedor?: Proveedor;
  variantes?: ProductoVariante[];
  inventario?: Inventario;
}

/**
 * Venta con información completa
 */
export interface VentaConDetalles extends Venta {
  detalles?: VentaDetalle[];
  pagos?: VentaPago[];
  usuario?: UserProfile;
  comprobante_electronico?: ComprobanteElectronico;
}

/**
 * Detalle de venta con información del producto
 */
export interface VentaDetalleConProducto extends VentaDetalle {
  producto?: Producto;
  variante?: ProductoVariante;
}

// ==================== Respuestas de API ====================

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Estadísticas del dashboard
 */
export interface DashboardStats {
  ventas_hoy: {
    total: number;
    cantidad: number;
    variacion: number;
  };
  ventas_mes: {
    total: number;
    cantidad: number;
    variacion: number;
  };
  productos_bajo_stock: number;
  clientes_nuevos: number;
}

// ==================== Filtros y Queries ====================

/**
 * Filtros para búsqueda de productos
 */
export interface ProductoFilters {
  categoria_id?: number;
  proveedor_id?: number;
  nombre?: string;
  codigo_barras?: string;
  activo?: boolean;
  stock_bajo?: boolean;
}

/**
 * Filtros para búsqueda de ventas
 */
export interface VentaFilters {
  user_id?: number;
  tipo_comprobante?: TipoComprobante;
  estado?: EstadoVenta;
  fecha_desde?: string;
  fecha_hasta?: string;
  cliente_documento?: string;
}

/**
 * Filtros para auditoría
 */
export interface AuditoriaFilters {
  user_id?: number;
  tabla?: string;
  accion?: AccionAuditoria;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ==================== Utilidades ====================

/**
 * Tipo para selección parcial de campos
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Tipo para creación (sin id, timestamps, etc.)
 */
export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

/**
 * Tipo para actualización (todos los campos opcionales excepto id)
 */
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;
