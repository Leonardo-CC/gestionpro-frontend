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


# Helper para resolver el usuario autenticado real
def get_current_usuario(request):
    """
    Intenta recuperar el objeto Usuarios mapeado al usuario autenticado.
    Búsqueda ordenada: por id_usuario (UUID) -> por email -> fallback seguro.
    """
    if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
        return Usuarios.objects.filter(nombre__icontains='Leonardo').first() or Usuarios.objects.first()

    # Búsqueda 1: Por ID de usuario (UUID)
    user_id = getattr(request.user, 'id_usuario', None) or getattr(request.user, 'id', None)
    if user_id:
        usuario = Usuarios.objects.filter(id_usuario=str(user_id)).first()
        if usuario:
            return usuario

    # Búsqueda 2: Por Email
    user_email = getattr(request.user, 'email', None)
    if user_email:
        usuario = Usuarios.objects.filter(email=user_email).first()
        if usuario:
            return usuario

    # Búsqueda 3: Fallback seguro
    return Usuarios.objects.filter(nombre__icontains='Leonardo').first() or Usuarios.objects.first()


class UsuariosViewSet(viewsets.ModelViewSet):
    queryset = Usuarios.objects.all()
    serializer_class = UsuariosSerializer
    permission_classes = [RoleBasedPermission]


class ProyectosViewSet(viewsets.ModelViewSet):
    queryset = Proyectos.objects.all()
    serializer_class = ProyectosSerializer
    permission_classes = [RoleBasedPermission]

    def perform_create(self, serializer):
        try:
            gerente_activo = get_current_usuario(self.request)
            serializer.save(id_gerente=gerente_activo)
        except Exception as e:
            print("Error registrando proyecto:", str(e))
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
        # Soporta tanto ?proyecto=ID como ?id_proyecto=ID
        proyecto_id = self.request.query_params.get('proyecto') or self.request.query_params.get('id_proyecto')
        if proyecto_id is not None and proyecto_id != 'TODOS':
            queryset = queryset.filter(id_proyecto=proyecto_id)
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
        # 💡 Extraer el ID independientemente de cómo venga en la URL
        tarea_id = self.request.query_params.get('tarea') or self.request.query_params.get('id_tarea')
        if tarea_id is not None and tarea_id != '':
            # 🎯 USAR id_tarea_id PARA RECONOCER EL FK EN DJANGO
            queryset = queryset.filter(id_tarea_id=int(tarea_id))
        return queryset

    def perform_create(self, serializer):
        try:
            usuario_activo = get_current_usuario(self.request)
            serializer.save(id_usuario=usuario_activo)
        except Exception as e:
            print(f"Error asignando usuario en comentario: {e}")
            serializer.save()


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
        try:
            usuario_activo = get_current_usuario(self.request)
            serializer.save(id_usuario=usuario_activo)
        except Exception as e:
            print(f"Error asignando usuario en archivo: {e}")
            serializer.save()


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
        try:
            usuario_activo = get_current_usuario(self.request)
            serializer.save(id_usuario=usuario_activo)
        except Exception as e:
            print(f"Error asignando usuario en registro de horas: {e}")
            serializer.save()


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