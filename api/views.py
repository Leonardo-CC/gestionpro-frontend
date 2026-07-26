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


import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

class SignUpView(APIView):
    permission_classes = [AllowAny]

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

        return Response(response.json(), status=status.HTTP_200_OK)
