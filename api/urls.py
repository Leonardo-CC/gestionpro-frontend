from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    UsuariosViewSet, ProyectosViewSet, TareasViewSet, AsignacionesViewSet,
    ComentariosTareaViewSet, ArchivosTareaViewSet, RegistroHorasViewSet,
    HistorialPresupuestoViewSet, LogsAuditoriaViewSet, SignUpView, LoginView
)

router = DefaultRouter()
router.register(r'usuarios', UsuariosViewSet, basename='usuario')
router.register(r'proyectos', ProyectosViewSet, basename='proyecto')
router.register(r'tareas', TareasViewSet, basename='tarea')
router.register(r'asignaciones', AsignacionesViewSet, basename='asignacion')
router.register(r'comentarios', ComentariosTareaViewSet, basename='comentario')
router.register(r'archivos', ArchivosTareaViewSet, basename='archivo')
router.register(r'registro-horas', RegistroHorasViewSet, basename='registro-hora')
router.register(r'historial-presupuesto', HistorialPresupuestoViewSet, basename='historial-presupuesto')
router.register(r'logs-auditoria', LogsAuditoriaViewSet, basename='log-auditoria')

urlpatterns = [
    path('auth/signup/', SignUpView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
]
