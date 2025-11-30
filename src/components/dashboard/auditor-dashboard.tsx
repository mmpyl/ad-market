
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { FileText, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AuditoriaRecord {
  id: number;
  user_id: number;
  tabla: string;
  accion: string;
  descripcion?: string;
  created_at: string;
}

export function AuditorDashboard() {
  const [records, setRecords] = useState<AuditoriaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAccion, setFilterAccion] = useState('');

  useEffect(() => {
    fetchAuditoria();
  }, []);

  const fetchAuditoria = async () => {
    try {
      setLoading(true);
      const data = await api.get('/auditoria');
      setRecords(data.data || []);
    } catch (error) {
      toast.error('Error al cargar registros de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = filterAccion
    ? records.filter(r => r.accion === filterAccion)
    : records;

  const getAccionColor = (accion: string) => {
    const colors: Record<string, string> = {
      crear: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
      actualizar: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
      eliminar: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',
      venta: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
      pago: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
      inventario: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100',
      login: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100',
      logout: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100',
    };
    return colors[accion] || 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Registro de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Filtrar por acción..."
              value={filterAccion}
              onChange={(e) => setFilterAccion(e.target.value)}
            />
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer" title="Filter">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay registros de auditoría
              </p>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getAccionColor(record.accion)}`}>
                          {record.accion.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {record.tabla}
                        </span>
                      </div>
                      {record.descripcion && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {record.descripcion}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(record.created_at).toLocaleString('es-PE')}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      Usuario ID: {record.user_id}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
