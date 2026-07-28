# Gestión de Proyectos - Frontend

Sistema de gestión de proyectos desarrollado con **Next.js 16**, **React 18** y **TypeScript**. Conectado con API REST en Django.

## Características

- ✅ Autenticación de usuarios (Login/Registro)
- ✅ Gestión de proyectos (CRUD completo)
- ✅ Gestión de tareas por proyecto
- ✅ Gestión de usuarios y roles
- ✅ Registro de horas de trabajo
- ✅ Reportes con gráficos interactivos
- ✅ Sistema de comentarios en tareas
- ✅ Carga de archivos
- ✅ Historial de presupuesto
- ✅ Interfaz responsive y moderna

## Tecnologías

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript 5.3
- **UI**: Tailwind CSS 3
- **Gráficos**: Recharts 2
- **HTTP Client**: Axios 1.6
- **State Management**: SWR 2.2 (Stale-While-Revalidate)
- **Componentes**: UI components personalizados

## Estructura del Proyecto

```
app/
  ├── layout.tsx                    # Layout principal
  ├── globals.css                   # Estilos globales
  ├── page.tsx                      # Página de redirección
  ├── login/
  │   └── page.tsx                 # Página de login
  ├── register/
  │   └── page.tsx                 # Página de registro
  └── dashboard/
      ├── layout.tsx               # Layout con Navbar y Sidebar
      ├── page.tsx                 # Dashboard principal
      ├── proyectos/
      │   ├── page.tsx             # Listado de proyectos
      │   └── [id]/
      │       └── page.tsx         # Detalle y tareas
      ├── usuarios/
      │   └── page.tsx             # Gestión de usuarios
      └── reportes/
          └── page.tsx             # Reportes y gráficos

components/
  ├── Button.tsx                    # Botón personalizado
  ├── Input.tsx                     # Input con validación
  ├── Select.tsx                    # Select personalizado
  ├── Modal.tsx                     # Modal flexible
  ├── Card.tsx                      # Card componible
  ├── Badge.tsx                     # Badges para etiquetas
  ├── Alert.tsx                     # Alertas de estado
  ├── Navbar.tsx                    # Barra superior
  └── Sidebar.tsx                   # Menú lateral

services/
  ├── api.ts                        # Cliente API REST
  └── auth.ts                       # Servicio de autenticación

public/                             # Assets estáticos
tailwind.config.js                  # Configuración de Tailwind
tsconfig.json                       # Configuración de TypeScript
next.config.js                      # Configuración de Next.js
```

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/lion91937-ops/gestion-de-proyectos.git
cd gestion-de-proyectos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 4. Ejecutar servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Rutas Principales

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/register` | Registro de usuario |
| `/dashboard` | Dashboard principal |
| `/dashboard/proyectos` | Listado de proyectos |
| `/dashboard/proyectos/[id]` | Detalle de proyecto con tareas |
| `/dashboard/usuarios` | Gestión de usuarios y roles |
| `/dashboard/reportes` | Reportes con gráficos |

## Autenticación

El sistema utiliza **autenticación con JWT**:

1. Usuario ingresa credenciales
2. Backend valida y retorna token JWT
3. Token se almacena en `localStorage`
4. Token se envía en header `Authorization: Bearer {token}` en cada petición
5. Si token expira → redirecciona a `/login`

## API Integration

### Cliente API (`services/api.ts`)

```typescript
import api from '@/services/api';

// Listar proyectos
const proyectos = await api.getProyectos();

// Crear proyecto
await api.createProyecto({
  nombre: "Mi Proyecto",
  presupuesto_total: 5000,
  fecha_inicio: "2026-08-01"
});

// Actualizar proyecto
await api.updateProyecto(1, { estado: "Completado" });

// Eliminar proyecto
await api.deleteProyecto(1);
```

### Consumir datos con SWR

```typescript
import useSWR from 'swr';
import api from '@/services/api';

export default function MyComponent() {
  const { data: proyectos, mutate } = useSWR(
    '/proyectos', 
    () => api.getProyectos()
  );

  return (
    <div>
      {proyectos?.map(p => <div key={p.id_proyecto}>{p.nombre}</div>)}
    </div>
  );
}
```

## Componentes Disponibles

### Button
```tsx
<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

### Input
```tsx
<Input
  label="Email"
  type="email"
  error={error}
  hint="Opcional"
  placeholder="user@example.com"
/>
```

### Modal
```tsx
<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Mi Modal"
  size="md"
>
  Contenido aquí
</Modal>
```

### Card
```tsx
<Card hoverable onClick={() => {}}>
  <CardHeader title="Título" subtitle="Subtítulo" />
  <CardBody>Contenido</CardBody>
</Card>
```

## Estructura de Datos

### Proyecto
```typescript
interface Proyecto {
  id_proyecto: number;
  nombre: string;
  descripcion: string;
  presupuesto_total: number;
  estado: 'Activo' | 'Pausado' | 'Archivado';
  fecha_inicio: string;
  fecha_fin: string;
  id_gerente: string;
  fecha_creacion: string;
}
```

### Tarea
```typescript
interface Tarea {
  id_tarea: number;
  id_proyecto: number;
  titulo: string;
  descripcion: string;
  prioridad: 'Baja' | 'Media' | 'Alta';
  estado: 'Por_hacer' | 'En_progreso' | 'En_revision' | 'Completada';
  fecha_inicio: string;
  fecha_vencimiento: string;
  horas_estimadas: number;
}
```

### Usuario
```typescript
interface Usuario {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: 'Administrador' | 'Gerente_Proyecto' | 'Miembro_Equipo' | 'Ejecutivo';
  tarifa_hora: number;
  activo: boolean;
}
```

## Build para Producción

```bash
npm run build
npm start
```

## Despliegue en Vercel

1. Conectar repositorio en [Vercel](https://vercel.com)
2. Configurar variable `NEXT_PUBLIC_API_URL` en Vercel Project Settings
3. Push a rama `main`
4. Despliegue automático ✅

## Desarrollo

### Agregar nueva página
```bash
# Crear app/dashboard/nueva-seccion/page.tsx
'use client'
import { Card } from '@/components/Card';

export default function NuevaSeccion() {
  return <Card>Contenido</Card>;
}
```

### Estilos
- Usar clases de Tailwind CSS
- Seguir la paleta de colores del `tailwind.config.js`
- Responsive-first: móvil antes que escritorio

### TypeScript
- Siempre definir interfaces para datos
- Usar `'use client'` en componentes interactivos
- Exportar tipos reutilizables

## Scripts Disponibles

```bash
npm run dev       # Desarrollo con hot-reload
npm run build     # Build producción
npm start         # Ejecutar build
npm run lint      # Ejecutar linter
```

## Equipo

- **Frontend 1**: Gestión de Accesos (Login, Registro, Usuarios)
- **Frontend 2**: Dashboard y Reportes (Proyectos, Tareas, Análisis)

## Plan de Desarrollo

- ✅ Día 1 Mañana: Componentes base e inicialización
- ✅ Día 1 Tarde: Maquetación y conexión de APIs
- ✅ Día 2 Mañana: Integración dinámica
- ⏳ Día 2 Tarde: Pruebas y despliegue

## Soporte

Para reportar bugs o sugerencias, crear un issue en el repositorio.
