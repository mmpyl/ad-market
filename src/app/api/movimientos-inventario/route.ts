import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from '@/lib/api-utils';

export const GET = requestMiddleware(async (request, context) => {
  const { limit, offset } = parseQueryParams(request);

  const movimientosCrud = new CrudOperations('movimientos_inventario', context.token);

  const data = await movimientosCrud.findMany(
    {},
    {
      limit,
      offset,
      orderBy: { column: 'created_at', direction: 'desc' },
      include: ['producto', 'usuario'],
    }
  );

  return createSuccessResponse(data);
}, true);



/* ---------------------------------------------------------
 * POST — Registrar movimiento de inventario avanzado
 * ---------------------------------------------------------*/
export const POST = requestMiddleware(async (request, context) => {
  const body = await validateRequestBody(request);

  const required = ['producto_id', 'tipo_movimiento', 'cantidad'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return createErrorResponse({
        errorMessage: `El campo '${field}' es requerido`,
        status: 400,
      });
    }
  }

  const user_id = parseInt(context.payload?.sub || '');
  if (!user_id) {
    return createErrorResponse({
      errorMessage: 'Usuario no autenticado',
      status: 401,
    });
  }

  const producto_id = parseInt(body.producto_id);
  const cantidad = parseFloat(body.cantidad);
  const tipo = String(body.tipo_movimiento).toUpperCase(); // ENTRADA / SALIDA

  if (cantidad <= 0) {
    return createErrorResponse({
      errorMessage: 'La cantidad debe ser mayor a cero',
      status: 400,
    });
  }

  if (!['ENTRADA', 'SALIDA'].includes(tipo)) {
    return createErrorResponse({
      errorMessage: 'Tipo de movimiento inválido. Use ENTRADA o SALIDA',
      status: 400,
    });
  }


  /* ---------------------------------------------------------
   * Cargar datos del producto
   * ---------------------------------------------------------*/
  const productosCrud = new CrudOperations('productos', context.token);
  const producto = await productosCrud.findOne(producto_id);

  if (!producto) {
    return createErrorResponse({
      errorMessage: 'El producto no existe',
      status: 404,
    });
  }

  const stock_actual = parseFloat(producto.stock || 0);
  let stock_nuevo = stock_actual;


  /* ---------------------------------------------------------
   * Stock: Validación y cálculo
   * ---------------------------------------------------------*/
  if (tipo === 'ENTRADA') {
    stock_nuevo = stock_actual + cantidad;
  } else if (tipo === 'SALIDA') {
    if (cantidad > stock_actual) {
      return createErrorResponse({
        errorMessage: `Stock insuficiente. Stock actual: ${stock_actual}`,
        status: 400,
      });
    }
    stock_nuevo = stock_actual - cantidad;
  }


  /* ---------------------------------------------------------
   * TRANSACCIÓN (si CRUD soporta transaction)
   * ---------------------------------------------------------*/
  let movimiento;

  try {
    const movimientosCrud = new CrudOperations('movimientos_inventario', context.token);

    movimiento = await movimientosCrud.transaction(async (trx) => {
      // Registrar movimiento
      const mov = await trx.create({
        producto_id,
        tipo_movimiento: tipo,
        cantidad,
        user_id,
      });

      // Actualizar stock
      await trx.updateRelated('productos', producto_id, {
        stock: stock_nuevo,
        updated_at: new Date().toISOString(),
      });

      // Registrar auditoría
      await trx.createRelated('auditoria_movimientos', {
        movimiento_id: mov.id,
        user_id,
        accion: tipo === 'ENTRADA' ? 'AGREGAR_STOCK' : 'RETIRAR_STOCK',
        detalle: `Stock pasó de ${stock_actual} a ${stock_nuevo}`,
      });

      return mov;
    });

  } catch (error) {
    console.error('Error al registrar movimiento:', error);

    return createErrorResponse({
      errorMessage: 'Error interno al registrar movimiento',
      status: 500,
    });
  }

  return createSuccessResponse(
    {
      message: 'Movimiento registrado correctamente',
      movimiento,
      stock_anterior: stock_actual,
      stock_nuevo,
    },
    201
  );
}, true);
