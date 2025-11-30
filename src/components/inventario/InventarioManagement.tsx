'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { Inventario } from '@/lib/schemas';
import { AlertCircle, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function InventarioManagement() {
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventario | null>(null);
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState<Partial<Inventario>>({
    estado: 'disponible',
  });

  const pageSize = 20;

  /** ---------------------------
   *  FETCH INVENTARIO
   * -------------------------- */
  const fetchInventario = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/inventario?limit=${pageSize}&offset=${(page - 1) * pageSize}`
      );

      setInventario(response?.data?.items || []);
      setTotalRecords(response?.data?.total || 0);
    } catch (error) {
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchInventario();
  }, [fetchInventario]);

  /** ---------------------------
   *  HANDLERS
   * -------------------------- */

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ estado: 'disponible' });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Inventario) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    try {
      await api.delete(`/inventario/${id}`);
      toast.success('Registro eliminado');
      fetchInventario();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingItem?.id) {
        await api.put(`/inventario/${editingItem.id}`, formData);
        toast.success('Inventario actualizado');
      } else {
        await api.post(`/inventario`, formData);
        toast.success('Inventario creado');
      }

      setIsModalOpen(false);
      fetchInventario();
    } catch {
      toast.error('Error al guardar');
    }
  };

  /** ---------------------------
   *  COLUMNS (memoized)
   * -------------------------- */
  const columns = useMemo(
    () => [
      { key: 'producto_id' as const, label: 'Producto ID' },
      { key: 'cantidad' as const, label: 'Cantidad' },
      { key: 'ubicacion' as const, label: 'Ubicación' },
      { key: 'lote' as const, label: 'Lote' },
      {
        key: 'estado' as const,
        label: 'Estado',
        render: (value: string) => (
          <span
            className={`px-2 py-1 rounded text-sm ${
              value === 'disponible'
                ? 'bg-green-100 text-green-800'
                : value === 'reservado'
                ? 'bg-yellow-100 text-yellow-800'
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

  /** ---------------------------
   *  COUNTERS (memoized)
   * -------------------------- */
  const stats = useMemo(() => {
    return {
      disponible: inventario.filter((i) => i.estado === 'disponible').length,
      reservado: inventario.filter((i) => i.estado === 'reservado').length,
      danado: inventario.filter((i) => i.estado === 'dañado').length,
    };
  }, [inventario]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Disponible</p>
            <p className="text-2xl font-bold">{stats.disponible}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Reservado</p>
            <p className="text-2xl font-bold">{stats.reservado}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Dañado
            </p>
            <p className="text-2xl font-bold">{stats.danado}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Inventario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </Button>

          <DataTable
            data={inventario}
            columns={columns}
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pagination={{
              page,
              pageSize,
              total: totalRecords,
              onPageChange: setPage,
            }}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingItem ? 'Editar Inventario' : 'Nuevo Registro'}
        onSubmit={handleSubmit}
      >
        <div className="space-y-3">
          <Input
            type="number"
            placeholder="ID del Producto"
            value={formData.producto_id ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, producto_id: Number(e.target.value) })
            }
            required
          />

          <Input
            type="number"
            placeholder="Cantidad"
            value={formData.cantidad ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, cantidad: Number(e.target.value) })
            }
            required
          />

          <Input
            placeholder="Ubicación (Ej: Estante A-1)"
            value={formData.ubicacion ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, ubicacion: e.target.value })
            }
          />

          <Input
            placeholder="Lote"
            value={formData.lote ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, lote: e.target.value })
            }
          />

          <select
            title="Estado del inventario"
            value={formData.estado ?? 'disponible'}
            onChange={(e) =>
              setFormData({ ...formData, estado: e.target.value as any })
            }
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="disponible">Disponible</option>
            <option value="reservado">Reservado</option>
            <option value="dañado">Dañado</option>
          </select>
        </div>
      </FormModal>
    </div>
  );
}
