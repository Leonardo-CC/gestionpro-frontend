from django.urls import path, include
from rest_framework import routers, serializers, viewsets
from django.apps import apps

router = routers.DefaultRouter()

# 1. Obtenemos todos los modelos que generó inspectdb en la app 'api'
modelos = apps.get_app_config('api').get_models()

# 2. Iteramos sobre cada tabla/modelo
for modelo in modelos:

    # Excluimos modelos internos o el modelo base de usuario si causa conflictos de permisos
    if modelo.__name__ in ['LogEntry', 'Permission', 'Group', 'ContentType', 'Session']:
        continue

    # A) Autogenerar el Serializer dinámicamente
    ClaseSerializer = type(
        f'{modelo.__name__}Serializer',
        (serializers.ModelSerializer,),
        {
            'Meta': type('Meta', (), {'model': modelo, 'fields': '__all__'}),
            '__module__': __name__
        }
    )

    # B) Autogenerar el ViewSet (CRUD completo) dinámicamente
    ClaseViewSet = type(
        f'{modelo.__name__}ViewSet',
        (viewsets.ModelViewSet,),
        {
            'queryset': modelo.objects.all(),
            'serializer_class': ClaseSerializer,
            '__module__': __name__
        }
    )

    # C) Registrar el endpoint en el router usando el nombre de la tabla en minúsculas
    # Ejemplo: /proyectos/, /tareas/, /registro_horas/
    router.register(modelo.__name__.lower(), ClaseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
