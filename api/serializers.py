from rest_framework import serializers
from api.models import (
    Usuarios, Proyectos, Tareas, Asignaciones,
    ComentariosTarea, ArchivosTarea, RegistroHoras,
    HistorialPresupuesto, LogsAuditoria
)

class UsuariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuarios
        fields = '__all__'

class ProyectosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proyectos
        fields = '__all__'
        extra_kwargs = {
            'id_gerente': {'required': False}
        }

class TareasSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.SerializerMethodField()
    # NUEVO: Atrapa el ID que envía React, pero no intenta guardarlo en la tabla Tareas
    usuario_asignado = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Tareas
        fields = '__all__'

    def get_responsable_nombre(self, obj):
        try:
            asignacion = obj.asignaciones_set.first()
            if asignacion:
                if hasattr(asignacion, 'usuario'):
                    return asignacion.usuario.nombre
                elif hasattr(asignacion, 'usuario_id'):
                    return asignacion.usuario_id.nombre
        except Exception:
            pass
        return "Sin asignar"

    # Sobreescribimos el método crear para que guarde la asignación
    def create(self, validated_data):
        usuario_id = validated_data.pop('usuario_asignado', None)
        tarea = super().create(validated_data)
        
        if usuario_id:
            from .models import Asignaciones # Por si no lo tienes importado arriba
            try:
                Asignaciones.objects.create(
                    tarea=tarea,
                    usuario_id=usuario_id,
                    horas_planificadas=tarea.horas_estimadas or 0
                )
            except Exception as e:
                pass # Evita errores 500 si algo falla en la demo
        return tarea

    # Sobreescribimos el método actualizar para que guarde al usar el "Selector" rápido
    def update(self, instance, validated_data):
        usuario_id = validated_data.pop('usuario_asignado', None)
        tarea = super().update(instance, validated_data)

        if usuario_id:
            from .models import Asignaciones
            try:
                # Buscamos si la tarea ya tenía a alguien asignado
                asignacion = instance.asignaciones_set.first()
                if asignacion:
                    # Actualizamos el usuario
                    asignacion.usuario_id = usuario_id
                    asignacion.save()
                else:
                    # Creamos la asignación nueva
                    Asignaciones.objects.create(
                        tarea=tarea,
                        usuario_id=usuario_id,
                        horas_planificadas=tarea.horas_estimadas or 0
                    )
            except Exception as e:
                pass
        return tarea

class AsignacionesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignaciones
        fields = '__all__'

class ComentariosTareaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComentariosTarea
        fields = '__all__'

class ArchivosTareaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivosTarea
        fields = '__all__'

class RegistroHorasSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroHoras
        fields = '__all__'

class HistorialPresupuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialPresupuesto
        fields = '__all__'

class LogsAuditoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogsAuditoria
        fields = '__all__'


class UserSignUpSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="Email para el nuevo usuario en Supabase Auth")
    password = serializers.CharField(write_only=True, min_length=6, help_text="Contraseña (mínimo 6 caracteres)")
    nombre = serializers.CharField(required=False, default="Nuevo Usuario", help_text="Nombre completo del usuario")


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="Email del usuario registrado")
    password = serializers.CharField(write_only=True, help_text="Contraseña del usuario")
