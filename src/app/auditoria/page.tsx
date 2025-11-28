'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AuditoriaManagement } from '@/components/crud/AuditoriaManagement';
import { BarChart3, CheckCircle, Info, Shield, FileCheck, AlertTriangle } from 'lucide-react';

type TabValue = 'logs' | 'validacion';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export default function AuditoriaPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('logs');

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  // Memoizar las funcionalidades futuras de validación
  const validationFeatures: Feature[] = useMemo(() => [
    {
      icon: Shield,
      title: 'Validación de Integridad',
      description: 'Verifica la consistencia de datos entre tablas relacionadas'
    },
    {
      icon: FileCheck,
      title: 'Auditoría de Cumplimiento',
      description: 'Comprueba el cumplimiento de políticas y normativas'
    },
    {
      icon: AlertTriangle,
      title: 'Detección de Anomalías',
      description: 'Identifica patrones inusuales o actividades sospechosas'
    }
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría del Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Revisa todos los cambios y actividades del sistema
        </p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger 
            value="logs" 
            className="gap-2"
            aria-label="Ver registro de cambios"
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            <span>Registro de Cambios</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="validacion" 
            className="gap-2"
            aria-label="Ver validaciones del sistema"
          >
            <CheckCircle className="w-4 h-4" aria-hidden="true" />
            <span>Validaciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Registro de Cambios */}
        <TabsContent 
          value="logs" 
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <AuditoriaManagement />
        </TabsContent>

        {/* Tab: Validaciones */}
        <TabsContent 
          value="validacion" 
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
                    El módulo de validaciones estará disponible próximamente. 
                    Permitirá verificar la integridad de datos, cumplimiento normativo y detectar anomalías en el sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview de funcionalidades futuras */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validationFeatures.map((feature, index) => {
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
                <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
                Próximas Capacidades
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Reportes automáticos de cumplimiento normativo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Alertas en tiempo real para actividades sospechosas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Dashboard de métricas de seguridad y compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Exportación de reportes en múltiples formatos</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
