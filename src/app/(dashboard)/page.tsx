'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Since middleware protects this route, user should be authenticated
    if (user) {
      // Redirect based on user role
      switch (user.rol_sistema) {
        case 'administrador':
          router.push('/admin');
          break;
        case 'vendedor':
          router.push('/vendedor');
          break;
        case 'almacenero':
          router.push('/almacen');
          break;
        case 'auditor':
          router.push('/auditoria');
          break;
        default:
          // Fallback to admin if role is unknown
          router.push('/admin');
          break;
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Redirigiendo al dashboard...</p>
      </div>
    </div>
  );
}
