'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Filter, Clock } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { AuditLog } from '@/lib/schemas';

export function AuditoriaManagement() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtro, setFiltro] = useState('');

  const limit = 20;

  // ==========================
  // FETCH LOGS
  // ==========================
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
        ...(filtro && { tabla: filtro })
      });

      const res = await api.get(`/auditoria?${params.toString()}`);

      // API puede devolver: { data: [], total: number }
      setLogs(res?.data?.data || res?.data || []);
      setTotal(res?.data?.total || res?.total || 0);
    } catch (error) {
      toast.error('Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  }, [page, filtro]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ==========================
  // HELPERS
  // ==========================
  const getAccionColor = (accion: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      VIEW: 'bg-gray-100 text-gray-800'
    };
    return colors[accion] || 'bg-gray-100 text-gray-800';
  };

  // ==========================
  // MEMO: RESÚMENES
  // ==========================
  const accionesHoy = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter(log => new Date(log.created_at || '').toDateString() === today).length;
  }, [logs]);

  const resumenAcciones = useMemo(() => {
    return ['CREATE', 'UPDATE', 'DELETE'].map(accion => ({
      accion,
      count: logs.filter(l => l.accion === accion).length
    }));
  }, [logs]);

  // ==========================
  // COLUMNS
  // ==========================
  const columns = useMemo(
    () => [
      {
        key: 'created_at' as const,
        label: 'Fecha',
        render: (value: string) => new Date(value).toLocaleString('es-PE')
      },
      { key: 'accion' as const, label: 'Acción' },
      { key: 'tabla' as const, label: 'Tabla' },
      { key: 'registro_id' as const, label: 'ID Registro' },
      {
        key: 'usuario_id' as const,
        label: 'Usuario',
        render: (value: number) => `Usuario #${value}`
      },
      {
        key: 'estado' as const,
        label: 'Estado',
        render: (_: any, row: AuditLog) => (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getAccionColor(
              row.accion
            )}`}
          >
            {row.accion}
          </span>
        )
      }
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Acciones Hoy
            </p>
            <p className="text-2xl font-bold">{accionesHoy}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Registros</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Registro de Auditoría
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="Filtrar por tabla (ej: ventas, productos, usuarios)..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPage(1);
            }}
          />

          <DataTable
            data={logs}
            columns={columns}
            isLoading={loading}
            actions={false}
            pagination={{
              page,
              pageSize: limit,
              total,
              onPageChange: setPage
            }}
          />
        </CardContent>
      </Card>

      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {resumenAcciones.map(({ accion, count }) => (
              <div
                key={accion}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <span className="capitalize">{accion.toLowerCase()}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
