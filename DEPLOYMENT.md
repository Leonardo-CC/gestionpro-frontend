# Guía de Despliegue

## Despliegue Local

### Requisitos
- Node.js 18+ 
- npm o yarn
- Backend Django ejecutándose en `http://127.0.0.1:8000`

### Pasos

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local si es necesario
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

4. **Acceder a la aplicación**
```
http://localhost:3000
```

## Despliegue en Vercel

### Prerrequisitos
- Cuenta en [Vercel](https://vercel.com)
- Repositorio conectado en GitHub
- Backend desplegado (URL disponible)

### Pasos

1. **Importar proyecto en Vercel**
   - Ir a https://vercel.com/new
   - Seleccionar el repositorio
   - Click en Import

2. **Configurar variables de entorno**
   - En Project Settings > Environment Variables
   - Agregar `NEXT_PUBLIC_API_URL` con la URL del backend
   ```
   NEXT_PUBLIC_API_URL=https://api.ejemplo.com
   ```

3. **Deploy automático**
   - Vercel automáticamente detecta Next.js
   - El build ocurre automáticamente
   - La aplicación se despliega en https://proyecto.vercel.app

4. **Despliegues futuros**
   - Cualquier push a `main` triggeriza un nuevo deploy
   - Usa preview branches para cambios experimentales

## Configuración de DNS

Si usas un dominio personalizado:

1. En Vercel Project Settings > Domains
2. Agregar tu dominio personalizado
3. Configurar los registros DNS según las instrucciones de Vercel

## Build para Producción Local

```bash
# Build
npm run build

# Ejecutar
npm start
```

La aplicación estará en `http://localhost:3000`

## Troubleshooting

### Error: "NEXT_PUBLIC_API_URL no está definido"
- Verificar que `NEXT_PUBLIC_API_URL` está en `.env.local` o en Vercel Project Settings

### Error: "Cannot reach backend"
- Verificar que el backend está ejecutándose
- Verificar que la URL es correcta
- Verificar que el backend permite CORS desde el frontend

### Build falla en Vercel
- Ejecutar `npm run build` localmente para verificar
- Revisar logs en Vercel Deployments
- Verificar que las versiones de Node.js coinciden

### La aplicación es lenta
- Ejecutar `npm run build` y revisar el tamaño del bundle
- Usar Dynamic Imports para componentes grandes
- Optimizar imágenes

## Monitoreo

### Vercel Analytics
- Disponible en Vercel Project Settings > Analytics
- Monitorea Core Web Vitals automáticamente

### Error Tracking
- Integrar Sentry para tracking de errores
- Configurar webhooks para notificaciones

## Rollback

Si algo sale mal después del deploy:

1. En Vercel Deployments, seleccionar un deployment anterior
2. Click en los 3 puntos > Promote to Production
3. O ejecutar un nuevo push a main

## Optimizaciones Sugeridas

### Performance
- Implementar lazy loading de componentes
- Optimizar gráficos en reportes
- Implementar cache con SWR

### SEO
- Agregar metadata dinámicas
- Crear sitemap
- Configurar Open Graph

### Seguridad
- Habilitar HTTPS (automático en Vercel)
- Configurar CSP headers
- Validar entrada de usuarios

## Support

- [Documentación Vercel](https://vercel.com/docs)
- [Documentación Next.js](https://nextjs.org/docs)
- Crear issue en GitHub para problemas
