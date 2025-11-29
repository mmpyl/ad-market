'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { InventarioManagement } from '@/components/crud/InventarioManagement';
import { Package, TrendingDown, Info } from 'lucide-react';

type TabValue = 'inventario' | 'movimientos';

export default function AlmacenPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('inventario');

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Almacén</h1>
        <p className="text-muted-foreground mt-2">
          Controla tu inventario y movimientos de stock
        </p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger 
            value="inventario" 
            className="gap-2"
            aria-label="Ver inventario"
          >
            <Package className="w-4 h-4" aria-hidden="true" />
            <span>Inventario</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="movimientos" 
            className="gap-2"
            aria-label="Ver movimientos de stock"
          >
            <TrendingDown className="w-4 h-4" aria-hidden="true" />
            <span>Movimientos</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Inventario */}
        <TabsContent 
          value="inventario" 
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
          <InventarioManagement />
        </TabsContent>

        {/* Tab: Movimientos */}
        <TabsContent 
          value="movimientos" 
          className="space-y-6 mt-6"
          tabIndex={-1}
        >
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
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    El módulo de movimientos de inventario estará disponible próximamente. 
                    Podrás registrar entradas, salidas, ajustes y transferencias de stock.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview de funcionalidades futuras */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Package,
                title: 'Entradas',
                description: 'Registra compras y recepciones de mercadería'
              },
              {
                icon: TrendingDown,
                title: 'Salidas',
                description: 'Controla ventas y despachos de productos'
              },
              {
                icon: Package,
                title: 'Ajustes',
                description: 'Corrige diferencias de inventario'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
