from decimal import Decimal
import requests
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema

from api.models import (
    Usuarios, Proyectos, Tareas, Asignaciones,
    ComentariosTarea, ArchivosTarea, RegistroHoras,
    HistorialPresupuesto, LogsAuditoria
)
from api.serializers import (
    UsuariosSerializer, ProyectosSerializer, TareasSerializer,
    AsignacionesSerializer, ComentariosTareaSerializer,
    ArchivosTareaSerializer, RegistroHorasSerializer,
    HistorialPresupuestoSerializer, LogsAuditoriaSerializer,
    UserSignUpSerializer, UserLoginSerializer
)
from api.permissions import RoleBasedPermission


# 💡 HELPER MULTI-CAPA PARA OBTENER EL USUARIO AUTÉNTICO DE LA PETICIÓN
def get_current_usuario(request):
    """
    Recupera la instancia de Usuarios intentando:
    1. ID/UUID desde el body/payload de la petición (id_usuario / usuario_id)
    2. Usuario autenticado en request.user
    3. Primer usuario activo registrado en la base de datos de PostgreSQL.
    """
    if not request:
        return Usuarios.objects.first()

    # Búsqueda 1: Si el frontend envió id_usuario en los datos de la petición
    user_id_data = request.data.get('id_usuario') or request.data.get('usuario_id')
    if user_id_data:
        usr = Usuarios.objects.filter(id_usuario=str(user_id_data)).first()
        if usr:
            return usr

    # Búsqueda 2: Si viene autenticado por DRF / Supabase Auth
    if hasattr(request, 'user') and request.user.is_authenticated:
        user_id = getattr(request.user, 'id_usuario', None) or getattr(request.user, 'id', None)
        if user_id:
            usr = Usuarios.objects.filter(id_usuario=str(user_id)).first()
            if usr:
                return usr
        
        user_email = getattr(request.user, 'email', None)
        if user_email:
            usr = Usuarios.objects.filter(email=user_email).first()
            if usr:
                return usr

    # Búsqueda 3: Fallback al primer usuario registrado en la tabla
    return Usuarios.objects.filter(activo=True).first() or Usuarios.objects.first()


class UsuariosViewSet(viewsets.ModelViewSet):
    queryset = Usuarios.objects.all()
    serializer_class = UsuariosSerializer
    permission_classes = [RoleBasedPermission]


class ProyectosViewSet(viewsets.ModelViewSet):
    queryset = Proyectos.objects.all().order_by('-fecha_creacion')
    serializer_class = ProyectosSerializer
    permission_classes = [RoleBasedPermission]

    def perform_create(self, serializer):
        try:
            gerente_activo = get_current_usuario(self.request)
            serializer.save(id_gerente=gerente_activo)
        except Exception as e:
            print(f"[PROYECTO CREATE WARNING] {e}")
            serializer.save()

    def perform_update(self, serializer):
        proyecto_previo = self.get_object()
        presupuesto_anterior = proyecto_previo.presupuesto_total

        proyecto_actualizado = serializer.save()
        nuevo_presupuesto = proyecto_actualizado.presupuesto_total

        if presupuesto_anterior is not None and nuevo_presupuesto is not None:
            if Decimal(str(presupuesto_anterior)) != Decimal(str(nuevo_presupuesto)):
                try:
                    usuario_activo = get_current_usuario(self.request)

                    HistorialPresupuesto.objects.create(
                        proyecto=proyecto_actualizado,
                        monto_anterior=presupuesto_anterior,
                        monto_nuevo=nuevo_presupuesto,
                        usuario=usuario_activo
                    )
                    print(f"[AUDITORÍA] Presupuesto cambiado: Bs. {presupuesto_anterior} -> Bs. {nuevo_presupuesto}")
                except Exception as e:
                    print(f"Error registrando historial de presupuesto: {e}")


class TareasViewSet(viewsets.ModelViewSet):
    serializer_class = TareasSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = Tareas.objects.all().order_by('-fecha_inicio')
        proyecto_id = self.request.query_params.get('proyecto') or self.request.query_params.get('id_proyecto')
        if proyecto_id is not None and proyecto_id != 'TODOS':
            queryset = queryset.filter(id_proyecto_id=int(proyecto_id))
        return queryset


class AsignacionesViewSet(viewsets.ModelViewSet):
    queryset = Asignaciones.objects.all()
    serializer_class = AsignacionesSerializer
    permission_classes = [RoleBasedPermission]


class ComentariosTareaViewSet(viewsets.ModelViewSet):
    serializer_class = ComentariosTareaSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = ComentariosTarea.objects.all().order_by('-fecha_creacion')
        tarea_id = self.request.query_params.get('tarea') or self.request.query_params.get('id_tarea')
        if tarea_id is not None and tarea_id != '':
            queryset = queryset.filter(id_tarea_id=int(tarea_id))
        return queryset

    def perform_create(self, serializer):
        usuario_activo = get_current_usuario(self.request)
        if 'id_usuario' in serializer.validated_data:
            serializer.save()
        else:
            serializer.save(id_usuario=usuario_activo)


class ArchivosTareaViewSet(viewsets.ModelViewSet):
    serializer_class = ArchivosTareaSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = ArchivosTarea.objects.all().order_by('-fecha_subida')
        tarea_id = self.request.query_params.get('tarea') or self.request.query_params.get('id_tarea')
        if tarea_id is not None and tarea_id != '':
            queryset = queryset.filter(id_tarea_id=int(tarea_id))
        return queryset

    def perform_create(self, serializer):
        usuario_activo = get_current_usuario(self.request)
        if 'id_usuario' in serializer.validated_data:
            serializer.save()
        else:
            serializer.save(id_usuario=usuario_activo)


class RegistroHorasViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroHorasSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = RegistroHoras.objects.all().order_by('-fecha_creacion')
        tarea_id = self.request.query_params.get('tarea') or self.request.query_params.get('id_tarea')
        if tarea_id is not None and tarea_id != '':
            queryset = queryset.filter(id_tarea_id=int(tarea_id))
        return queryset

    def perform_create(self, serializer):
        usuario_activo = get_current_usuario(self.request)
        if 'id_usuario' in serializer.validated_data:
            serializer.save()
        else:
            serializer.save(id_usuario=usuario_activo)


class HistorialPresupuestoViewSet(viewsets.ModelViewSet):
    serializer_class = HistorialPresupuestoSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = HistorialPresupuesto.objects.all().order_by('-fecha')
        proyecto_id = self.request.query_params.get('proyecto') or self.request.query_params.get('id_proyecto')
        if proyecto_id is not None:
            queryset = queryset.filter(proyecto_id=proyecto_id)
        return queryset


class LogsAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = LogsAuditoria.objects.all().order_by('-fecha_hora')
    serializer_class = LogsAuditoriaSerializer
    permission_classes = [RoleBasedPermission]


# ==========================================
# VIEWS DE AUTENTICACIÓN (SUPABASE AUTH)
# ==========================================

class SignUpView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=UserSignUpSerializer)
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        nombre = request.data.get('nombre', 'Nuevo Usuario')

        if not email or not password:
            return Response({"error": "Email y contraseña son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        supabase_anon_key = getattr(settings, 'SUPABASE_ANON_KEY', None)

        if not supabase_url or not supabase_anon_key:
            return Response({"error": "Configuración de Supabase no encontrada en el servidor."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        headers = {
            "apikey": supabase_anon_key,
            "Content-Type": "application/json"
        }
        data = {
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "nombre": nombre
                }
            }
        }

        response = requests.post(f"{supabase_url}/auth/v1/signup", json=data, headers=headers)
        if response.status_code >= 400:
            return Response(response.json(), status=response.status_code)

        return Response(response.json(), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=UserLoginSerializer)
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email y contraseña son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        supabase_anon_key = getattr(settings, 'SUPABASE_ANON_KEY', None)

        if not supabase_url or not supabase_anon_key:
            return Response({"error": "Configuración de Supabase no encontrada en el servidor."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        headers = {
            "apikey": supabase_anon_key,
            "Content-Type": "application/json"
        }
        data = {
            "email": email,
            "password": password
        }

        response = requests.post(f"{supabase_url}/auth/v1/token?grant_type=password", json=data, headers=headers)
        if response.status_code >= 400:
            return Response(response.json(), status=response.status_code)

        resp_data = response.json()
        
        user_id = resp_data.get('user', {}).get('id')
        if user_id:
            try:
                user_profile = Usuarios.objects.get(id_usuario=user_id)
                resp_data['user']['rol'] = user_profile.rol
                resp_data['user']['nombre'] = user_profile.nombre
            except Usuarios.DoesNotExist:
                resp_data['user']['rol'] = 'Miembro_Equipo'
                resp_data['user']['nombre'] = 'Nuevo Usuario'

        return Response(resp_data, status=status.HTTP_200_OK)