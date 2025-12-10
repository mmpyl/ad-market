'use client';

import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { DollarSign, Edit, Package, Plus, Tag, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// ==================== Types ====================
interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_costo: number;
  precio_venta: number;
  categoria_id?: number;
  proveedor_id?: number;
  stock: number;
  activo: boolean;
  categoria?: { nombre: string };
  proveedor?: { nombre: string };
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Proveedor {
  id: number;
  nombre: string;
}

// ==================== ProductosManagement Component ====================
export function ProductosManagement() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_costo: 0,
    precio_venta: 0,
    categoria_id: '',
    proveedor_id: '',
    stock: 0,
    activo: true,
  });

  // ==================== Data Fetching ====================
  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ data: Producto[] }>('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error('Error fetching productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategorias = useCallback(async () => {
    try {
      const response = await api.get<{ data: Categoria[] }>('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  }, []);

  const fetchProveedores = useCallback(async () => {
    try {
      const response = await api.get<{ data: Proveedor[] }>('/proveedores');
      setProveedores(response.data);
    } catch (error) {
      console.error('Error fetching proveedores:', error);
    }
  }, []);

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
    fetchProveedores();
  }, [fetchProductos, fetchCategorias, fetchProveedores]);

  // ==================== Form Handling ====================
  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio_costo: 0,
      precio_venta: 0,
      categoria_id: '',
      proveedor_id: '',
      stock: 0,
      activo: true,
    });
    setEditingProducto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }

    if (formData.precio_costo < 0 || formData.precio_venta < 0) {
      toast.error('Los precios no pueden ser negativos');
      return;
    }

    if (formData.stock < 0) {
      toast.error('El stock no puede ser negativo');
      return;
    }

    try {
      const payload = {
        ...formData,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : null,
      };

      if (editingProducto) {
        await api.put(`/productos/${editingProducto.id}`, payload);
        toast.success('Producto actualizado correctamente');
      } else {
        await api.post('/productos', payload);
        toast.success('Producto creado correctamente');
      }

      setDialogOpen(false);
      resetForm();
      fetchProductos();
    } catch (error) {
      console.error('Error saving producto:', error);
      toast.error('Error al guardar el producto');
    }
  };

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio_costo: producto.precio_costo,
      precio_venta: producto.precio_venta,
      categoria_id: producto.categoria_id?.toString() || '',
      proveedor_id: producto.proveedor_id?.toString() || '',
      stock: producto.stock,
      activo: producto.activo,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      await api.delete(`/productos/${id}`);
      toast.success('Producto eliminado correctamente');
      fetchProductos();
    } catch (error) {
      console.error('Error deleting producto:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  // ==================== Table Columns ====================
  const columns = [
    {
      key: 'nombre',
      header: 'Producto',
      render: (producto: Producto) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <div>
            <div className="font-medium">{producto.nombre}</div>
            {producto.descripcion && (
              <div className="text-sm text-gray-500">{producto.descripcion}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (producto: Producto) => (
        <Badge variant="outline">
          {producto.categoria?.nombre || 'Sin categoría'}
        </Badge>
      ),
    },
    {
      key: 'precios',
      header: 'Precios',
      render: (producto: Producto) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="w-3 h-3 text-green-600" />
            <span>Costo: S/. {producto.precio_costo.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Tag className="w-3 h-3 text-blue-600" />
            <span>Venta: S/. {producto.precio_venta.toFixed(2)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (producto: Producto) => (
        <Badge variant={producto.stock > 0 ? 'default' : 'destructive'}>
          {producto.stock}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (producto: Producto) => (
        <Badge variant={producto.activo ? 'default' : 'secondary'}>
          {producto.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (producto: Producto) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(producto)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(producto.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Productos</h2>
          <p className="text-muted-foreground">
            Administra el catálogo de productos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio_costo">Precio Costo</Label>
                  <Input
                    id="precio_costo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_costo}
                    onChange={(e) => setFormData({ ...formData, precio_costo: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio_venta">Precio Venta</Label>
                  <Input
                    id="precio_venta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria_id">Categoría</Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin categoría</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proveedor_id">Proveedor</Label>
                  <Select
                    value={formData.proveedor_id}
                    onValueChange={(value) => setFormData({ ...formData, proveedor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin proveedor</SelectItem>
                      {proveedores.map((prov) => (
                        <SelectItem key={prov.id} value={prov.id.toString()}>
                          {prov.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProducto ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={productos}
            columns={columns}
            loading={loading}
            searchPlaceholder="Buscar productos..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
