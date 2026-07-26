import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from api.models import Usuarios

class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]
        secret = getattr(settings, 'SUPABASE_JWT_SECRET', None)
        if not secret:
            raise exceptions.AuthenticationFailed('Supabase JWT Secret is not configured on the server.')

        try:
            # Decode JWT token. Supabase uses HS256 by default.
            payload = jwt.decode(token, secret, algorithms=['HS256'], options={"verify_aud": False})
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token.')

        # Extract UUID (the 'sub' claim in Supabase JWT)
        supabase_uid = payload.get('sub')
        if not supabase_uid:
            raise exceptions.AuthenticationFailed('Token is missing user identifier.')

        try:
            # Fetch user from usuarios table matching this UUID
            user = Usuarios.objects.get(id_usuario=supabase_uid)
        except Usuarios.DoesNotExist:
            raise exceptions.AuthenticationFailed('User does not exist in local database.')

        return (user, token)
