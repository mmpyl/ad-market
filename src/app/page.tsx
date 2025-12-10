'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { AdminDashboard } from '../components/dashboard/admin-dashboard';
import { AlmacenDashboard } from '../components/dashboard/almacen-dashboard';
import { AuditorDashboard } from '../components/dashboard/auditor-dashboard';
import { RoleNav } from '../components/dashboard/role-nav';
import { VendedorDashboard } from '../components/dashboard/vendedor-dashboard';

type RolSistema = 'vendedor' | 'almacenero' | 'administrador' | 'auditor';

// Componente de loading mejorado
function LoadingSpinner() {
  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900"
      role="status"
      aria-label="Cargando"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

// Map de roles a componentes para mejor type safety
const DASHBOARD_COMPONENTS: Record<RolSistema, React.ComponentType> = {
  vendedor: VendedorDashboard,
  almacenero: AlmacenDashboard,
  administrador: AdminDashboard,
  auditor: AuditorDashboard,
};

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Memoizar el rol del usuario
  const userRole = useMemo(() => {
    return user?.rol_sistema as RolSistema | undefined;
  }, [user]);

  // Handler de redirección memoizado - solo redirige si NO está cargando y NO hay usuario
  const handleRedirect = useCallback(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    handleRedirect();
  }, [handleRedirect]);

  // Memoizar el componente de dashboard
  const DashboardComponent = useMemo(() => {
    if (!userRole) return VendedorDashboard;
    return DASHBOARD_COMPONENTS[userRole] || VendedorDashboard;
  }, [userRole]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // No user state (en proceso de redirección)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <RoleNav />
      <main className="container mx-auto px-4 py-8">
        <DashboardComponent />
      </main>
    </div>
  );
}
