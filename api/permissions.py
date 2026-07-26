from rest_framework import permissions

class IsAdministrador(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and getattr(request.user, 'rol', None) == 'Administrador'

class IsGerenteProyecto(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and getattr(request.user, 'rol', None) == 'Gerente de Proyecto'

class IsMiembroEquipo(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and getattr(request.user, 'rol', None) == 'Miembro del Equipo'

class IsEjecutivo(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and getattr(request.user, 'rol', None) == 'Ejecutivo'

class RoleBasedPermission(permissions.BasePermission):
    """
    Role-Based Access Control:
    - Administrador: Full access.
    - Gerente de Proyecto: Full access.
    - Miembro del Equipo: Read-only access generally, but can write comments, upload files, and log hours.
    - Ejecutivo: Read-only access to all endpoints.
    """
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'rol'):
            return False
            
        rol = request.user.rol
        
        # Administrador has full access
        if rol == 'Administrador':
            return True
            
        # Gerente de Proyecto has full access
        if rol == 'Gerente de Proyecto':
            return True
            
        # Safe methods are allowed for Miembro del Equipo and Ejecutivo
        if request.method in permissions.SAFE_METHODS:
            return rol in ['Miembro del Equipo', 'Ejecutivo']
            
        # Miembro del Equipo can write to Comentarios, Archivos, and RegistroHoras
        if rol == 'Miembro del Equipo':
            view_name = view.__class__.__name__
            if view_name in ['ComentariosTareaViewSet', 'ArchivosTareaViewSet', 'RegistroHorasViewSet']:
                return True
                
        return False
