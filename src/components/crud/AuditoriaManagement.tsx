'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { AuditLog } from '@/lib/schemas';
import { Activity, Clock, Filter } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
      });

      if (filtro.trim()) {
        params.append('tabla', filtro.trim());
      }

      const res = await api.get(`/auditoria?${params.toString()}`);

      // Normalizar respuesta de la API
      const responseData = res?.data || res;
      setLogs(Array.isArray(responseData.data) ? responseData.data : []);
      setTotal(typeof responseData.total === 'number' ? responseData.total : 0);
    } catch (error) {
      console.error('Error al cargar auditoría:', error);
      toast.error('Error al cargar el registro de auditoría');
      setLogs([]);
      setTotal(0);
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
  const getAccionColor = useCallback((accion: string): string => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      VIEW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[accion] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }, []);

  // ==========================
  // MEMO: ESTADÍSTICAS
  // ==========================
  const estadisticas = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const accionesHoy = logs.filter(log => {
      if (!log.created_at) return false;
      const logDate = new Date(log.created_at);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;

    const resumenAcciones = ['CREATE', 'UPDATE', 'DELETE', 'VIEW'].map(accion => ({
      accion,
      count: logs.filter(l => l.accion === accion).length,
      label: {
        CREATE: 'Creaciones',
        UPDATE: 'Actualizaciones',
        DELETE: 'Eliminaciones',
        VIEW: 'Visualizaciones'
      }[accion] || accion
    }));

    return { accionesHoy, resumenAcciones };
  }, [logs]);

  // ==========================
  // COLUMNS
  // ==========================
  const columns = useMemo(
    () => [
      {
        key: 'created_at' as const,
        label: 'Fecha y Hora',
        render: (value: string) => formatDate(value)
      },
      {
        key: 'accion' as const,
        label: 'Acción',
        render: (value: string) => (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getAccionColor(value)}`}
          >
            {value}
          </span>
        )
      },
      {
        key: 'tabla' as const,
        label: 'Tabla',
        render: (value: string) => (
          <span className="font-mono text-sm">{value}</span>
        )
      },
      {
        key: 'registro_id' as const,
        label: 'ID Registro',
        render: (value: number | string) => (
          <span className="font-mono text-sm text-gray-600">{value}</span>
        )
      },
      {
        key: 'usuario_id' as const,
        label: 'Usuario',
        render: (value: number) => (
          <span className="text-sm">Usuario #{value}</span>
        )
      }
    ],
    [formatDate, getAccionColor]
  );

  // ==========================
  // HANDLERS
  // ==========================
  const handleFiltroChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltro(e.target.value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Acciones Hoy
                </p>
                <p className="text-2xl font-bold mt-1">{estadisticas.accionesHoy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Total Registros
                </p>
                <p className="text-2xl font-bold mt-1">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Página Actual</p>
              <p className="text-2xl font-bold">
                {page} de {Math.ceil(total / limit) || 1}
              </p>
            </div>
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
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Filtrar por tabla (ej: ventas, productos, usuarios)..."
              value={filtro}
              onChange={handleFiltroChange}
              className="flex-1"
            />
            {filtro && (
              <button
                onClick={() => {
                  setFiltro('');
                  setPage(1);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Limpiar filtro
              </button>
            )}
          </div>

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

      {/* Resumen de Actividad */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {estadisticas.resumenAcciones.map(({ accion, count, label }) => (
              <div
                key={accion}
                className="flex flex-col p-4 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{count}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${getAccionColor(accion)}`}
                  >
                    {accion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
