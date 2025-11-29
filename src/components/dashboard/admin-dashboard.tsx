'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  TrendingUp,
  Package,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

// ------------------ Types ------------------
interface Stats {
  totalVentas: number;
  totalInventario: number;
  totalUsuarios: number;
  ganancias: number;
}

interface Tab {
  value: string;
  label: string;
  description: string;
}

// ------------------ Reusable Components ------------------
interface StatCardProps {
  title: string;
  value: string | number;
  icon: JSX.Element;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, subtitle }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>}
    </CardContent>
  </Card>
);

// ------------------ Dashboard Component ------------------
export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalVentas: 0,
    totalInventario: 0,
    totalUsuarios: 0,
    ganancias: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Tabs data
  const tabs: Tab[] = [
    { value: 'ventas', label: 'Ventas', description: 'Reportes de ventas diarios, semanales y mensuales' },
    { value: 'inventario', label: 'Inventario', description: 'Análisis de inventario y movimientos' },
    { value: 'ganancias', label: 'Ganancias', description: 'Análisis de rentabilidad y márgenes' },
  ];

  // ------------------ Fetch Stats ------------------
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [ventasRes, inventarioRes, usuariosRes] = await Promise.allSettled([
        api.get<{ data: any[] }>('/ventas?limit=100&offset=0'),
        api.get<{ data: any[] }>('/inventario'),
        api.get<{ data: any[] }>('/auth/users'),
      ]);

      const ventasData = ventasRes.status === 'fulfilled' ? ventasRes.value.data : [];
      const inventarioData = inventarioRes.status === 'fulfilled' ? inventarioRes.value.data : [];
      const usuariosData = usuariosRes.status === 'fulfilled' ? usuariosRes.value.data : [];

      setStats({
        totalVentas: ventasData.reduce((sum, v) => sum + (v.total || 0), 0),
        ganancias: ventasData.reduce((sum, v) => sum + (v.ganancia || 0), 0),
        totalInventario: inventarioData.length,
        totalUsuarios: usuariosData.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Render ------------------
  return (
    <div className="space-y-6">
      {loading && <div className="text-center py-4 text-gray-600">Cargando estadísticas...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas Totales"
          value={`S/. ${stats.totalVentas.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          subtitle="Este mes"
        />
        <StatCard
          title="Ganancias"
          value={`S/. ${stats.ganancias.toFixed(2)}`}
          icon={<BarChart3 className="h-4 w-4 text-green-600" />}
          subtitle="Margen neto"
        />
        <StatCard
          title="Inventario"
          value={stats.totalInventario}
          icon={<Package className="h-4 w-4 text-purple-600" />}
          subtitle="Productos activos"
        />
        <StatCard
          title="Usuarios"
          value={stats.totalUsuarios}
          icon={<Users className="h-4 w-4 text-orange-600" />}
          subtitle="Activos en el sistema"
        />
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin', title: 'Administración', subtitle: 'Gestionar sistema', icon: <Settings className="w-5 h-5 text-blue-600" /> },
          { href: '/vendedor', title: 'Ventas', subtitle: 'Gestionar ventas', icon: <ShoppingCart className="w-5 h-5 text-green-600" /> },
          { href: '/almacen', title: 'Almacén', subtitle: 'Gestionar inventario', icon: <Package className="w-5 h-5 text-purple-600" /> },
          { href: '/auditoria', title: 'Auditoría', subtitle: 'Ver registros', icon: <BarChart3 className="w-5 h-5 text-orange-600" /> },
        ].map(link => (
          <Link key={link.href} href={link.href}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{link.title}</p>
                    <p className="text-xs text-gray-600">{link.subtitle}</p>
                  </div>
                  {link.icon}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Report Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ventas" className="w-full">
            <TabsList>
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>

            {tabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">{tab.description}</p>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
