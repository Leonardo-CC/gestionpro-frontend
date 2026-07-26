# Documentación de Endpoints - Gestión de Proyectos API

Este documento contiene la especificación detallada de los endpoints del backend, incluyendo los métodos HTTP soportados, esquemas de Request, códigos de respuesta (Response), autenticación y políticas de control de acceso basadas en roles (RBAC).

---

## 1. Configuración Global de Seguridad y Autenticación

Todos los endpoints (con excepción de la documentación de Swagger/Redoc) requieren autenticación mediante un token JWT stateless emitido por Supabase Auth.

*   **Cabecera Obligatoria:** `Authorization: Bearer <JWT_TOKEN>`
*   **Decodificación del Token:** El backend Django valida la firma del token utilizando la clave `SUPABASE_JWT_SECRET`. Extrae el campo `sub` (UUID único del usuario en Supabase) y lo mapea con el registro de la tabla `usuarios` en el esquema público de la base de datos PostgreSQL.
*   **Respuestas Globales de Error de Autenticación:**
    *   **401 Unauthorized:** Si no se provee la cabecera `Authorization` o el token es inválido/expirado.
    *   **403 Forbidden:** Si el token es válido pero el usuario no tiene los privilegios de rol requeridos (RBAC).

### Tabla General de Roles y Permisos (RBAC)

El sistema soporta 4 roles definidos en la columna `rol` de la tabla `usuarios`:

| Rol | Lectura (GET) | Escritura General (POST/PUT/PATCH/DELETE) | Escritura de Tareas Específicas (Comentarios/Horas/Archivos) |
| :--- | :---: | :---: | :---: |
| **Administrador** | Sí | Sí | Sí |
| **Gerente de Proyecto** | Sí | Sí | Sí |
| **Miembro del Equipo** | Sí | No | Sí |
| **Ejecutivo** | Sí | No | No |

---

## 2. Detalle de Endpoints

### 2.1 Usuarios (`/api/usuarios/`)
Permite gestionar la información de los perfiles de usuario del sistema. El `id_usuario` debe coincidir con el ID (UUID) autogenerado en Supabase Auth (`auth.users`).

#### Métodos Soportados
*   `GET /api/usuarios/` - Listar todos los usuarios.
*   `POST /api/usuarios/` - Crear un nuevo perfil de usuario.
*   `GET /api/usuarios/{id}/` - Obtener el detalle de un usuario.
*   `PUT /api/usuarios/{id}/` - Actualizar completamente un usuario.
*   `PATCH /api/usuarios/{id}/` - Actualizar parcialmente un usuario.
*   `DELETE /api/usuarios/{id}/` - Desactivar o eliminar un usuario.

#### Reglas de RBAC
*   **Escritura (POST/PUT/PATCH/DELETE):** Solo permitido para `Administrador` y `Gerente de Proyecto`.
*   **Lectura (GET):** Permitido para cualquier rol autenticado (`Administrador`, `Gerente de Proyecto`, `Miembro del Equipo`, `Ejecutivo`).

#### Esquema de Request (POST/PUT/PATCH)
```json
{
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Juan Pérez",
  "email": "juan.perez@example.com",
  "rol": "Miembro del Equipo",
  "tarifa_hora": "45.00",
  "activo": true
}
```

#### Respuestas (Responses)
*   **200 OK / 201 Created:** Retorna el objeto del usuario creado/modificado.
*   **400 Bad Request:** Formatos incorrectos (ej. tarifa_hora con caracteres no numéricos, email duplicado, formato UUID incorrecto).
*   **403 Forbidden:** Si un Miembro o Ejecutivo intenta escribir.

---

### 2.2 Proyectos (`/api/proyectos/`)
Gestión de los proyectos de la empresa, descripción, presupuesto total, fechas de ejecución y asociación con un Gerente de Proyecto.

#### Métodos Soportados
*   `GET /api/proyectos/` - Listar todos los proyectos.
*   `POST /api/proyectos/` - Crear un proyecto.
*   `GET /api/proyectos/{id}/` - Detalle de un proyecto.
*   `PUT /api/proyectos/{id}/` - Reemplazar la información de un proyecto.
*   `PATCH /api/proyectos/{id}/` - Modificar campos de un proyecto.
*   `DELETE /api/proyectos/{id}/` - Eliminar un proyecto.

#### Reglas de RBAC
*   **Escritura:** Solo `Administrador` y `Gerente de Proyecto`.
*   **Lectura:** Permitido para todos los roles.

#### Esquema de Request (POST/PUT)
```json
{
  "nombre": "Reestructuración Plataforma Web",
  "descripcion": "Migración y rediseño del portal principal de la organización",
  "fecha_inicio": "2026-08-01",
  "fecha_fin": "2026-12-31",
  "presupuesto_total": "150000.00",
  "estado": "Activo",
  "id_gerente": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

#### Respuestas
*   **200 OK / 201 Created:** Retorna los datos del proyecto.
*   **400 Bad Request:** Datos requeridos faltantes o formato de fecha erróneo.

---

### 2.3 Tareas (`/api/tareas/`)
Tareas pertenecientes a los proyectos. Pueden tener jerarquías (subtareas) mediante autoreferencia (`id_tarea_padre`) y orden de precedencia (`tarea_predecesora`).

#### Métodos Soportados
*   `GET /api/tareas/` - Listar todas las tareas.
*   `POST /api/tareas/` - Crear una tarea.
*   `GET /api/tareas/{id}/` - Detalle de una tarea.
*   `PUT /api/tareas/{id}/` - Modificación completa.
*   `PATCH /api/tareas/{id}/` - Modificación parcial.
*   `DELETE /api/tareas/{id}/` - Eliminar tarea.

#### Reglas de RBAC
*   **Escritura:** Solo `Administrador` y `Gerente de Proyecto`.
*   **Lectura:** Todos los roles.

#### Esquema de Request (POST/PUT)
```json
{
  "id_proyecto": 1,
  "id_tarea_padre": null,
  "titulo": "Desarrollo del Módulo de Autenticación",
  "descripcion": "Integrar vistas de React con Supabase Auth SDK",
  "fecha_inicio": "2026-08-01",
  "fecha_vencimiento": "2026-08-15",
  "prioridad": "Alta",
  "estado": "En Progreso",
  "horas_estimadas": "40.00",
  "tarea_predecesora": null
}
```

---

### 2.4 Asignaciones (`/api/asignaciones/`)
Mapea qué usuarios están asignados a qué tareas y el cálculo de horas planificadas.

#### Métodos Soportados
*   `GET /api/asignaciones/` | `POST /api/asignaciones/` | `GET /api/asignaciones/{id}/` | `PUT /api/asignaciones/{id}/` | `PATCH /api/asignaciones/{id}/` | `DELETE /api/asignaciones/{id}/`

#### Reglas de RBAC
*   **Escritura:** Solo `Administrador` y `Gerente de Proyecto`.
*   **Lectura:** Todos los roles.

#### Esquema de Request (POST)
```json
{
  "tarea": 1,
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "horas_planificadas": "20.50"
}
```

---

### 2.5 Comentarios de Tareas (`/api/comentarios/`)
Comentarios que dejan los usuarios para documentar el progreso en cada tarea.

#### Métodos Soportados
*   `GET /api/comentarios/` | `POST /api/comentarios/` | `GET /api/comentarios/{id}/` | `PUT /api/comentarios/{id}/` | `PATCH /api/comentarios/{id}/` | `DELETE /api/comentarios/{id}/`

#### Reglas de RBAC
*   **Escritura:** Permitido para `Administrador`, `Gerente de Proyecto` y **`Miembro del Equipo`**.
*   **Lectura:** Todos los roles.

#### Esquema de Request (POST)
```json
{
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "texto_comentario": "Se finalizó la integración básica del JWT en frontend."
}
```

---

### 2.6 Archivos de Tareas (`/api/archivos/`)
Enlaces URL o referencias de archivos adjuntos asociados a tareas de proyectos.

#### Métodos Soportados
*   `GET /api/archivos/` | `POST /api/archivos/` | `GET /api/archivos/{id}/` | `PUT /api/archivos/{id}/` | `PATCH /api/archivos/{id}/` | `DELETE /api/archivos/{id}/`

#### Reglas de RBAC
*   **Escritura:** Permitido para `Administrador`, `Gerente de Proyecto` y **`Miembro del Equipo`**.
*   **Lectura:** Todos los roles.

#### Esquema de Request (POST)
```json
{
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "url_archivo": "https://supabase-bucket-url.com/uploads/archivos/mockup.png",
  "nombre_archivo": "mockup_v1.png"
}
```

---

### 2.7 Registro de Horas (`/api/registro-horas/`)
Detalle de las horas efectivamente trabajadas por cada usuario en una tarea específica.

#### Métodos Soportados
*   `GET /api/registro-horas/` | `POST /api/registro-horas/` | `GET /api/registro-horas/{id}/` | `PUT /api/registro-horas/{id}/` | `PATCH /api/registro-horas/{id}/` | `DELETE /api/registro-horas/{id}/`

#### Reglas de RBAC
*   **Escritura:** Permitido para `Administrador`, `Gerente de Proyecto` y **`Miembro del Equipo`**.
*   **Lectura:** Todos los roles.

#### Esquema de Request (POST)
```json
{
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha": "2026-08-05",
  "horas_trabajadas": "8.00",
  "comentario": "Codificación de las pruebas de integración en Django."
}
```

---

### 2.8 Historial de Presupuestos (`/api/historial-presupuesto/`)
Logs o registros de los cambios de montos del presupuesto total del proyecto para auditorías de finanzas.

#### Métodos Soportados
*   `GET /api/historial-presupuesto/` | `POST /api/historial-presupuesto/` | `GET /api/historial-presupuesto/{id}/` | `PUT /api/historial-presupuesto/{id}/` | `PATCH /api/historial-presupuesto/{id}/` | `DELETE /api/historial-presupuesto/{id}/`

#### Reglas de RBAC
*   **Escritura:** Solo `Administrador` y `Gerente de Proyecto`.
*   **Lectura:** Todos los roles.

#### Esquema de Request (POST)
```json
{
  "proyecto": 1,
  "monto_anterior": "100000.00",
  "monto_nuevo": "150000.00",
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

### 2.9 Logs de Auditoría (`/api/logs-auditoria/`)
Registro de auditoría interna de acciones realizadas en el sistema (por ejemplo, cambios de roles o eliminación de tareas).

#### Métodos Soportados
*   `GET /api/logs-auditoria/` | `POST /api/logs-auditoria/` | `GET /api/logs-auditoria/{id}/` | `PUT /api/logs-auditoria/{id}/` | `PATCH /api/logs-auditoria/{id}/` | `DELETE /api/logs-auditoria/{id}/`

#### Reglas de RBAC
*   **Escritura:** Solo `Administrador` y `Gerente de Proyecto`.
*   **Lectura:** Todos los roles.

#### Esquema de Request (POST)
```json
{
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "entidad": "Proyectos",
  "id_entidad": 1,
  "accion": "CREAR",
  "detalle": "Proyecto 'Migración React' creado exitosamente."
}
```
