from django.utils import timezone
from django.db.models import Sum
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


from django.db.models import Sum, F, FloatField
from django.db.models.functions import Cast

class ProyectosSerializer(serializers.ModelSerializer):
    costo_invertido = serializers.SerializerMethodField()
    presupuesto_restante = serializers.SerializerMethodField()

    class Meta:
        model = Proyectos
        fields = '__all__'
        extra_kwargs = {
            'id_gerente': {'required': False}
        }

    # 💡 CALCULA EL COSTO REAL EN BASE A (HORAS TRABAJADAS * TARIFA POR HORA DEL USUARIO)
    def get_costo_invertido(self, obj):
        try:
            # Trae todos los registros de horas de las tareas pertenecientes a este proyecto
            registros = RegistroHoras.objects.filter(id_tarea__id_proyecto=obj.id_proyecto)
            
            costo_total = 0.0
            for reg in registros:
                horas = float(reg.horas_trabajadas or 0)
                # Si el registro de horas tiene un usuario asignado, obtenemos su tarifa
                tarifa = float(reg.id_usuario.tarifa_hora or 0) if reg.id_usuario else 0.0
                costo_total += (horas * tarifa)
                
            return round(costo_total, 2)
        except Exception as e:
            print(f"Error calculando costo_invertido para proyecto {obj.id_proyecto}: {e}")
            return 0.0

    # 💡 CALCULA EL SALDO DEL PRESUPUESTO
    def get_presupuesto_restante(self, obj):
        try:
            presupuesto = float(obj.presupuesto_total or 0)
            costo = self.get_costo_invertido(obj)
            return round(presupuesto - costo, 2)
        except Exception:
            return float(obj.presupuesto_total or 0)

class TareasSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.SerializerMethodField()
    horas_invertidas = serializers.SerializerMethodField()
    usuario_asignado = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Tareas
        fields = '__all__'
        extra_kwargs = {
            'fecha_inicio': {'required': False}
        }

    # 💡 CÁLCULO DIRECTO Y ROBUSTO SIN DEPENDER DE RELATED_NAME
    def get_horas_invertidas(self, obj):
        try:
            total = RegistroHoras.objects.filter(id_tarea=obj.id_tarea).aggregate(
                total=Sum('horas_trabajadas')
            )['total']
            return float(total) if total is not None else 0.0
        except Exception as e:
            print(f"[SERIALIZER WARNING] Error al calcular horas para tarea {obj.id_tarea}: {e}")
            return 0.0

    def validate_estado(self, value):
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
            asignacion = obj.asignaciones.first() if hasattr(obj, 'asignaciones') else obj.asignaciones_set.first()
            if asignacion and asignacion.usuario:
                return asignacion.usuario.nombre
        except Exception:
            pass
        return "Sin asignar"

    def create(self, validated_data):
        if not validated_data.get('fecha_inicio'):
            validated_data['fecha_inicio'] = timezone.now().date()

        usuario_id = validated_data.pop('usuario_asignado', None)
        tarea = super().create(validated_data)
        
        if usuario_id:
            try:
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
        extra_kwargs = {
            'id_usuario': {'required': False}
        }

    def get_usuario_nombre(self, obj):
        try:
            if obj.id_usuario:
                if hasattr(obj.id_usuario, 'nombre') and obj.id_usuario.nombre:
                    return obj.id_usuario.nombre
                
                usr_id = getattr(obj.id_usuario, 'id_usuario', obj.id_usuario)
                usr = Usuarios.objects.filter(id_usuario=str(usr_id)).first()
                if usr:
                    return usr.nombre or usr.email
        except Exception as e:
            print(f"Error resolviendo usuario_nombre en comentario: {e}")
        return "Usuario"


class ArchivosTareaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ArchivosTarea
        fields = '__all__'
        extra_kwargs = {
            'id_usuario': {'required': False}
        }

    def get_usuario_nombre(self, obj):
        try:
            if hasattr(obj, 'id_usuario') and obj.id_usuario:
                return getattr(obj.id_usuario, 'nombre', None) or getattr(obj.id_usuario, 'email', None)
        except Exception:
            pass
        return "Desarrollador"


class RegistroHorasSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = RegistroHoras
        fields = '__all__'
        extra_kwargs = {
            'id_usuario': {'required': False}
        }

    def get_usuario_nombre(self, obj):
        try:
            if obj.id_usuario:
                return obj.id_usuario.nombre or obj.id_usuario.email
        except Exception:
            pass
        return "Desarrollador"


class HistorialPresupuestoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = HistorialPresupuesto
        fields = '__all__'

    def get_usuario_nombre(self, obj):
        try:
            if obj.usuario:
                return obj.usuario.nombre or obj.usuario.email
        except Exception:
            pass
        return "Gerencia / Sistema"


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