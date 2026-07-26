import os
import django

# Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Usuarios

def create_admin():
    username = 'admin'
    email = 'admin@example.com'
    password = '123456'
    
    # 1. Crear Superusuario de Django para acceder a /admin/
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"✔ Superusuario de Django creado exitosamente:")
        print(f"  Usuario: {username}")
        print(f"  Clave: {password}")
    else:
        print(f"ℹ El superusuario de Django '{username}' ya existe.")

    # 2. Crear perfil extendido con rol 'Administrador' en public.usuarios (para la API)
    # Se genera un UUID estático para pruebas locales fáciles
    admin_uuid = "00000000-0000-0000-0000-000000000000"
    if not Usuarios.objects.filter(id_usuario=admin_uuid).exists():
        Usuarios.objects.create(
            id_usuario=admin_uuid,
            nombre="Administrador Sistema",
            email=email,
            rol="Administrador",
            tarifa_hora=100.00,
            activo=True
        )
        print(f"✔ Perfil de 'Administrador' creado en public.usuarios:")
        print(f"  UUID: {admin_uuid}")
        print(f"  Email: {email}")
    else:
        print(f"ℹ El perfil de Administrador en public.usuarios ya existe (UUID: {admin_uuid}).")

if __name__ == '__main__':
    create_admin()
