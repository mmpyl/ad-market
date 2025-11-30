
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Barcode, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

interface CartItem {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export function VendedorDashboard() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const data = await api.get('/productos');
      setProductos(data.data || []);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;

    const producto = productos.find(p => p.codigo_barras === barcode);
    if (producto) {
      addToCart(producto);
      setBarcodeInput('');
    } else {
      toast.error('Producto no encontrado');
    }
  };

  const addToCart = (producto: any) => {
    const existingItem = cartItems.find(item => item.producto_id === producto.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.producto_id === producto.id
          ? {
              ...item,
              cantidad: item.cantidad + 1,
              subtotal: (item.cantidad + 1) * item.precio_unitario,
            }
          : item
      ));
    } else {
      setCartItems([
        ...cartItems,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precio_unitario: producto.precio_venta,
          subtotal: producto.precio_venta,
        },
      ]);
    }
    toast.success(`${producto.nombre} agregado al carrito`);
  };

  const removeFromCart = (producto_id: number) => {
    setCartItems(cartItems.filter(item => item.producto_id !== producto_id));
  };

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const processPayment = async () => {
    if (cartItems.length === 0) return;

    try {
      setLoading(true);

      // Crear la venta
      const ventaData = {
        numero_venta: `VEN-${Date.now()}`,
        tipo_comprobante: 'BOLETA',
        total: total * 1.18, // Incluyendo IGV
        igv: total * 0.18,
        subtotal: total,
      };

      const venta = await api.post('/ventas', ventaData);

      // Crear los detalles de la venta
      const detallesPromises = cartItems.map(item =>
        api.post('/venta-detalles', {
          venta_id: venta.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
        })
      );

      await Promise.all(detallesPromises);

      // Limpiar el carrito
      setCartItems([]);
      toast.success('Venta procesada exitosamente');

    } catch (error) {
      console.error('Error al procesar la venta:', error);
      toast.error('Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Búsqueda y Carrito */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Barcode className="w-5 h-5" />
              Escanear Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escanear código de barras..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeSearch(barcodeInput);
                  }
                }}
                autoFocus
              />
              <Button onClick={() => handleBarcodeSearch(barcodeInput)}>
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrito de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                El carrito está vacío
              </p>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.producto_id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.cantidad} x S/. {item.precio_unitario.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">S/. {item.subtotal.toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.producto_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen de Venta */}
      <Card className="h-fit sticky top-20">
        <CardHeader>
          <CardTitle>Resumen de Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 border-b pb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>S/. {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV (18%):</span>
              <span>S/. {(total * 0.18).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>S/. {(total * 1.18).toFixed(2)}</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={cartItems.length === 0 || loading}
            onClick={processPayment}
          >
            {loading ? 'Procesando...' : 'Procesar Pago'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
