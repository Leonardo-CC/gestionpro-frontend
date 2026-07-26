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
    # NOTA: La tabla public.usuarios tiene un FK constraintusuarios_auth_fk que apunta a auth.users de Supabase.
    # Por tanto, el UUID debe existir primero en Supabase Auth.
    admin_uuid = "00000000-0000-0000-0000-000000000000"
    try:
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
    except Exception as e:
        print("\n⚠ No se pudo crear el perfil extendido en la tabla 'public.usuarios' debido a restricciones de base de datos (FK a auth.users).")
        print("ℹ Esto es normal si el UUID '00000000-0000-0000-0000-000000000000' no existe en tu base de datos de Supabase Auth.")
        print("💡 Para asignar el rol de Administrador a un usuario real:")
        print("  1. Registra al usuario en tu frontend (o créalo en el panel de Supabase Auth).")
        print("  2. Obtén su UUID desde la consola de Supabase.")
        print("  3. Ejecuta una consulta SQL en tu editor de Supabase para insertarlo en public.usuarios con rol 'Administrador'.")
        print("     Ejemplo: INSERT INTO public.usuarios(id_usuario, nombre, email, rol, tarifa_hora, activo) VALUES ('TU-UUID', 'Admin', 'admin@example.com', 'Administrador', 100.00, true);")

if __name__ == '__main__':
    create_admin()
