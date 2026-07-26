# Documentación de Endpoints - Gestión de Proyectos API

Este documento contiene la especificación detallada de los endpoints del backend, incluyendo los métodos HTTP soportados, esquemas de Request, códigos de respuesta (Response), autenticación y políticas de control de acceso basadas en roles (RBAC).

---

## 1. Configuración Global de Seguridad y Autenticación

Todos los endpoints (con excepción de la documentación de Swagger/Redoc) requieren autenticación mediante un token JWT stateless emitido por Supabase Auth.

*   **Cabecera Obligatoria:** `Authorization: Bearer <JWT_TOKEN>`
*   **Decodificación del Token:** El backend Django valida la firma del token utilizando la clave `SUPABASE_JWT_SECRET`. Extrae el campo `sub` (UUID único del usuario en Supabase) y lo mapea con el registro de la tabla `usuarios` en el esquema público de la base de datos PostgreSQL.
*   **Respuestas Globales de Error de Autenticación:**
    *   **401 Unauthorized:** Si no se provee la cabecera `Authorization` o el token es inválido/expirado.
    ```json
    {
      "detail": "Las credenciales de autenticación no se proveyeron."
    }
    ```
    *   **403 Forbidden:** Si el token es válido pero el usuario no tiene los privilegios de rol requeridos (RBAC).
    ```json
    {
      "detail": "Usted no tiene permiso para realizar esta acción."
    }
    ```

### Tabla General de Roles y Permisos (RBAC)

El sistema soporta 4 roles definidos en la columna `rol` de la tabla `usuarios`:

| Rol | Lectura (GET) | Escritura General (POST/PUT/PATCH/DELETE) | Escritura de Tareas Específicas (Comentarios/Horas/Archivos) |
| :--- | :---: | :---: | :---: |
| **Administrador** | Sí | Sí | Sí |
| **Gerente de Proyecto** | Sí | Sí | Sí |
| **Miembro del Equipo** | Sí | No | Sí |
| **Ejecutivo** | Sí | No | No |

---

## 2. Detalle de Endpoints y Operaciones CRUD

---

### 2.1 Usuarios (`/api/usuarios/`)
Permite gestionar la información de los perfiles de usuario del sistema. El `id_usuario` debe coincidir con el ID (UUID) autogenerado en Supabase Auth (`auth.users`).

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Usuarios (`GET /api/usuarios/`)
*   **Request:** Sin body.
*   **Response (200 OK):**
```json
[
  {
    "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombre": "Juan Pérez",
    "email": "juan.perez@example.com",
    "rol": "Miembro del Equipo",
    "tarifa_hora": "45.00",
    "activo": true,
    "fecha_creacion": "2026-07-26T15:00:00Z"
  }
]
```

#### 2. Crear Usuario (`POST /api/usuarios/`)
*   **Request Body (JSON):**
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
*   **Response (201 Created):**
```json
{
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Juan Pérez",
  "email": "juan.perez@example.com",
  "rol": "Miembro del Equipo",
  "tarifa_hora": "45.00",
  "activo": true,
  "fecha_creacion": "2026-07-26T15:10:00Z"
}
```
*   **Response (400 Bad Request):**
```json
{
  "email": ["usuarios con este email ya existe."],
  "id_usuario": ["El valor no es un UUID válido."]
}
```

#### 3. Detalle de Usuario (`GET /api/usuarios/{id}/`)
*   **Request:** Sin body.
*   **Response (200 OK):**
```json
{
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Juan Pérez",
  "email": "juan.perez@example.com",
  "rol": "Miembro del Equipo",
  "tarifa_hora": "45.00",
  "activo": true,
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```
*   **Response (404 Not Found):**
```json
{
  "detail": "No encontrado."
}
```

#### 4. Actualización Completa (`PUT /api/usuarios/{id}/`)
*   **Request Body (JSON):**
```json
{
  "nombre": "Juan Pérez Modificado",
  "email": "juan.perez.new@example.com",
  "rol": "Gerente de Proyecto",
  "tarifa_hora": "60.00",
  "activo": true
}
```
*   **Response (200 OK):**
```json
{
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Juan Pérez Modificado",
  "email": "juan.perez.new@example.com",
  "rol": "Gerente de Proyecto",
  "tarifa_hora": "60.00",
  "activo": true,
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 5. Actualización Parcial (`PATCH /api/usuarios/{id}/`)
*   **Request Body (JSON):**
```json
{
  "activo": false
}
```
*   **Response (200 OK):**
```json
{
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Juan Pérez Modificado",
  "email": "juan.perez.new@example.com",
  "rol": "Gerente de Proyecto",
  "tarifa_hora": "60.00",
  "activo": false,
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 6. Eliminar Usuario (`DELETE /api/usuarios/{id}/`)
*   **Request:** Sin body.
*   **Response (204 No Content):** (Sin cuerpo).

---

### 2.2 Proyectos (`/api/proyectos/`)
Gestión de los proyectos de la empresa, descripción, presupuesto total, fechas de ejecución y asociación con un Gerente de Proyecto.

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Proyectos (`GET /api/proyectos/`)
*   **Response (200 OK):**
```json
[
  {
    "id_proyecto": 1,
    "nombre": "Reestructuración Plataforma Web",
    "descripcion": "Migración y rediseño del portal principal de la organización",
    "fecha_inicio": "2026-08-01",
    "fecha_fin": "2026-12-31",
    "presupuesto_total": "150000.00",
    "estado": "Activo",
    "id_gerente": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fecha_creacion": "2026-07-26T15:00:00Z"
  }
]
```

#### 2. Crear Proyecto (`POST /api/proyectos/`)
*   **Request Body (JSON):**
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
*   **Response (201 Created):**
```json
{
  "id_proyecto": 1,
  "nombre": "Reestructuración Plataforma Web",
  "descripcion": "Migración y rediseño del portal principal de la organización",
  "fecha_inicio": "2026-08-01",
  "fecha_fin": "2026-12-31",
  "presupuesto_total": "150000.00",
  "estado": "Activo",
  "id_gerente": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha_creacion": "2026-07-26T15:10:00Z"
}
```

#### 3. Detalle de Proyecto (`GET /api/proyectos/{id}/`)
*   **Response (200 OK):**
```json
{
  "id_proyecto": 1,
  "nombre": "Reestructuración Plataforma Web",
  "descripcion": "Migración y rediseño del portal principal de la organización",
  "fecha_inicio": "2026-08-01",
  "fecha_fin": "2026-12-31",
  "presupuesto_total": "150000.00",
  "estado": "Activo",
  "id_gerente": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 4. Actualización Completa (`PUT /api/proyectos/{id}/`)
*   **Request Body (JSON):**
```json
{
  "nombre": "Reestructuración Plataforma Web V2",
  "descripcion": "Migración del portal principal",
  "fecha_inicio": "2026-08-01",
  "fecha_fin": "2026-12-15",
  "presupuesto_total": "180000.00",
  "estado": "Activo",
  "id_gerente": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
*   **Response (200 OK):**
```json
{
  "id_proyecto": 1,
  "nombre": "Reestructuración Plataforma Web V2",
  "descripcion": "Migración del portal principal",
  "fecha_inicio": "2026-08-01",
  "fecha_fin": "2026-12-15",
  "presupuesto_total": "180000.00",
  "estado": "Activo",
  "id_gerente": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 5. Actualización Parcial (`PATCH /api/proyectos/{id}/`)
*   **Request Body (JSON):**
```json
{
  "estado": "Completado"
}
```
*   **Response (200 OK):**
```json
{
  "id_proyecto": 1,
  "nombre": "Reestructuración Plataforma Web V2",
  "descripcion": "Migración del portal principal",
  "fecha_inicio": "2026-08-01",
  "fecha_fin": "2026-12-15",
  "presupuesto_total": "180000.00",
  "estado": "Completado",
  "id_gerente": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 6. Eliminar Proyecto (`DELETE /api/proyectos/{id}/`)
*   **Response (204 No Content):** (Sin cuerpo).

---

### 2.3 Tareas (`/api/tareas/`)
Tareas pertenecientes a los proyectos. Pueden tener jerarquías (subtareas) mediante autoreferencia (`id_tarea_padre`) y orden de precedencia (`tarea_predecesora`).

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Tareas (`GET /api/tareas/`)
*   **Response (200 OK):**
```json
[
  {
    "id_tarea": 1,
    "id_proyecto": 1,
    "id_tarea_padre": null,
    "titulo": "Desarrollo de Autenticación",
    "descripcion": "Integrar vistas con Supabase",
    "fecha_inicio": "2026-08-01",
    "fecha_vencimiento": "2026-08-15",
    "prioridad": "Alta",
    "estado": "En Progreso",
    "horas_estimadas": "40.00",
    "fecha_creacion": "2026-07-26T15:00:00Z",
    "tarea_predecesora": null
  }
]
```

#### 2. Crear Tarea (`POST /api/tareas/`)
*   **Request Body (JSON):**
```json
{
  "id_proyecto": 1,
  "id_tarea_padre": null,
  "titulo": "Desarrollo de Autenticación",
  "descripcion": "Integrar vistas con Supabase",
  "fecha_inicio": "2026-08-01",
  "fecha_vencimiento": "2026-08-15",
  "prioridad": "Alta",
  "estado": "En Progreso",
  "horas_estimadas": "40.00",
  "tarea_predecesora": null
}
```
*   **Response (201 Created):**
```json
{
  "id_tarea": 1,
  "id_proyecto": 1,
  "id_tarea_padre": null,
  "titulo": "Desarrollo de Autenticación",
  "descripcion": "Integrar vistas con Supabase",
  "fecha_inicio": "2026-08-01",
  "fecha_vencimiento": "2026-08-15",
  "prioridad": "Alta",
  "estado": "En Progreso",
  "horas_estimadas": "40.00",
  "fecha_creacion": "2026-07-26T15:10:00Z",
  "tarea_predecesora": null
}
```

#### 3. Detalle de Tarea (`GET /api/tareas/{id}/`)
*   **Response (200 OK):**
```json
{
  "id_tarea": 1,
  "id_proyecto": 1,
  "id_tarea_padre": null,
  "titulo": "Desarrollo de Autenticación",
  "descripcion": "Integrar vistas con Supabase",
  "fecha_inicio": "2026-08-01",
  "fecha_vencimiento": "2026-08-15",
  "prioridad": "Alta",
  "estado": "En Progreso",
  "horas_estimadas": "40.00",
  "fecha_creacion": "2026-07-26T15:00:00Z",
  "tarea_predecesora": null
}
```

#### 4. Actualización Completa (`PUT /api/tareas/{id}/`)
*   **Request Body (JSON):**
```json
{
  "id_proyecto": 1,
  "id_tarea_padre": null,
  "titulo": "Desarrollo de Autenticación V2",
  "descripcion": "Integrar vistas con Supabase SDK",
  "fecha_inicio": "2026-08-01",
  "fecha_vencimiento": "2026-08-20",
  "prioridad": "Alta",
  "estado": "En Progreso",
  "horas_estimadas": "45.00",
  "tarea_predecesora": null
}
```
*   **Response (200 OK):**
```json
{
  "id_tarea": 1,
  "id_proyecto": 1,
  "id_tarea_padre": null,
  "titulo": "Desarrollo de Autenticación V2",
  "descripcion": "Integrar vistas con Supabase SDK",
  "fecha_inicio": "2026-08-01",
  "fecha_vencimiento": "2026-08-20",
  "prioridad": "Alta",
  "estado": "En Progreso",
  "horas_estimadas": "45.00",
  "fecha_creacion": "2026-07-26T15:00:00Z",
  "tarea_predecesora": null
}
```

#### 5. Actualización Parcial (`PATCH /api/tareas/{id}/`)
*   **Request Body (JSON):**
```json
{
  "estado": "Completada"
}
```
*   **Response (200 OK):**
```json
{
  "id_tarea": 1,
  "id_proyecto": 1,
  "id_tarea_padre": null,
  "titulo": "Desarrollo de Autenticación V2",
  "descripcion": "Integrar vistas con Supabase SDK",
  "fecha_inicio": "2026-08-01",
  "fecha_vencimiento": "2026-08-20",
  "prioridad": "Alta",
  "estado": "Completada",
  "horas_estimadas": "45.00",
  "fecha_creacion": "2026-07-26T15:00:00Z",
  "tarea_predecesora": null
}
```

#### 6. Eliminar Tarea (`DELETE /api/tareas/{id}/`)
*   **Response (204 No Content):** (Sin cuerpo).

---

### 2.4 Asignaciones (`/api/asignaciones/`)
Mapea qué usuarios están asignados a qué tareas y el cálculo de horas planificadas.

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Asignaciones (`GET /api/asignaciones/`)
*   **Response (200 OK):**
```json
[
  {
    "id": 1,
    "tarea": 1,
    "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "horas_planificadas": "20.50"
  }
]
```

#### 2. Crear Asignación (`POST /api/asignaciones/`)
*   **Request Body (JSON):**
```json
{
  "tarea": 1,
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "horas_planificadas": "20.50"
}
```
*   **Response (201 Created):**
```json
{
  "id": 1,
  "tarea": 1,
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "horas_planificadas": "20.50"
}
```

#### 3. Detalle de Asignación (`GET /api/asignaciones/{id}/`)
*   **Response (200 OK):**
```json
{
  "id": 1,
  "tarea": 1,
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "horas_planificadas": "20.50"
}
```

#### 4. Actualización Completa/Parcial (`PUT` / `PATCH` `/api/asignaciones/{id}/`)
*   **Request Body (JSON):**
```json
{
  "horas_planificadas": "30.00"
}
```
*   **Response (200 OK):**
```json
{
  "id": 1,
  "tarea": 1,
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "horas_planificadas": "30.00"
}
```

#### 5. Eliminar Asignación (`DELETE /api/asignaciones/{id}/`)
*   **Response (204 No Content):** (Sin cuerpo).

---

### 2.5 Comentarios de Tareas (`/api/comentarios/`)
Comentarios que dejan los usuarios para documentar el progreso en cada tarea.

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto, **Miembro del Equipo**.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Comentarios (`GET /api/comentarios/`)
*   **Response (200 OK):**
```json
[
  {
    "id_comentario": 1,
    "id_tarea": 1,
    "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "texto_comentario": "Se finalizó la integración básica del JWT en frontend.",
    "fecha_creacion": "2026-07-26T15:00:00Z"
  }
]
```

#### 2. Crear Comentario (`POST /api/comentarios/`)
*   **Request Body (JSON):**
```json
{
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "texto_comentario": "Se finalizó la integración básica del JWT en frontend."
}
```
*   **Response (201 Created):**
```json
{
  "id_comentario": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "texto_comentario": "Se finalizó la integración básica del JWT en frontend.",
  "fecha_creacion": "2026-07-26T15:10:00Z"
}
```

#### 3. Detalle de Comentario (`GET /api/comentarios/{id}/`)
*   **Response (200 OK):**
```json
{
  "id_comentario": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "texto_comentario": "Se finalizó la integración básica del JWT en frontend.",
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 4. Actualización Completa/Parcial (`PUT` / `PATCH` `/api/comentarios/{id}/`)
*   **Request Body (JSON):**
```json
{
  "texto_comentario": "Texto editado del comentario."
}
```
*   **Response (200 OK):**
```json
{
  "id_comentario": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "texto_comentario": "Texto editado del comentario.",
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 5. Eliminar Comentario (`DELETE /api/comentarios/{id}/`)
*   **Response (204 No Content):** (Sin cuerpo).

---

### 2.6 Archivos de Tareas (`/api/archivos/`)
Enlaces URL o referencias de archivos adjuntos asociados a tareas de proyectos.

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto, **Miembro del Equipo**.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Archivos (`GET /api/archivos/`)
*   **Response (200 OK):**
```json
[
  {
    "id_archivo": 1,
    "id_tarea": 1,
    "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "url_archivo": "https://supabase-bucket-url.com/uploads/archivos/mockup.png",
    "nombre_archivo": "mockup_v1.png",
    "fecha_subida": "2026-07-26T15:00:00Z"
  }
]
```

#### 2. Crear Archivo (`POST /api/archivos/`)
*   **Request Body (JSON):**
```json
{
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "url_archivo": "https://supabase-bucket-url.com/uploads/archivos/mockup.png",
  "nombre_archivo": "mockup_v1.png"
}
```
*   **Response (201 Created):**
```json
{
  "id_archivo": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "url_archivo": "https://supabase-bucket-url.com/uploads/archivos/mockup.png",
  "nombre_archivo": "mockup_v1.png",
  "fecha_subida": "2026-07-26T15:10:00Z"
}
```

#### 3. Detalle de Archivo (`GET /api/archivos/{id}/`)
*   **Response (200 OK):**
```json
{
  "id_archivo": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "url_archivo": "https://supabase-bucket-url.com/uploads/archivos/mockup.png",
  "nombre_archivo": "mockup_v1.png",
  "fecha_subida": "2026-07-26T15:00:00Z"
}
```

#### 4. Actualización Completa/Parcial (`PUT` / `PATCH` `/api/archivos/{id}/`)
*   **Request Body (JSON):**
```json
{
  "nombre_archivo": "mockup_final.png"
}
```
*   **Response (200 OK):**
```json
{
  "id_archivo": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "url_archivo": "https://supabase-bucket-url.com/uploads/archivos/mockup.png",
  "nombre_archivo": "mockup_final.png",
  "fecha_subida": "2026-07-26T15:00:00Z"
}
```

#### 5. Eliminar Archivo (`DELETE /api/archivos/{id}/`)
*   **Response (204 No Content):** (Sin cuerpo).

---

### 2.7 Registro de Horas (`/api/registro-horas/`)
Detalle de las horas efectivamente trabajadas por cada usuario en una tarea específica.

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto, **Miembro del Equipo**.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Registros (`GET /api/registro-horas/`)
*   **Response (200 OK):**
```json
[
  {
    "id_registro": 1,
    "id_tarea": 1,
    "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fecha": "2026-08-05",
    "horas_trabajadas": "8.00",
    "comentario": "Codificación de las pruebas de integración en Django.",
    "fecha_creacion": "2026-07-26T15:00:00Z"
  }
]
```

#### 2. Crear Registro de Horas (`POST /api/registro-horas/`)
*   **Request Body (JSON):**
```json
{
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha": "2026-08-05",
  "horas_trabajadas": "8.00",
  "comentario": "Codificación de las pruebas de integración en Django."
}
```
*   **Response (201 Created):**
```json
{
  "id_registro": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha": "2026-08-05",
  "horas_trabajadas": "8.00",
  "comentario": "Codificación de las pruebas de integración en Django.",
  "fecha_creacion": "2026-07-26T15:10:00Z"
}
```

#### 3. Detalle de Registro (`GET /api/registro-horas/{id}/`)
*   **Response (200 OK):**
```json
{
  "id_registro": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha": "2026-08-05",
  "horas_trabajadas": "8.00",
  "comentario": "Codificación de las pruebas de integración en Django.",
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 4. Actualización Completa/Parcial (`PUT` / `PATCH` `/api/registro-horas/{id}/`)
*   **Request Body (JSON):**
```json
{
  "horas_trabajadas": "9.50"
}
```
*   **Response (200 OK):**
```json
{
  "id_registro": 1,
  "id_tarea": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha": "2026-08-05",
  "horas_trabajadas": "9.50",
  "comentario": "Codificación de las pruebas de integración en Django.",
  "fecha_creacion": "2026-07-26T15:00:00Z"
}
```

#### 5. Eliminar Registro (`DELETE /api/registro-horas/{id}/`)
*   **Response (204 No Content):** (Sin cuerpo).

---

### 2.8 Historial de Presupuestos (`/api/historial-presupuesto/`)
Logs o registros de los cambios de montos del presupuesto total del proyecto para auditorías de finanzas.

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Historial (`GET /api/historial-presupuesto/`)
*   **Response (200 OK):**
```json
[
  {
    "id": 1,
    "proyecto": 1,
    "monto_anterior": "100000.00",
    "monto_nuevo": "150000.00",
    "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fecha": "2026-07-26T15:00:00Z"
  }
]
```

#### 2. Crear Historial (`POST /api/historial-presupuesto/`)
*   **Request Body (JSON):**
```json
{
  "proyecto": 1,
  "monto_anterior": "100000.00",
  "monto_nuevo": "150000.00",
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
*   **Response (201 Created):**
```json
{
  "id": 1,
  "proyecto": 1,
  "monto_anterior": "100000.00",
  "monto_nuevo": "150000.00",
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha": "2026-07-26T15:10:00Z"
}
```

#### 3. Detalle de Registro Historial (`GET /api/historial-presupuesto/{id}/`)
*   **Response (200 OK):**
```json
{
  "id": 1,
  "proyecto": 1,
  "monto_anterior": "100000.00",
  "monto_nuevo": "150000.00",
  "usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fecha": "2026-07-26T15:00:00Z"
}
```

#### 4. Eliminar Registro Historial (`DELETE /api/historial-presupuesto/{id}/`)
*   **Response (204 No Content):** (Sin cuerpo).

---

### 2.9 Logs de Auditoría (`/api/logs-auditoria/`)
Registro de auditoría interna de acciones realizadas en el sistema (por ejemplo, cambios de roles o eliminación de tareas).

*   **RBAC (Escritura):** Administrador, Gerente de Proyecto.
*   **RBAC (Lectura):** Administrador, Gerente de Proyecto, Miembro del Equipo, Ejecutivo.

#### 1. Listar Logs (`GET /api/logs-auditoria/`)
*   **Response (200 OK):**
```json
[
  {
    "id_log": 1,
    "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "entidad": "Proyectos",
    "id_entidad": 1,
    "accion": "CREAR",
    "detalle": "Proyecto 'Migración React' creado exitosamente.",
    "fecha_hora": "2026-07-26T15:00:00Z"
  }
]
```

#### 2. Crear Log (`POST /api/logs-auditoria/`)
*   **Request Body (JSON):**
```json
{
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "entidad": "Proyectos",
  "id_entidad": 1,
  "accion": "CREAR",
  "detalle": "Proyecto 'Migración React' creado exitosamente."
}
```
*   **Response (201 Created):**
```json
{
  "id_log": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "entidad": "Proyectos",
  "id_entidad": 1,
  "accion": "CREAR",
  "detalle": "Proyecto 'Migración React' creado exitosamente.",
  "fecha_hora": "2026-07-26T15:10:00Z"
}
```

#### 3. Detalle de Log (`GET /api/logs-auditoria/{id}/`)
*   **Response (200 OK):**
```json
{
  "id_log": 1,
  "id_usuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "entidad": "Proyectos",
  "id_entidad": 1,
  "accion": "CREAR",
  "detalle": "Proyecto 'Migración React' creado exitosamente.",
  "fecha_hora": "2026-07-26T15:00:00Z"
}
```

#### 4. Eliminar Log (`DELETE /api/logs-auditoria/{id}/`)
*   **Response (204 No Content):** (Sin cuerpo).

---

## 3. Endpoints de Autenticación (Supabase Proxy)

Para facilitar el desarrollo, pruebas y flujos desde clientes REST (como Postman o Swagger), la API expone endpoints que actúan de proxy hacia Supabase Auth para realizar registros e inicios de sesión.

*   **Autenticación requerida:** Ninguna (Acceso libre/público).

### 3.1 Registro de Usuario (`POST /api/auth/signup/`)
Registra un nuevo usuario en Supabase Auth. Este proceso dispara de forma automática el Trigger de base de datos para sincronizar su perfil en la tabla `public.usuarios` con el rol por defecto `Miembro_Equipo`.

#### Request Body (JSON)
```json
{
  "email": "nuevo.usuario@example.com",
  "password": "mi_password_segura",
  "nombre": "Carlos Gómez"
}
```

#### Respuestas
*   **201 Created:** Registro exitoso en Supabase.
```json
{
  "id": "4eedacbf-eb1d-46fc-9ae6-9c36d2ab695f",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "nuevo.usuario@example.com",
  "email_confirmed_at": "2026-07-26T23:35:10Z",
  "user_metadata": {
    "nombre": "Carlos Gómez"
  },
  "identities": [
    {
      "id": "4eedacbf-eb1d-46fc-9ae6-9c36d2ab695f",
      "user_id": "4eedacbf-eb1d-46fc-9ae6-9c36d2ab695f",
      "identity_data": {
        "email": "nuevo.usuario@example.com",
        "sub": "4eedacbf-eb1d-46fc-9ae6-9c36d2ab695f"
      },
      "provider": "email",
      "last_sign_in_at": "2026-07-26T23:35:10Z",
      "created_at": "2026-07-26T23:35:10Z",
      "updated_at": "2026-07-26T23:35:10Z"
    }
  ],
  "created_at": "2026-07-26T23:35:10Z",
  "updated_at": "2026-07-26T23:35:10Z"
}
```
*   **400 Bad Request:** Formatos de email incorrectos, contraseña muy débil o datos requeridos faltantes.
```json
{
  "error_description": "Password should be at least 6 characters"
}
```

---

### 3.2 Inicio de Sesión (`POST /api/auth/login/`)
Autentica al usuario en Supabase Auth y retorna los tokens JWT correspondientes para ser incluidos en la cabecera `Authorization` de los endpoints del backend.

#### Request Body (JSON)
```json
{
  "email": "nuevo.usuario@example.com",
  "password": "mi_password_segura"
}
```

#### Respuestas
*   **200 OK:** Retorna la información de la sesión y el token de acceso.
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_string",
  "user": {
    "id": "4eedacbf-eb1d-46fc-9ae6-9c36d2ab695f",
    "email": "nuevo.usuario@example.com",
    "user_metadata": {
      "nombre": "Carlos Gómez"
    }
  }
}
```
*   **400 Bad Request:** Credenciales inválidas o datos faltantes.
```json
{
  "error": "invalid_grant",
  "error_description": "Invalid login credentials"
}
```
