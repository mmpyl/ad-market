import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Filter, Clock, Calendar, BarChart } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AuditLog } from '@/lib/schemas';

// -------------------------
// auditoria.service.ts (embedded)
// -------------------------
const auditoriaService = {
  // list with pagination + optional filters: tabla, accion, from, to, search
  list: async (params: Record<string, any>) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/auditoria/list?${qs}`);
  },
  // summary: total, acciones_hoy, por_accion
  summary: async () => api.get('/auditoria/resumen'),
  // stats for charting
  stats: async (params: Record<string, any>) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/auditoria/stats?${qs}`);
  },
};

// -------------------------
// useAuditoria hook
// -------------------------
function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useAuditoria({ pageSize = 20 } = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [tabla, setTabla] = useState('');
  const [accion, setAccion] = useState('');
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const debTabla = useDebouncedValue(tabla, 350);
  const debAccion = useDebouncedValue(accion, 350);

  useEffect(() => {
    fetchList();
  }, [page, debTabla, debAccion, from, to]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      };
      if (debTabla) params.tabla = debTabla;
      if (debAccion) params.accion = debAccion;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await auditoriaService.list(params);
      // expected: { data: AuditLog[], total: number }
      setLogs(res?.data || []);
      setTotal(res?.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await auditoriaService.summary();
      return res;
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar resumen');
      return null;
    }
  };

  const fetchStats = async (params: Record<string, any> = {}) => {
    try {
      const res = await auditoriaService.stats(params);
      return res?.data || [];
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar estadísticas');
      return [];
    }
  };

  return {
    logs,
    total,
    page,
    setPage,
    loading,
    tabla,
    setTabla,
    accion,
    setAccion,
    from,
    setFrom,
    to,
    setTo,
    fetchList,
    fetchSummary,
    fetchStats,
  };
}

// -------------------------
// Small helper: colour by action
// -------------------------
const getAccionColor = (acc?: string) => {
  const map: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    VIEW: 'bg-gray-100 text-gray-800',
  };
  return map[acc || ''] || 'bg-gray-100 text-gray-800';
};

// -------------------------
// AuditoriaDashboard (charts + summary)
// -------------------------
function AuditoriaDashboard({ fetchSummary, fetchStats }: any) {
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const s = await fetchSummary();
      setSummary(s?.data || s || null);
      const stats = await fetchStats({ range: '30d' });
      setSeries(stats || []);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Resumen Auditoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-white rounded shadow-sm">
            <p className="text-sm text-gray-600 flex items-center gap-2"><Clock className="w-4 h-4"/> Acciones hoy</p>
            <p className="text-2xl font-bold">{summary?.acciones_hoy ?? '-'}</p>
          </div>
          <div className="p-3 bg-white rounded shadow-sm">
            <p className="text-sm text-gray-600">Total registros</p>
            <p className="text-2xl font-bold">{summary?.total ?? '-'}</p>
          </div>
          <div className="p-3 bg-white rounded shadow-sm">
            <p className="text-sm text-gray-600">Usuarios distintos</p>
            <p className="text-2xl font-bold">{summary?.usuarios_distintos ?? '-'}</p>
          </div>
        </div>

        <div style={{ height: 240 }} className="w-full bg-white p-3 rounded">
          {series.length === 0 ? (
            <div className="text-sm text-gray-500">Sin datos para graficar</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------
// AuditoriaFilters
// -------------------------
function AuditoriaFilters({ tabla, setTabla, accion, setAccion, from, to, setFrom, setTo, onRefresh }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/> Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          <Input placeholder="Tabla (ej: productos)" value={tabla} onChange={(e) => setTabla(e.target.value)} />
          <Input placeholder="Acción (CREATE|UPDATE|DELETE)" value={accion} onChange={(e) => setAccion(e.target.value)} />
          <Input type="date" value={from || ''} onChange={(e) => setFrom(e.target.value || null)} />
          <Input type="date" value={to || ''} onChange={(e) => setTo(e.target.value || null)} />
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={onRefresh}>Aplicar</Button>
          <Button variant="ghost" onClick={() => { setTabla(''); setAccion(''); setFrom(null); setTo(null); onRefresh(); }}>Limpiar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------
// AuditoriaTable
// -------------------------
function AuditoriaTable({ logs, loading, page, setPage, total }: any) {
  const columns = useMemo(() => [
    {
      key: 'created_at',
      label: 'Fecha',
      render: (value: string) => new Date(value).toLocaleString('es-PE'),
    },
    { key: 'accion', label: 'Acción' },
    { key: 'tabla', label: 'Tabla' },
    { key: 'registro_id', label: 'ID Registro' },
    {
      key: 'usuario_id',
      label: 'Usuario',
      render: (v: number) => `Usuario #${v}`,
    },
    {
      key: 'accion_estado',
      label: 'Estado',
      render: (_: any, row: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getAccionColor(row.accion)}`}>
          {row.accion}
        </span>
      ),
    },
  ], []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5"/> Registro de Auditoría</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable data={logs} columns={columns} isLoading={loading} actions={false} pagination={{ page, pageSize: 20, total, onPageChange: setPage }} />
      </CardContent>
    </Card>
  );
}

// -------------------------
// AuditoriaPanel (main export)
// -------------------------
export default function AuditoriaPanel() {
  const aud = useAuditoria();
  const [summary, setSummary] = useState<any>(null);

  const handleRefresh = async () => {
    aud.setPage(1);
    await aud.fetchList();
    const s = await aud.fetchSummary();
    setSummary(s?.data || s || null);
  };

  useEffect(() => {
    (async () => {
      await handleRefresh();
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <AuditoriaDashboard fetchSummary={aud.fetchSummary} fetchStats={aud.fetchStats} />
        </div>
        <div>
          <AuditoriaFilters
            tabla={aud.tabla}
            setTabla={aud.setTabla}
            accion={aud.accion}
            setAccion={aud.setAccion}
            from={aud.from}
            to={aud.to}
            setFrom={aud.setFrom}
            setTo={aud.setTo}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      <AuditoriaTable logs={aud.logs} loading={aud.loading} page={aud.page} setPage={aud.setPage} total={aud.total} />

    </div>
  );
}
