# Gestión de Proyectos API - Backend Django

Este proyecto es el backend para el sistema de Gestión de Proyectos, implementado con **Django REST Framework (DRF)**. Delegando la autenticación de usuarios de forma stateless a **Supabase Auth** y utilizando políticas de control de acceso basadas en roles (**RBAC**).

---

## Características Principales

*   **Autenticación Delegada (Supabase Auth):** Toda la gestión de contraseñas y registro de credenciales se maneja en Supabase. El backend recibe e inspecciona tokens JWT y asocia el UUID con el perfil extendido en la tabla `usuarios`.
*   **Manejo de Roles (RBAC):** Control de accesos restrictivo para los roles: `Administrador`, `Gerente de Proyecto`, `Miembro del Equipo` y `Ejecutivo`.
*   **Documentación Interactiva:** Swagger UI y Redoc disponibles directamente desde el navegador para realizar pruebas interactivas de todos los endpoints de la API.
*   **Persistencia Stateless:** No se utilizan cookies ni sesiones en backend, garantizando una arquitectura moderna, escalable y segura.

---

## Requisitos Previos

*   Python 3.10 o superior (el entorno actual utiliza Python 3.14).
*   Una cuenta y proyecto configurado en [Supabase](https://supabase.com/).

---

## Estructura de Endpoints de la API

Todos los endpoints principales están expuestos bajo el prefijo `/api/`:

*   `/api/usuarios/` - Operaciones sobre perfiles de usuarios.
*   `/api/proyectos/` - Gestión de proyectos y presupuestos.
*   `/api/tareas/` - Creación y control de tareas del proyecto.
*   `/api/asignaciones/` - Asignación de tareas a miembros del equipo.
*   `/api/comentarios/` - Comentarios dentro de las tareas.
*   `/api/archivos/` - Archivos subidos y enlazados a tareas.
*   `/api/registro-horas/` - Registro y control de horas de trabajo.
*   `/api/historial-presupuesto/` - Historial del control de cambios del presupuesto.
*   `/api/logs-auditoria/` - Bitácora de acciones del sistema.

---

## Configuración y Ejecución

### 1. Clonar el repositorio y acceder a la carpeta del proyecto
```bash
cd "Gestion de proyectos"
```

### 2. Activar el entorno virtual (Virtual Environment)
```bash
source venv/bin/activate
```

### 3. Instalar las dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar las Variables de Entorno (`.env`)
Asegúrate de que tu archivo `.env` en la raíz del proyecto contenga las credenciales correctas:
```env
DEBUG=True
SECRET_KEY=tu-secret-key-de-django
DATABASE_URL=postgres://postgres:[CONTRASEÑA]@db.lakagszxhigkmvyotbnf.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=tu-jwt-secret-de-supabase
```

> **Nota:** La clave de firma del JWT de Supabase se puede encontrar en el panel de control de Supabase en **Project Settings > API**.

### 5. Iniciar el Servidor de Desarrollo
```bash
python manage.py runserver
```
El servidor se iniciará en `http://127.0.0.1:8000/`.

---

## Documentación de la API (Swagger / OpenAPI)

Cuando el servidor esté en funcionamiento, puedes acceder a la documentación interactiva en tu navegador:

*   **Swagger UI:** [http://127.0.0.1:8000/swagger/](http://127.0.0.1:8000/swagger/)
*   **Redoc:** [http://127.0.0.1:8000/redoc/](http://127.0.0.1:8000/redoc/)

---

## Ejecutar Pruebas Unitarias

Para validar las integraciones de autorización, decodificación de tokens y control de acceso (RBAC):
```bash
python manage.py test
```
