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
    HistorialPresupuestoSerializer, LogsAuditoriaSerializer,
    UserSignUpSerializer, UserLoginSerializer
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

    def perform_create(self, serializer):
        from .models import Usuarios
        try:
            # MODO DEMO: Agarramos directamente al primer usuario registrado en tu sistema
            gerente_seguro = Usuarios.objects.first()
            
            # Guardamos el proyecto forzando ese usuario como gerente
            serializer.save(id_gerente=gerente_seguro)
            
        except Exception as e:
            # Si pasa absolutamente cualquier cosa, lo imprimimos pero NO rompemos la página
            print("Error en Modo Demo salvando proyecto:", str(e))
            serializer.save()

class TareasViewSet(viewsets.ModelViewSet):
    serializer_class = TareasSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = Tareas.objects.all()
        # Capturamos el parámetro 'proyecto' que manda React en la URL (ej: /api/tareas/?proyecto=1)
        proyecto_id = self.request.query_params.get('proyecto')
        if proyecto_id is not None:
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
        queryset = ComentariosTarea.objects.all()
        # Capturamos el parámetro 'tarea' que manda React (ej: /api/comentarios/?tarea=5)
        tarea_id = self.request.query_params.get('tarea')
        if tarea_id is not None:
            queryset = queryset.filter(id_tarea=tarea_id)
        return queryset

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


import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from drf_yasg.utils import swagger_auto_schema

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
        
        # Obtener el UUID del usuario logueado
        user_id = resp_data.get('user', {}).get('id')
        if user_id:
            try:
                from api.models import Usuarios
                user_profile = Usuarios.objects.get(id_usuario=user_id)
                # Inyectar el rol y nombre reales de la base de datos de negocio
                resp_data['user']['rol'] = user_profile.rol
                resp_data['user']['nombre'] = user_profile.nombre
            except Usuarios.DoesNotExist:
                # Fallback por defecto si aún no está sincronizado
                resp_data['user']['rol'] = 'Miembro_Equipo'
                resp_data['user']['nombre'] = 'Nuevo Usuario'

        return Response(resp_data, status=status.HTTP_200_OK)
