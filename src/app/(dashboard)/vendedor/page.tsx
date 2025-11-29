'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { VentasManagement } from '@/components/crud/VentasManagement';
import { 
  ShoppingCart, 
  Receipt, 
  Info, 
  TrendingUp, 
  BarChart3, 
  FileText 
} from 'lucide-react';

type TabValue = 'ventas' | 'reportes';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export default function VendedorPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('ventas');

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  // Memoizar las funcionalidades futuras de reportes
  const reportFeatures: Feature[] = useMemo(() => [
    {
      icon: TrendingUp,
      title: 'Análisis de Ventas',
      description: 'Visualiza tendencias, picos de ventas y patrones de comportamiento'
    },
    {
      icon: BarChart3,
      title: 'Reportes Financieros',
      description: 'Genera reportes de ingresos, márgenes y rentabilidad'
    },
    {
      icon: FileText,
      title: 'Exportación de Datos',
      description: 'Exporta reportes en PDF, Excel y otros formatos'
    }
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Ventas</h1>
        <p className="text-muted-foreground mt-2">
          Administra todas tus ventas y comprobantes
        </p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger 
            value="ventas" 
            className="gap-2"
            aria-label="Ver mis ventas"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            <span>Mis Ventas</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="reportes" 
            className="gap-2"
            aria-label="Ver reportes de ventas"
          >
            <Receipt className="w-4 h-4" aria-hidden="true" />
            <span>Reportes</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Ventas */}
        <TabsContent 
          value="ventas" 
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <VentasManagement />
        </TabsContent>

        {/* Tab: Reportes */}
        <TabsContent 
          value="reportes" 
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          {/* Mensaje informativo */}
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Módulo en Desarrollo
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                    El módulo de reportes estará disponible próximamente. 
                    Podrás generar análisis detallados de ventas, reportes financieros y exportar datos en múltiples formatos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview de funcionalidades futuras */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={`${feature.title}-${index}`}
                  className="opacity-60 hover:opacity-80 transition-opacity"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Icon 
                            className="w-4 h-4 text-gray-600 dark:text-gray-400" 
                            aria-hidden="true" 
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1 truncate">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Información adicional */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-green-600" aria-hidden="true" />
                Próximas Capacidades
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Dashboard interactivo con métricas clave de ventas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Comparativas mensuales, trimestrales y anuales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Análisis de productos más vendidos y rentables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Reportes personalizables con filtros avanzados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Programación de reportes automáticos por correo</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
