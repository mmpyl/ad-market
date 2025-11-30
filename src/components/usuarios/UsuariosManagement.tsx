'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { Usuario } from '@/lib/schemas';
import { Plus, Shield } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function UsuariosManagement() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState<Partial<Usuario>>({
    estado: 'activo',
    rol: 'vendedor',
  });

  // -------------------------------------------------------
  // 🔹 1. Obtener Usuarios (Memo + Callback = evita rerenders)
  // -------------------------------------------------------
  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/auth/users?limit=20&offset=${(page - 1) * 20}`
      );

      setUsuarios(data ?? []);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // -------------------------------------------------------
  // 🔹 2. Crear Usuario
  // -------------------------------------------------------
  const handleCreate = () => {
    setEditingUsuario(null);
    setFormData({
      estado: 'activo',
      rol: 'vendedor',
    });
    setIsModalOpen(true);
  };

  // -------------------------------------------------------
  // 🔹 3. Editar Usuario
  // -------------------------------------------------------
  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData(usuario);
    setIsModalOpen(true);
  };

  // -------------------------------------------------------
  // 🔹 4. Eliminar Usuario
  // -------------------------------------------------------
  const handleDelete = async (id: number | string) => {
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('Usuario eliminado');
      fetchUsuarios();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  // -------------------------------------------------------
  // 🔹 5. Guardar (Crear o Actualizar)
  // -------------------------------------------------------
  const handleSubmit = async () => {
    try {
      if (editingUsuario?.id) {
        await api.put(`/auth/users/${editingUsuario.id}`, formData);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/add-user', formData);
        toast.success('Usuario creado');
      }

      setIsModalOpen(false);
      fetchUsuarios();
    } catch (error) {
      toast.error('Error al guardar usuario');
    }
  };

  // -------------------------------------------------------
  // 🔹 6. Colores por rol (Memo)
  // -------------------------------------------------------
  const getRolColor = useCallback((rol: string) => {
    const colors: Record<string, string> = {
      administrador: 'bg-red-100 text-red-800',
      vendedor: 'bg-blue-100 text-blue-800',
      almacenero: 'bg-purple-100 text-purple-800',
      auditor: 'bg-orange-100 text-orange-800',
    };
    return colors[rol] ?? 'bg-gray-100 text-gray-800';
  }, []);

  // -------------------------------------------------------
  // 🔹 7. Columnas de Tabla (Memo = Mejor performance)
  // -------------------------------------------------------
  const columns = useMemo(
    () => [
      { key: 'nombre' as const, label: 'Nombre' },
      { key: 'email' as const, label: 'Email' },
      {
        key: 'rol' as const,
        label: 'Rol',
        render: (value: string) => (
          <span className={`px-2 py-1 rounded text-sm font-medium ${getRolColor(value)}`}>
            {value}
          </span>
        ),
      },
      {
        key: 'estado' as const,
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
    [getRolColor]
  );

  // -------------------------------------------------------
  // 🔹 8. Resumen de roles (Memo)
  // -------------------------------------------------------
  const roleStats = useMemo(
    () => [
      { role: 'administrador', count: usuarios.filter((u) => u.rol === 'administrador').length },
      { role: 'vendedor', count: usuarios.filter((u) => u.rol === 'vendedor').length },
      { role: 'almacenero', count: usuarios.filter((u) => u.rol === 'almacenero').length },
      { role: 'auditor', count: usuarios.filter((u) => u.rol === 'auditor').length },
    ],
    [usuarios]
  );

  // -------------------------------------------------------
  // 🔹 Render
  // -------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {roleStats.map((stat) => (
          <Card key={stat.role}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 capitalize">{stat.role}</p>
              <p className="text-2xl font-bold">{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestión de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </Button>

          <DataTable
            data={usuarios}
            columns={columns}
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pagination={{
              page,
              pageSize: 20,
              total: usuarios.length,
              onPageChange: setPage,
            }}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
        onSubmit={handleSubmit}
      >
        <div className="space-y-3">
          <Input
            placeholder="Nombre"
            value={formData.nombre ?? ''}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />

          <Input
            placeholder="Apellido"
            value={formData.apellido ?? ''}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
          />

          <Input
            type="email"
            placeholder="Email"
            value={formData.email ?? ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            type="tel"
            placeholder="Teléfono"
            value={formData.telefono ?? ''}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          />

          <select
            title="Rol del usuario"
            value={formData.rol ?? 'vendedor'}
            onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="administrador">Administrador</option>
            <option value="vendedor">Vendedor</option>
            <option value="almacenero">Almacenero</option>
            <option value="auditor">Auditor</option>
          </select>

          <select
            title="Estado del usuario"
            value={formData.estado ?? 'activo'}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </FormModal>
    </div>
  );
}
