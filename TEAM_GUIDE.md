# Guía para el Equipo - Frontend Next.js

## Bienvenida

Este documento es una guía práctica para trabajar en el proyecto frontend de Gestión de Proyectos. El proyecto está completamente funcional y listo para que el equipo lo customice y extienda.

## Inicio Rápido

### 1. Clonar y configurar
```bash
git clone https://github.com/lion91937-ops/gestion-de-proyectos.git
cd gestion-de-proyectos
npm install
cp .env.example .env.local
```

### 2. Verificar que el backend está ejecutándose
```bash
# En otra terminal
cd ../backend  # o donde esté tu backend Django
python manage.py runserver
# Debería estar en http://127.0.0.1:8000
```

### 3. Ejecutar el frontend
```bash
npm run dev
# Acceder a http://localhost:3000
```

## Estructura del Proyecto

```
app/                    # Páginas y rutas (App Router)
components/            # Componentes reutilizables
services/             # API client y autenticación
types/                # Tipos TypeScript
lib/                  # Utilidades y hooks
public/               # Assets estáticos
```

## Componentes Disponibles

### Button
```tsx
import { Button } from '@/components/Button';

<Button variant="primary" size="md" loading={false}>
  Click me
</Button>

// Variantes: primary, secondary, danger, ghost
// Tamaños: sm, md, lg
```

### Input
```tsx
import { Input } from '@/components/Input';

<Input
  label="Email"
  type="email"
  error={error}
  hint="Opcional"
  placeholder="user@example.com"
/>
```

### Select
```tsx
import { Select } from '@/components/Select';

<Select
  label="Rol"
  options={[
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Usuario' }
  ]}
  placeholder="Selecciona un rol"
/>
```

### Modal
```tsx
import { Modal } from '@/components/Modal';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Mi Modal"
  size="md"  // sm, md, lg
  footer={<Button>Cerrar</Button>}
>
  Contenido aquí
</Modal>
```

### Card
```tsx
import { Card, CardHeader, CardBody } from '@/components/Card';

<Card hoverable onClick={() => {}}>
  <CardHeader title="Título" subtitle="Subtítulo" />
  <CardBody>Contenido</CardBody>
</Card>
```

### Badge
```tsx
import { Badge } from '@/components/Badge';

<Badge variant="success">Activo</Badge>
// Variantes: primary, success, warning, danger, gray
```

### Alert
```tsx
import { Alert } from '@/components/Alert';

<Alert type="error" title="Error" onClose={() => setError('')}>
  Mensaje de error
</Alert>
// Tipos: success, error, warning, info
```

## Consumir API

### Método 1: Con SWR (Recomendado)
```tsx
import useSWR from 'swr';
import api from '@/services/api';

export default function MisProyectos() {
  const { data: proyectos, mutate } = useSWR(
    '/proyectos',
    () => api.getProyectos()
  );

  // data = datos obtenidos
  // mutate = función para refrescar
  // isLoading = está cargando
}
```

### Método 2: Directo con API
```tsx
import api from '@/services/api';

// GET
const proyectos = await api.getProyectos();

// POST
const nuevoProyecto = await api.createProyecto({
  nombre: 'Mi Proyecto',
  presupuesto_total: 5000,
  fecha_inicio: '2026-02-01'
});

// PATCH
await api.updateProyecto(1, { estado: 'Completado' });

// DELETE
await api.deleteProyecto(1);
```

## Flujo de Trabajo en Git

### Crear rama para tu feature
```bash
git checkout -b feature/mi-feature
# o
git switch -c feature/mi-feature
```

### Hacer cambios
```bash
# Editar archivos...
git add .
git commit -m "feat: Descripción de cambios"
git push origin feature/mi-feature
```

### Crear Pull Request
1. Ir a GitHub
2. Crear PR desde `feature/mi-feature` a `main`
3. Describir cambios
4. Solicitar review

## Patrones Comunes

### Crear página de gestión
```tsx
'use client';  // Si tiene estado

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '@/services/api';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';

export default function MiPagina() {
  const { data: items, mutate } = useSWR('/endpoint', () => api.getItems());
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>Mi Página</h1>
        <Button onClick={() => setIsModalOpen(true)}>+ Nuevo</Button>
      </div>

      <div>
        {items?.map(item => (
          <Card key={item.id}>
            {item.nombre}
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        Contenido del modal
      </Modal>
    </div>
  );
}
```

### Agregar tipo TypeScript
```tsx
// types/index.ts
export interface MiEntidad {
  id: number;
  nombre: string;
  estado: string;
}

// Luego usar:
import { MiEntidad } from '@/types';

const items: MiEntidad[] = [];
```

### Usar custom hook
```tsx
import { useAuth } from '@/lib/hooks';

export default function MiComponente() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Cargando...</div>;
  
  return <div>{user?.nombre}</div>;
}
```

## Estilos

Usar **Tailwind CSS** para todos los estilos:

```tsx
<div className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Hola
</div>
```

### Clases útiles
- `flex`, `grid` - Layout
- `gap-4`, `p-6`, `m-2` - Espaciado
- `text-center`, `items-center` - Alineación
- `bg-blue-600`, `text-gray-900` - Colores
- `rounded-lg`, `shadow-lg` - Efectos
- `hover:bg-blue-700` - Estados

### Variables de tema
```tsx
// Color scheme disponible
bg-background     // #f8f9fa
text-foreground   // #1a1a1a
bg-primary        // #3b82f6
bg-accent         // #10b981
```

## Testing Local

### Login
Usar las credenciales del backend:
- Email: usuario@example.com
- Password: password123

### Datos de Prueba
El backend debería tener datos de prueba precargados.

## Debugging

### Ver logs
```bash
# Terminal del dev server muestra errores
npm run dev

# Browser console (F12)
// Para ver estado
console.log("[v0] State:", state);
```

### React DevTools
Instalar extensión de Chrome: React Developer Tools

## Problemas Comunes

### "Cannot reach backend"
```bash
# Verificar que backend está ejecutándose
python manage.py runserver
# http://127.0.0.1:8000 debe estar activo
```

### "CORS error"
Backend debe tener CORS configurado para `http://localhost:3000`

### "Componente no renderiza"
- Verificar que está usando `'use client'` si tiene estado
- Verificar que importaciones son correctas
- Ver console para errores

## Mejores Prácticas

1. **TypeScript**: Siempre definir tipos
2. **Componentes**: Mantenerlos pequeños y reutilizables
3. **Estado**: Usar SWR para datos remotos
4. **Errores**: Manejar todos los casos de error
5. **Performance**: Lazy load componentes grandes
6. **Seguridad**: Nunca exponer tokens en consola
7. **Commits**: Mensajes descriptivos en español

## Checkliste antes de Push

- [ ] Código compila sin errores
- [ ] No hay `console.log` de debug
- [ ] TypeScript sin errores (`npm run type-check` si existe)
- [ ] Componentes son reutilizables
- [ ] Mensaje de commit es descriptivo
- [ ] Git branch está actualizado con main

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [SWR](https://swr.vercel.app)

## Contacto y Soporte

- Revisar documentación del proyecto
- Crear issue en GitHub
- Preguntar en el chat del equipo

---

**Última actualización**: 28 de Julio de 2026
**Versión**: 1.0
**Estado**: Producción ✅
