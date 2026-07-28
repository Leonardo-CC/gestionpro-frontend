# Documentación de API

Base URL: `http://127.0.0.1:8000/api` (desarrollo)

## Autenticación

Todos los endpoints requieren autenticación con JWT token en el header:

```
Authorization: Bearer {token}
```

### Login
```
POST /auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nombre": "John Doe",
    "rol": "Gerente_Proyecto"
  }
}
```

### Register
```
POST /auth/register/
Content-Type: application/json

{
  "nombre": "John Doe",
  "email": "user@example.com",
  "password": "password"
}
```

## Usuarios

### Listar usuarios
```
GET /usuarios/

Response:
[
  {
    "id_usuario": "uuid",
    "nombre": "John Doe",
    "email": "john@example.com",
    "rol": "Gerente_Proyecto",
    "tarifa_hora": 50.00,
    "activo": true,
    "fecha_creacion": "2026-01-15T10:30:00Z"
  }
]
```

### Obtener usuario
```
GET /usuarios/{id}/
```

### Actualizar usuario
```
PATCH /usuarios/{id}/
Content-Type: application/json

{
  "nombre": "Jane Doe",
  "tarifa_hora": 55.00,
  "rol": "Gerente_Proyecto"
}
```

## Proyectos

### Listar proyectos
```
GET /proyectos/

Query Parameters:
- estado=Activo
- ordering=-fecha_creacion
- limit=10
- offset=0

Response:
[
  {
    "id_proyecto": 1,
    "nombre": "Proyecto A",
    "descripcion": "Descripción del proyecto",
    "presupuesto_total": 5000.00,
    "estado": "Activo",
    "fecha_inicio": "2026-01-15",
    "fecha_fin": "2026-03-15",
    "id_gerente": "uuid",
    "fecha_creacion": "2026-01-15T10:30:00Z"
  }
]
```

### Obtener proyecto
```
GET /proyectos/{id}/
```

### Crear proyecto
```
POST /proyectos/
Content-Type: application/json

{
  "nombre": "Nuevo Proyecto",
  "descripcion": "Descripción",
  "presupuesto_total": 10000.00,
  "fecha_inicio": "2026-02-01",
  "fecha_fin": "2026-04-01",
  "estado": "Activo"
}

Response: Proyecto creado (201)
```

### Actualizar proyecto
```
PATCH /proyectos/{id}/
Content-Type: application/json

{
  "estado": "Completado",
  "presupuesto_total": 9500.00
}
```

### Eliminar proyecto
```
DELETE /proyectos/{id}/

Response: 204 No Content
```

## Tareas

### Listar tareas
```
GET /tareas/

Query Parameters:
- proyecto={id_proyecto}
- estado=En_progreso
- prioridad=Alta
- ordering=-fecha_vencimiento

Response:
[
  {
    "id_tarea": 1,
    "id_proyecto": 1,
    "titulo": "Tarea 1",
    "descripcion": "Descripción",
    "prioridad": "Media",
    "estado": "En_progreso",
    "fecha_inicio": "2026-01-20",
    "fecha_vencimiento": "2026-02-20",
    "horas_estimadas": 40,
    "fecha_creacion": "2026-01-15T10:30:00Z"
  }
]
```

### Obtener tarea
```
GET /tareas/{id}/
```

### Crear tarea
```
POST /tareas/
Content-Type: application/json

{
  "id_proyecto": 1,
  "titulo": "Nueva Tarea",
  "descripcion": "Descripción",
  "prioridad": "Media",
  "estado": "Por_hacer",
  "fecha_inicio": "2026-02-01",
  "fecha_vencimiento": "2026-02-15",
  "horas_estimadas": 20
}
```

### Actualizar tarea
```
PATCH /tareas/{id}/
Content-Type: application/json

{
  "estado": "Completada",
  "horas_estimadas": 18
}
```

### Eliminar tarea
```
DELETE /tareas/{id}/
```

## Asignaciones

### Listar asignaciones
```
GET /asignaciones/

Query Parameters:
- tarea={id_tarea}
- usuario={id_usuario}
```

### Crear asignación
```
POST /asignaciones/
Content-Type: application/json

{
  "tarea_id": 1,
  "usuario_id": "uuid",
  "horas_planificadas": 20
}
```

### Actualizar asignación
```
PATCH /asignaciones/{id}/
Content-Type: application/json

{
  "horas_planificadas": 25
}
```

### Eliminar asignación
```
DELETE /asignaciones/{id}/
```

## Registro de Horas

### Listar registro
```
GET /registro-horas/

Query Parameters:
- tarea={id_tarea}
- usuario={id_usuario}
- fecha_inicio=2026-01-01
- fecha_fin=2026-01-31
```

### Crear registro
```
POST /registro-horas/
Content-Type: application/json

{
  "id_tarea": 1,
  "fecha": "2026-01-20",
  "horas_trabajadas": 8,
  "comentario": "Progreso en la tarea"
}
```

### Actualizar registro
```
PATCH /registro-horas/{id}/
Content-Type: application/json

{
  "horas_trabajadas": 9,
  "comentario": "Actualizado"
}
```

### Eliminar registro
```
DELETE /registro-horas/{id}/
```

## Comentarios

### Listar comentarios
```
GET /comentarios/

Query Parameters:
- tarea={id_tarea}
```

### Crear comentario
```
POST /comentarios/
Content-Type: application/json

{
  "id_tarea": 1,
  "texto_comentario": "Comentario sobre la tarea"
}
```

### Eliminar comentario
```
DELETE /comentarios/{id}/
```

## Archivos

### Listar archivos
```
GET /archivos/

Query Parameters:
- tarea={id_tarea}
```

### Subir archivo
```
POST /archivos/
Content-Type: multipart/form-data

Form Data:
- archivo: (file)
- tarea: {id_tarea}
```

### Eliminar archivo
```
DELETE /archivos/{id}/
```

## Historial de Presupuesto

### Listar historial
```
GET /historial-presupuesto/

Query Parameters:
- proyecto={id_proyecto}
```

## Logs de Auditoría

### Listar logs
```
GET /logs-auditoria/

Query Parameters:
- usuario={id_usuario}
- entidad={nombre_tabla}
- accion=CREATE|UPDATE|DELETE
- fecha_inicio=2026-01-01
- fecha_fin=2026-01-31
```

## Códigos de Respuesta

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Eliminado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

## Errores

Respuesta de error:
```json
{
  "detail": "Descripción del error",
  "error_code": "ERROR_CODE"
}
```

## Paginación

```
GET /usuarios/?limit=10&offset=20

Response:
{
  "count": 100,
  "next": "http://api.example.com/usuarios/?limit=10&offset=30",
  "previous": "http://api.example.com/usuarios/?limit=10&offset=10",
  "results": [...]
}
```

## Filtrado

Todos los endpoints soportan filtrado por query parameters:

```
GET /proyectos/?estado=Activo&id_gerente=uuid
```

## Ordenamiento

```
GET /tareas/?ordering=-fecha_vencimiento,prioridad

# Ordena por fecha descendente, luego por prioridad ascendente
```

## Testing

### Usar cURL
```bash
curl -X GET http://127.0.0.1:8000/api/usuarios/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Usar Postman
1. Importar collection desde `/api_collection.json`
2. Configurar Authorization: Bearer Token
3. Ejecutar requests

### Usar Swagger
Acceder a http://127.0.0.1:8000/swagger/
