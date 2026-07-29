from django.utils import timezone
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
    # Atrapa el UUID/ID enviado desde Next.js sin romper la estructura de la tabla Tareas
    usuario_asignado = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Tareas
        fields = '__all__'
        extra_kwargs = {
            'fecha_inicio': {'required': False}  # Permite omitir este campo en la Petición
        }

    def validate_estado(self, value):
        """ Normaliza el estado para asegurar compatibilidad con las 5 columnas del Kanban Jira """
        MAPEO_ESTADOS = {
            'POR_HACER': 'POR_HACER',
            'POR HACER': 'POR_HACER',
            'EN_PROGRESO': 'EN_CURSO',
            'EN_CURSO': 'EN_CURSO',
            'EN_REVISION': 'PRUEBAS',
            'PRUEBAS': 'PRUEBAS',
            'COMPLETADA': 'FINALIZADO',
            'COMPLETADO': 'FINALIZADO',
            'FINALIZADO': 'FINALIZADO',
            'IDEA': 'IDEA',
        }
        
        valor_sanitizado = value.upper().strip().replace(' ', '_')
        if valor_sanitizado in MAPEO_ESTADOS:
            return MAPEO_ESTADOS[valor_sanitizado]
            
        raise serializers.ValidationError(
            f"El estado '{value}' no es válido. Opciones permitidas: IDEA, POR_HACER, EN_CURSO, PRUEBAS, FINALIZADO."
        )

    def get_responsable_nombre(self, obj):
        try:
            # Usamos .asignaciones en lugar de .asignaciones_set por el related_name del modelo
            asignacion = obj.asignaciones.first() if hasattr(obj, 'asignaciones') else obj.asignaciones_set.first()
            if asignacion and asignacion.usuario:
                return asignacion.usuario.nombre
        except Exception:
            pass
        return "Sin asignar"

    def create(self, validated_data):
        # 💡 ASIGNACIÓN AUTOMÁTICA DE FECHA INICIO AL CREAR TAREA
        if not validated_data.get('fecha_inicio'):
            validated_data['fecha_inicio'] = timezone.now().date()

        usuario_id = validated_data.pop('usuario_asignado', None)
        tarea = super().create(validated_data)
        
        if usuario_id:
            try:
                # Buscamos la instancia de usuario por su UUID
                usuario_obj = Usuarios.objects.filter(id_usuario=usuario_id).first()
                if usuario_obj:
                    Asignaciones.objects.create(
                        tarea=tarea,
                        usuario=usuario_obj,
                        horas_planificadas=tarea.horas_estimadas or 0
                    )
            except Exception as e:
                print(f"Error asignando usuario en creación: {e}")
        return tarea

    def update(self, instance, validated_data):
        usuario_id = validated_data.pop('usuario_asignado', None)
        tarea = super().update(instance, validated_data)

        if usuario_id:
            try:
                usuario_obj = Usuarios.objects.filter(id_usuario=usuario_id).first()
                if usuario_obj:
                    # Buscamos la asignación previa
                    asignacion = instance.asignaciones.first() if hasattr(instance, 'asignaciones') else instance.asignaciones_set.first()
                    if asignacion:
                        asignacion.usuario = usuario_obj
                        asignacion.save()
                    else:
                        Asignaciones.objects.create(
                            tarea=tarea,
                            usuario=usuario_obj,
                            horas_planificadas=tarea.horas_estimadas or 0
                        )
            except Exception as e:
                print(f"Error actualizando usuario asignado: {e}")
        return tarea


class AsignacionesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignaciones
        fields = '__all__'


class ComentariosTareaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ComentariosTarea
        fields = '__all__'

    def get_usuario_nombre(self, obj):
        try:
            if obj.id_usuario:
                # Si id_usuario es ForeignKey al modelo Usuarios
                if hasattr(obj.id_usuario, 'nombre'):
                    return obj.id_usuario.nombre
                
                # Si id_usuario es solo un UUID/CharField, buscamos la instancia
                usr = Usuarios.objects.filter(id_usuario=obj.id_usuario).first()
                if usr:
                    return usr.nombre or usr.email
        except Exception:
            pass
        return "Usuario"

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


# ==========================================
# SERIALIZADORES DE AUTENTICACIÓN
# ==========================================
class UserSignUpSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="Email para el nuevo usuario en Supabase Auth")
    password = serializers.CharField(write_only=True, min_length=6, help_text="Contraseña (mínimo 6 caracteres)")
    nombre = serializers.CharField(required=False, default="Nuevo Usuario", help_text="Nombre completo del usuario")


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="Email del usuario registrado")
    password = serializers.CharField(write_only=True, help_text="Contraseña del usuario")