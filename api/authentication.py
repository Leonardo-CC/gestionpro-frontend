import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from api.models import Usuarios

# Instanciar JWK Client globalmente para aprovechar el cacheo de llaves de Supabase
_jwk_client = None

def get_jwk_client():
    global _jwk_client
    if _jwk_client is None:
        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        supabase_anon_key = getattr(settings, 'SUPABASE_ANON_KEY', None)
        if supabase_url and supabase_anon_key:
            jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
            _jwk_client = jwt.PyJWKClient(jwks_url, headers={'apikey': supabase_anon_key})
    return _jwk_client

class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]

        try:
            # Inspeccionar la cabecera sin verificar para determinar el algoritmo de firma (HS256 o ES256)
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get('alg', 'HS256')
        except Exception:
            raise exceptions.AuthenticationFailed('Invalid token header structure.')

        payload = None
        if alg == 'ES256':
            client = get_jwk_client()
            if not client:
                raise exceptions.AuthenticationFailed('Supabase JWKS URL or Anon Key is not configured on the server.')
            try:
                # Obtener la llave pública de firma correspondiente del JWKS cacheado
                signing_key = client.get_signing_key_from_jwt(token)
                payload = jwt.decode(token, signing_key.key, algorithms=['ES256'], options={"verify_aud": False})
            except jwt.ExpiredSignatureError:
                raise exceptions.AuthenticationFailed('Token has expired.')
            except Exception as e:
                raise exceptions.AuthenticationFailed(f'Invalid token signature (ES256): {str(e)}')
        else:
            # Decodificación simétrica tradicional con HS256
            secret = getattr(settings, 'SUPABASE_JWT_SECRET', None)
            if not secret:
                raise exceptions.AuthenticationFailed('Supabase JWT Secret is not configured on the server.')
            try:
                payload = jwt.decode(token, secret, algorithms=['HS256'], options={"verify_aud": False})
            except jwt.ExpiredSignatureError:
                raise exceptions.AuthenticationFailed('Token has expired.')
            except jwt.InvalidTokenError:
                raise exceptions.AuthenticationFailed('Invalid token.')

        # Extraer UUID (el claim 'sub' de Supabase Auth)
        supabase_uid = payload.get('sub')
        if not supabase_uid:
            raise exceptions.AuthenticationFailed('Token is missing user identifier.')

        try:
            # Obtener el perfil del usuario correspondiente de la tabla de negocio public.usuarios
            user = Usuarios.objects.get(id_usuario=supabase_uid)
        except Usuarios.DoesNotExist:
            raise exceptions.AuthenticationFailed('User does not exist in local database.')

        # ASEGURAR PROPIEDADES DE AUTENTICACIÓN PARA DRF
        # Forzamos los atributos que Django REST Framework busca internamente
        user.is_authenticated = True
        
        # Opcional por seguridad si Django intenta verificar un campo 'is_active'
        if hasattr(user, 'activo'):
            user.is_active = user.activo

        return (user, token)