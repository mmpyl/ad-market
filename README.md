# Ad Market - Sistema de Gestión de Mercado

Un sistema integral de gestión empresarial construido con **Next.js 15**, **TypeScript**, **React 19** y **Tailwind CSS**. Diseñado para administrar productos, inventario, ventas, auditoría y usuarios con roles diferenciados.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Roles y Permisos](#roles-y-permisos)
- [Desarrollo](#desarrollo)
- [Tecnologías](#tecnologías)
- [Licencia](#licencia)

## ✨ Características

### Módulos Principales
- **🔐 Autenticación**: Login con Google, registro, recuperación de contraseña, JWT
- **👥 Gestión de Usuarios**: CRUD de usuarios con diferentes roles (Admin, Vendedor, Auditor, Almacén)
- **📦 Inventario**: Control de stock, movimientos de inventario, variantes de productos
- **🛍️ Productos**: Gestión completa de catálogo, categorías, proveedores
- **💳 Ventas**: Registro de ventas, detalles, métodos de pago, seguimiento
- **📊 Auditoría**: Registro de cambios y acciones del sistema
- **🎨 Dashboard**: Dashboards personalizados por rol
- **🌓 Tema**: Soporte para modo claro y oscuro

### Características Técnicas
- Autenticación con **JWT** y **Google OAuth**
- Base de datos **PostgreSQL** con **Supabase** y **PostgREST**
- Validación con **Zod**
- Componentes UI con **Radix UI** + **Tailwind CSS**
- Formularios con **React Hook Form**
- Toasts y notificaciones con **Sonner** y **React Hot Toast**
- Escaneo de códigos (QR/Barras)
- API REST moderna

## 📋 Requisitos Previos

- **Node.js** 18+ o **pnpm** (gestor de paquetes)
- **PostgreSQL** 12+ (o cuenta en Supabase)
- **npm** o **pnpm** instalado
- Variables de entorno configuradas

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/mmpyl/ad-market.git
cd ad-market
```

### 2. Instalar Dependencias

```bash
pnpm install
# o
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase Configuration
POSTGREST_URL=https://your-project.supabase.co/rest/v1
POSTGREST_SCHEMA=public
POSTGREST_API_KEY=your-anon-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
SCHEMA_ADMIN_USER=administrador

# Hash Configuration
HASH_SALT_KEY=your-hash-salt-key

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key

# App Configuration
NEXT_PUBLIC_APP_CODE=admin-market
```

**Obtener las variables:**
- **Supabase**: Crea un proyecto en [supabase.com](https://supabase.com)
- **JWT_SECRET**: Genera una clave segura: `openssl rand -base64 32`
- **HASH_SALT_KEY**: Otro valor aleatorio seguro
- **RESEND_API_KEY**: Obtén tu clave en [resend.com](https://resend.com)

## ⚙️ Configuración

### Base de Datos

El proyecto incluye un archivo `app.sql` con el schema de la base de datos. Ejecuta este script en tu base de datos PostgreSQL:

```sql
-- Ejecutar el contenido de src/app.sql en tu base de datos
```

### Seguridad

Para producción, actualiza estos valores en `next.config.ts`:
- Restringe `Access-Control-Allow-Origin` a dominios específicos
- Actualiza `X-Frame-Options` según necesidades

## 📁 Estructura del Proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Página home
│   ├── login/                   # Página de login
│   ├── admin/                   # Dashboard admin
│   ├── almacen/                 # Dashboard almacén
│   ├── vendedor/                # Dashboard vendedor
│   ├── auditoria/               # Dashboard auditoría
│   └── next-api/                # Rutas API
│       ├── auth/                # Autenticación
│       ├── productos/           # Gestión de productos
│       ├── inventario/          # Gestión de inventario
│       ├── ventas/              # Gestión de ventas
│       ├── usuarios-crud/       # CRUD de usuarios
│       └── ...
├── components/                   # Componentes React
│   ├── auth/                    # Componentes de autenticación
│   ├── crud/                    # Componentes CRUD
│   ├── dashboard/               # Dashboards por rol
│   └── ui/                      # Componentes UI reutilizables
├── lib/                         # Utilidades y funciones
│   ├── api-client.ts           # Cliente API
│   ├── auth.ts                 # Lógica de autenticación
│   ├── crud-operations.ts      # Operaciones CRUD
│   └── ...
├── types/                       # Tipos TypeScript
├── hooks/                       # React Hooks personalizados
├── constants/                   # Constantes de la app
└── __tests__/                   # Tests

```

## 📖 Uso

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
pnpm dev

# Con modo debug (Node Inspector)
pnpm dev:debug

# Acceder a la app
# http://localhost:3000
```

### Build para Producción

```bash
# Construir la app
pnpm build

# Iniciar servidor de producción
pnpm start

# La app estará disponible en http://localhost:3000
```

### Linting

```bash
# Ejecutar ESLint
pnpm lint
```

## 🔌 API Endpoints

### Autenticación
- `POST /next-api/auth/login` - Login
- `POST /next-api/auth/register` - Registro de usuario
- `POST /next-api/auth/logout` - Logout
- `POST /next-api/auth/refresh` - Refrescar JWT
- `POST /next-api/auth/reset-password` - Recuperar contraseña
- `GET /next-api/auth/user` - Obtener usuario actual
- `POST /next-api/auth/google-login` - Login con Google

### Productos
- `GET /next-api/productos` - Listar productos
- `POST /next-api/productos-crud` - Crear producto
- `PUT /next-api/productos-crud/[id]` - Actualizar producto
- `DELETE /next-api/productos-crud/[id]` - Eliminar producto

### Inventario
- `GET /next-api/inventario` - Estado del inventario
- `POST /next-api/movimientos-inventario` - Registrar movimiento

### Ventas
- `GET /next-api/ventas` - Listar ventas
- `POST /next-api/ventas-crud` - Crear venta
- `GET /next-api/venta-detalles` - Detalles de ventas

### Usuarios
- `GET /next-api/usuarios-crud` - Listar usuarios
- `POST /next-api/add-user` - Agregar usuario
- `PUT /next-api/usuarios-crud/[id]` - Actualizar usuario

### Auditoría
- `GET /next-api/auditoria` - Historial de auditoría

## 👥 Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Administrador** | Acceso total al sistema | Todas las funciones |
| **Vendedor** | Gestión de ventas | Crear/ver ventas, productos |
| **Almacén** | Control de inventario | Gestión de stock, movimientos |
| **Auditor** | Revisión del sistema | Ver auditoría, reportes |

## 💻 Desarrollo

### Crear un nuevo endpoint API

```typescript
// src/app/next-api/mi-ruta/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Lógica del endpoint
    return NextResponse.json({ data: 'respuesta' });
  } catch (error) {
    return NextResponse.json({ error: 'mensaje' }, { status: 500 });
  }
}
```

### Crear un nuevo componente

```typescript
// src/components/MiComponente.tsx
'use client';

import React from 'react';

export default function MiComponente() {
  return (
    <div className="flex items-center justify-center">
      <h1>Mi Componente</h1>
    </div>
  );
}
```

### Usar hooks personalizados

```typescript
import { useToast } from '@/hooks/use-toast';

function MiComponente() {
  const { toast } = useToast();
  
  const handleClick = () => {
    toast({
      title: 'Éxito',
      description: 'Operación completada',
    });
  };
  
  return <button onClick={handleClick}>Mostrar Toast</button>;
}
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests disponibles en: src/__tests__/
```

## 📦 Tecnologías

### Frontend
- **Next.js 15.2.4** - Framework React
- **React 19** - Librería UI
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 4** - Estilos
- **Radix UI** - Componentes base

### Backend & API
- **Next.js API Routes** - Backend
- **PostgreSQL** - Base de datos
- **Supabase** - BaaS
- **PostgREST** - API automática
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas

### Herramientas
- **ESLint** - Linting
- **Zod** - Validación de esquemas
- **React Hook Form** - Gestión de formularios
- **Sonner** - Notificaciones
- **Jose** - JWT
- **Resend** - Envío de emails

## 📝 Variables de Entorno

```env
POSTGREST_URL          # URL de PostgREST
POSTGREST_SCHEMA       # Schema de la BD (por defecto: public)
POSTGREST_API_KEY      # Clave API de PostgREST
JWT_SECRET             # Clave secreta para JWT
SCHEMA_ADMIN_USER      # Usuario admin por defecto
HASH_SALT_KEY          # Salt para hash de contraseñas
RESEND_API_KEY         # Clave API de Resend para emails
NEXT_PUBLIC_APP_CODE   # Código de la aplicación
```

## 🔒 Seguridad

- ✅ Autenticación con JWT
- ✅ Validación de entrada con Zod
- ✅ Protección contra CORS
- ✅ Hashing de contraseñas con bcryptjs
- ✅ Headers de seguridad configurados
- ✅ Variables sensibles en `.env.local`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propiedad de Ad Market.

## 📞 Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio.

---

**Última actualización:** Noviembre 2025  
**Versión:** 0.1.0
