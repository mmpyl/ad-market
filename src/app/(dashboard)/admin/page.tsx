'use client';

import { AuditoriaManagement } from '@/components/crud/AuditoriaManagement';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { InventarioManagement } from '@/components/inventario/InventarioManagement';
import { ProductosManagement } from '@/components/productos/ProductosManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsuariosManagement } from '@/components/usuarios/UsuariosManagement';
import { VentasManagement } from '@/components/ventas/VentasManagement';
import {
  BarChart3,
  Package,
  Shield,
  ShoppingCart,
  Users,
  Warehouse,
} from 'lucide-react';
import { useCallback, useState } from 'react';

type TabValue = 'dashboard' | 'usuarios' | 'productos' | 'ventas' | 'inventario' | 'auditoria';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona usuarios, productos, ventas e inventario del sistema
        </p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger
            value="dashboard"
            className="gap-2"
            aria-label="Ver dashboard administrativo"
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            <span>Dashboard</span>
          </TabsTrigger>

          <TabsTrigger
            value="usuarios"
            className="gap-2"
            aria-label="Gestionar usuarios"
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            <span>Usuarios</span>
          </TabsTrigger>

          <TabsTrigger
            value="productos"
            className="gap-2"
            aria-label="Gestionar productos"
          >
            <Package className="w-4 h-4" aria-hidden="true" />
            <span>Productos</span>
          </TabsTrigger>

          <TabsTrigger
            value="ventas"
            className="gap-2"
            aria-label="Gestionar ventas"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            <span>Ventas</span>
          </TabsTrigger>

          <TabsTrigger
            value="inventario"
            className="gap-2"
            aria-label="Gestionar inventario"
          >
            <Warehouse className="w-4 h-4" aria-hidden="true" />
            <span>Inventario</span>
          </TabsTrigger>

          <TabsTrigger
            value="auditoria"
            className="gap-2"
            aria-label="Ver auditoría del sistema"
          >
            <Shield className="w-4 h-4" aria-hidden="true" />
            <span>Auditoría</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dashboard */}
        <TabsContent
          value="dashboard"
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <AdminDashboard />
        </TabsContent>

        {/* Tab: Usuarios */}
        <TabsContent
          value="usuarios"
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <UsuariosManagement />
        </TabsContent>

        {/* Tab: Productos */}
        <TabsContent
          value="productos"
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <ProductosManagement />
        </TabsContent>

        {/* Tab: Ventas */}
        <TabsContent
          value="ventas"
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <VentasManagement />
        </TabsContent>

        {/* Tab: Inventario */}
        <TabsContent
          value="inventario"
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <InventarioManagement />
        </TabsContent>

        {/* Tab: Auditoría */}
        <TabsContent
          value="auditoria"
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <AuditoriaManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
