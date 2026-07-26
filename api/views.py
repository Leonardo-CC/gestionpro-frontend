from rest_framework import viewsets
from api.models import (
    Usuarios, Proyectos, Tareas, Asignaciones,
    ComentariosTarea, ArchivosTarea, RegistroHoras,
    HistorialPresupuesto, LogsAuditoria
)
from api.serializers import (
    UsuariosSerializer, ProyectosSerializer, TareasSerializer,
    AsignacionesSerializer, ComentariosTareaSerializer,
    ArchivosTareaSerializer, RegistroHorasSerializer,
    HistorialPresupuestoSerializer, LogsAuditoriaSerializer
)
from api.permissions import RoleBasedPermission

class UsuariosViewSet(viewsets.ModelViewSet):
    queryset = Usuarios.objects.all()
    serializer_class = UsuariosSerializer
    permission_classes = [RoleBasedPermission]

class ProyectosViewSet(viewsets.ModelViewSet):
    queryset = Proyectos.objects.all()
    serializer_class = ProyectosSerializer
    permission_classes = [RoleBasedPermission]

class TareasViewSet(viewsets.ModelViewSet):
    queryset = Tareas.objects.all()
    serializer_class = TareasSerializer
    permission_classes = [RoleBasedPermission]

class AsignacionesViewSet(viewsets.ModelViewSet):
    queryset = Asignaciones.objects.all()
    serializer_class = AsignacionesSerializer
    permission_classes = [RoleBasedPermission]

class ComentariosTareaViewSet(viewsets.ModelViewSet):
    queryset = ComentariosTarea.objects.all()
    serializer_class = ComentariosTareaSerializer
    permission_classes = [RoleBasedPermission]

class ArchivosTareaViewSet(viewsets.ModelViewSet):
    queryset = ArchivosTarea.objects.all()
    serializer_class = ArchivosTareaSerializer
    permission_classes = [RoleBasedPermission]

class RegistroHorasViewSet(viewsets.ModelViewSet):
    queryset = RegistroHoras.objects.all()
    serializer_class = RegistroHorasSerializer
    permission_classes = [RoleBasedPermission]

class HistorialPresupuestoViewSet(viewsets.ModelViewSet):
    queryset = HistorialPresupuesto.objects.all()
    serializer_class = HistorialPresupuestoSerializer
    permission_classes = [RoleBasedPermission]

class LogsAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = LogsAuditoria.objects.all()
    serializer_class = LogsAuditoriaSerializer
    permission_classes = [RoleBasedPermission]
