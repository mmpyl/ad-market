'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api/client';
import { Producto } from '@/lib/schemas';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function ProductosManagement() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [page, setPage] = useState(1);

  // 🔍 buscador
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  const [formData, setFormData] = useState<Partial<Producto>>({
    estado: 'activo',
    stock_minimo: 10,
  });

  useEffect(() => {
    fetchProductos();
  }, [page, debouncedQuery]);

  const fetchProductos = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        `/productos-crud?limit=20&offset=${(page - 1) * 20}&search=${debouncedQuery}`
      );

      setProductos(res.data || []);
      setTotal(res.total || 0);
    } catch (error: any) {
      toast.error(error?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProducto(null);
    setFormData({ estado: 'activo', stock_minimo: 10 });
    setIsModalOpen(true);
  };

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData(producto);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    try {
      await api.delete(`/productos-crud/${id}`);
      toast.success('Producto eliminado');
      fetchProductos();
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar producto');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProducto?.id) {
        await api.put(`/productos-crud/${editingProducto.id}`, formData);
        toast.success('Producto actualizado');
      } else {
        await api.post('/productos-crud', formData);
        toast.success('Producto creado');
      }

      setIsModalOpen(false);
      fetchProductos();
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar producto');
    }
  };

  const columns = useMemo(
    () => [
      { key: 'nombre', label: 'Nombre' },
      { key: 'codigo_barras', label: 'Código' },
      {
        key: 'precio_venta',
        label: 'Precio',
        render: (value: number) => `S/. ${value.toFixed(2)}`,
      },
      { key: 'stock', label: 'Stock' },
      {
        key: 'estado',
        label: 'Estado',
        render: (value: string) => (
          <span
            className={`px-2 py-1 rounded text-sm ${
              value === 'activo'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {value}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </Button>
          </div>

          <DataTable
            data={productos}
            columns={columns}
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pagination={{
              page,
              pageSize: 20,
              total, 
              onPageChange: setPage,
            }}
          />
        </CardContent>
      </Card>

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
        onSubmit={handleSubmit}
      >
        <div className="space-y-3">
          <Input
            placeholder="Nombre del producto"
            value={formData.nombre || ''}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <Input
            placeholder="Código de barras"
            value={formData.codigo_barras || ''}
            onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
          />

          <Input
            type="number"
            placeholder="Precio de costo"
            value={formData.precio_costo ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                precio_costo: e.target.value ? parseFloat(e.target.value) : 0,
              })
            }
            required
            step="0.01"
          />

          <Input
            type="number"
            placeholder="Precio de venta"
            value={formData.precio_venta ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                precio_venta: e.target.value ? parseFloat(e.target.value) : 0,
              })
            }
            required
            step="0.01"
          />

          <Input
            type="number"
            placeholder="Stock"
            value={formData.stock ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                stock: e.target.value ? parseInt(e.target.value) : 0,
              })
            }
            required
          />

          <div>
            <label htmlFor="estado-select" className="block text-sm font-medium mb-1">Estado</label>
            <select
              id="estado-select"
              value={formData.estado || 'activo'}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'activo' | 'inactivo' })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

