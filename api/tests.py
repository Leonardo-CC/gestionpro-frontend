import uuid
import jwt
from django.conf import settings
from django.test import TestCase
from django.test.runner import DiscoverRunner
from django.urls import reverse
from django.template import Context
from rest_framework.test import APIClient
from rest_framework import status

from api.models import (
    Usuarios, Proyectos, Tareas, Asignaciones,
    ComentariosTarea, ArchivosTarea, RegistroHoras,
    HistorialPresupuesto, LogsAuditoria
)

# Fix Django 4.2 compatibility with Python 3.14 test client context copying
def custom_copy(self):
    duplicate = Context()
    duplicate.dicts = self.dicts[:]
    return duplicate
Context.__copy__ = custom_copy

class ManagedModelTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        from django.apps import apps
        # Force all api app models to be managed so they get created in the test DB
        for model in apps.get_models():
            if model._meta.app_label == 'api':
                model._meta.managed = True
        return super().setup_databases(**kwargs)


class SupabaseAuthAndRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.jwt_secret = getattr(settings, 'SUPABASE_JWT_SECRET', 'tu-jwt-secret-de-supabase')
        
        # Create users with different roles
        self.admin_uuid = str(uuid.uuid4())
        self.admin_user = Usuarios.objects.create(
            id_usuario=self.admin_uuid,
            nombre="Admin User",
            email="admin@example.com",
            rol="Administrador",
            tarifa_hora=100.00,
            activo=True
        )
        
        self.gerente_uuid = str(uuid.uuid4())
        self.gerente_user = Usuarios.objects.create(
            id_usuario=self.gerente_uuid,
            nombre="Gerente User",
            email="gerente@example.com",
            rol="Gerente de Proyecto",
            tarifa_hora=75.00,
            activo=True
        )
        
        self.miembro_uuid = str(uuid.uuid4())
        self.miembro_user = Usuarios.objects.create(
            id_usuario=self.miembro_uuid,
            nombre="Miembro User",
            email="miembro@example.com",
            rol="Miembro del Equipo",
            tarifa_hora=50.00,
            activo=True
        )
        
        self.ejecutivo_uuid = str(uuid.uuid4())
        self.ejecutivo_user = Usuarios.objects.create(
            id_usuario=self.ejecutivo_uuid,
            nombre="Ejecutivo User",
            email="ejecutivo@example.com",
            rol="Ejecutivo",
            tarifa_hora=60.00,
            activo=True
        )

        # Create a test project and task to perform CRUD checks on
        self.project = Proyectos.objects.create(
            nombre="Test Project",
            descripcion="Description",
            fecha_inicio="2026-01-01",
            presupuesto_total=50000.00,
            estado="Activo",
            id_gerente=self.gerente_user
        )

        self.task = Tareas.objects.create(
            id_proyecto=self.project,
            titulo="Test Task",
            descripcion="Task Description",
            fecha_inicio="2026-01-01",
            fecha_vencimiento="2026-02-01",
            prioridad="Alta",
            estado="Pendiente"
        )

    def _get_headers(self, user_uuid):
        # Generate a valid JWT token signed with Supabase JWT Secret
        payload = {"sub": user_uuid}
        token = jwt.encode(payload, self.jwt_secret, algorithm="HS256")
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_unauthenticated_requests_are_rejected(self):
        response = self.client.get(reverse('proyecto-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_jwt_token_rejected(self):
        headers = {"HTTP_AUTHORIZATION": "Bearer invalidtoken"}
        response = self.client.get(reverse('proyecto-list'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nonexistent_user_token_rejected(self):
        nonexistent_uuid = str(uuid.uuid4())
        headers = self._get_headers(nonexistent_uuid)
        response = self.client.get(reverse('proyecto-list'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_permissions(self):
        # Admin can do anything (e.g. read/write on projects)
        headers = self._get_headers(self.admin_uuid)
        
        # Read
        response = self.client.get(reverse('proyecto-list'), **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Create
        data = {
            "nombre": "Admin Project",
            "fecha_inicio": "2026-01-01",
            "presupuesto_total": "100000.00",
            "id_gerente": self.gerente_uuid
        }
        response = self.client.post(reverse('proyecto-list'), data=data, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_gerente_permissions(self):
        # Gerente can do anything (e.g. read/write on projects)
        headers = self._get_headers(self.gerente_uuid)
        
        # Read
        response = self.client.get(reverse('proyecto-list'), **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Create
        data = {
            "nombre": "Gerente Project",
            "fecha_inicio": "2026-01-01",
            "presupuesto_total": "20000.00",
            "id_gerente": self.gerente_uuid
        }
        response = self.client.post(reverse('proyecto-list'), data=data, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_miembro_permissions(self):
        # Miembro can read, but cannot create a project
        headers = self._get_headers(self.miembro_uuid)
        
        response = self.client.get(reverse('proyecto-list'), **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Create project -> Forbidden
        data = {
            "nombre": "Miembro Project",
            "fecha_inicio": "2026-01-01",
            "presupuesto_total": "20000.00",
            "id_gerente": self.gerente_uuid
        }
        response = self.client.post(reverse('proyecto-list'), data=data, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Miembro CAN write comments
        comment_data = {
            "id_tarea": self.task.id_tarea,
            "id_usuario": self.miembro_uuid,
            "texto_comentario": "Este es un comentario del miembro"
        }
        response = self.client.post(reverse('comentario-list'), data=comment_data, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_ejecutivo_permissions(self):
        # Ejecutivo is completely read-only
        headers = self._get_headers(self.ejecutivo_uuid)
        
        response = self.client.get(reverse('proyecto-list'), **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Create comment -> Forbidden
        comment_data = {
            "id_tarea": self.task.id_tarea,
            "id_usuario": self.ejecutivo_uuid,
            "texto_comentario": "Este es un comentario de ejecutivo"
        }
        response = self.client.post(reverse('comentario-list'), data=comment_data, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
