from rest_framework import permissions

class IsAdministrador(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and getattr(request.user, 'rol', None) == 'Administrador'

class IsGerenteProyecto(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and getattr(request.user, 'rol', None) == 'Gerente_Proyecto'

class IsMiembroEquipo(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and getattr(request.user, 'rol', None) == 'Miembro_Equipo'

class IsEjecutivo(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and getattr(request.user, 'rol', None) == 'Ejecutivo'


class RoleBasedPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'rol'):
            return False
            
        rol = getattr(request.user, 'rol', None)
        view_name = view.__class__.__name__

        # 1. Administrador tiene acceso total a todo
        if rol == 'Administrador':
            return True

        # 2. Permitir que cualquier usuario edite o consulte SU PROPIO perfil en UsuariosViewSet
        if view_name == 'UsuariosViewSet':
            # Métodos de lectura siempre permitidos
            if request.method in permissions.SAFE_METHODS:
                return True
            
            # 💡 PERMITIR EDITAR MI PROPIO PERFIL:
            # Si la vista está manipulando un objeto o si es PATCH/PUT sobre sí mismo
            obj_id = view.kwargs.get('pk')
            user_id = str(getattr(request.user, 'id_usuario', getattr(request.user, 'id', '')))
            
            if obj_id and str(obj_id) == user_id:
                return True  # Es su propio usuario, se le autoriza la actualización
            
            # Si no es su propia fila y es Gerente/Miembro/Ejecutivo, denegar modificación masiva
            if rol != 'Administrador':
                return False

        # 3. Gerente de Proyecto
        if rol == 'Gerente_Proyecto':
            return True

        # 4. Métodos Seguros (GET) para Miembro_Equipo y Ejecutivo
        if request.method in permissions.SAFE_METHODS:
            return rol in ['Miembro_Equipo', 'Ejecutivo']

        # 5. Permisos de escritura para Miembro_Equipo en sus operaciones
        if rol == 'Miembro_Equipo':
            if view_name in ['ComentariosTareaViewSet', 'ArchivosTareaViewSet', 'RegistroHorasViewSet']:
                return True
            if view_name == 'TareasViewSet' and request.method in ['PATCH', 'PUT']:
                return True

        return False