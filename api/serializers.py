from django.utils import timezone
from django.db.models import Sum, F, FloatField
from django.db.models.functions import Cast
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


# 💡 HELPER DEFENSIVO Y ROBUSTO PARA RESOLVER NOMBRES DESDE CUALQUIER TIPO DE CAMPO
def resolver_nombre_usuario(id_usuario_raw):
    if not id_usuario_raw:
        return "Sin Asignar"
    
    # 1. Si Django ya devolvió el objeto Usuarios instanciado
    if isinstance(id_usuario_raw, Usuarios):
        return id_usuario_raw.nombre or id_usuario_raw.email or "Usuario Activo"

    # 2. Si es un objeto que contiene los atributos directos
    if hasattr(id_usuario_raw, 'nombre') and id_usuario_raw.nombre:
        return id_usuario_raw.nombre

    # 3. Extracción limpia de la cadena UUID (Soporta string o UUID de Python)
    uuid_str = str(getattr(id_usuario_raw, 'id_usuario', id_usuario_raw)).strip()

    # 4. Consulta directa en la tabla public.usuarios de PostgreSQL
    try:
        usr = Usuarios.objects.filter(id_usuario=uuid_str).first()
        if usr:
            return usr.nombre or usr.email or "Usuario Registrado"
    except Exception as e:
        print(f"Error consultando usuario por UUID ({uuid_str}): {e}")

    return "Usuario Registrado"


class ProyectosSerializer(serializers.ModelSerializer):
    costo_invertido = serializers.SerializerMethodField()
    presupuesto_restante = serializers.SerializerMethodField()

    class Meta:
        model = Proyectos
        fields = '__all__'
        extra_kwargs = {
            'id_gerente': {'required': False}
        }

    def get_costo_invertido(self, obj):
        try:
            registros = RegistroHoras.objects.filter(id_tarea__id_proyecto=obj.id_proyecto)
            costo_total = 0.0
            for reg in registros:
                horas = float(reg.horas_trabajadas or 0)
                tarifa = 0.0
                if reg.id_usuario:
                    if hasattr(reg.id_usuario, 'tarifa_hora'):
                        tarifa = float(reg.id_usuario.tarifa_hora or 0)
                    else:
                        uuid_str = str(getattr(reg.id_usuario, 'id_usuario', reg.id_usuario))
                        usr = Usuarios.objects.filter(id_usuario=uuid_str).first()
                        if usr:
                            tarifa = float(usr.tarifa_hora or 0)
                costo_total += (horas * tarifa)
            return round(costo_total, 2)
        except Exception as e:
            print(f"Error calculando costo_invertido para proyecto {obj.id_proyecto}: {e}")
            return 0.0

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

    def get_horas_invertidas(self, obj):
        try:
            total = RegistroHoras.objects.filter(id_tarea=obj.id_tarea).aggregate(
                total=Sum('horas_trabajadas')
            )['total']
            return float(total) if total is not None else 0.0
        except Exception as e:
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

    # 💡 RESUELVE EL RESPONSABLE DESDE LA TABLA public.asignaciones
    def get_responsable_nombre(self, obj):
        try:
            asignacion = Asignaciones.objects.filter(tarea_id=obj.id_tarea).first()
            if asignacion and asignacion.usuario_id:
                return resolver_nombre_usuario(asignacion.usuario_id)
        except Exception as e:
            print(f"Error resolviendo responsable: {e}")
        return "Sin asignar"

    def create(self, validated_data):
        if not validated_data.get('fecha_inicio'):
            validated_data['fecha_inicio'] = timezone.now().date()

        usuario_id = validated_data.pop('usuario_asignado', None)
        tarea = super().create(validated_data)

        if usuario_id:
            try:
                usuario_obj = Usuarios.objects.filter(id_usuario=str(usuario_id)).first()
                if usuario_obj:
                    Asignaciones.objects.create(
                        tarea_id=tarea.id_tarea,
                        usuario_id=usuario_obj.id_usuario,
                        horas_planificadas=tarea.horas_estimadas or 0
                    )
            except Exception as e:
                print(f"Error asignando usuario en creación: {e}")
        return tarea

    def update(self, instance, validated_data):
        usuario_id = validated_data.pop('usuario_asignado', None)
        tarea = super().update(instance, validated_data)

        if usuario_id is not None:
            try:
                if usuario_id == "" or usuario_id == "None":
                    # Si se seleccionó "Sin Asignar", borramos la asignación existente
                    Asignaciones.objects.filter(tarea_id=instance.id_tarea).delete()
                else:
                    usuario_obj = Usuarios.objects.filter(id_usuario=str(usuario_id)).first()
                    if usuario_obj:
                        Asignaciones.objects.update_or_create(
                            tarea_id=instance.id_tarea,
                            defaults={
                                'usuario_id': usuario_obj.id_usuario,
                                'horas_planificadas': tarea.horas_estimadas or 0
                            }
                        )
            except Exception as e:
                print(f"[SERIALIZER] Error actualizando asignación en tarea: {e}")
        return tarea


class AsignacionesSerializer(serializers.ModelSerializer):
    tarea = serializers.PrimaryKeyRelatedField(queryset=Tareas.objects.all(), required=False)
    usuario = serializers.PrimaryKeyRelatedField(queryset=Usuarios.objects.all(), required=False)
    tarea_id = serializers.IntegerField(write_only=True, required=False)
    usuario_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Asignaciones
        fields = ['id', 'tarea', 'usuario', 'horas_planificadas', 'tarea_id', 'usuario_id']

    def validate(self, attrs):
        if 'tarea_id' in attrs and not attrs.get('tarea'):
            attrs['tarea'] = Tareas.objects.filter(id_tarea=attrs.pop('tarea_id')).first()

        us_id = attrs.pop('usuario_id', None)
        if us_id and not attrs.get('usuario'):
            attrs['usuario'] = Usuarios.objects.filter(id_usuario=str(us_id)).first()

        if not attrs.get('tarea'):
            raise serializers.ValidationError({"tarea": "This field is required."})
        if not attrs.get('usuario'):
            raise serializers.ValidationError({"usuario": "This field is required."})

        return attrs


class ComentariosTareaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ComentariosTarea
        fields = '__all__'
        extra_kwargs = {
            'id_usuario': {'required': False}
        }

    def get_usuario_nombre(self, obj):
        return resolver_nombre_usuario(obj.id_usuario)

    def create(self, validated_data):
        # Inyectar id_usuario desde la petición si no se especificó en el payload
        request = self.context.get('request')
        if not validated_data.get('id_usuario') and request and hasattr(request, 'user'):
            user_obj = request.user
            user_id = getattr(user_obj, 'id_usuario', getattr(user_obj, 'id', None))
            if user_id:
                validated_data['id_usuario'] = str(user_id)
                
        return super().create(validated_data)


class ArchivosTareaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    url_archivo = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ArchivosTarea
        fields = '__all__'
        extra_kwargs = {
            'id_usuario': {'required': False},
            'url_archivo': {'required': False}
        }

    def get_usuario_nombre(self, obj):
        return resolver_nombre_usuario(obj.id_usuario)

    def create(self, validated_data):
        request = self.context.get('request')
        
        # 1. Inyectar usuario en sesión si falta
        if not validated_data.get('id_usuario') and request and hasattr(request, 'user'):
            user_obj = request.user
            user_id = getattr(user_obj, 'id_usuario', getattr(user_obj, 'id', None))
            if user_id:
                validated_data['id_usuario'] = str(user_id)

        # 2. Generar una URL por defecto si viene un archivo subido por multipart
        if not validated_data.get('url_archivo'):
            nombre = validated_data.get('nombre_archivo', 'archivo_adjunto')
            id_tarea = validated_data.get('id_tarea')
            tarea_id_str = getattr(id_tarea, 'id_tarea', id_tarea)
            validated_data['url_archivo'] = f"https://supabase.co/storage/v1/object/public/archivos-tareas/tarea_{tarea_id_str}/{nombre}"

        return super().create(validated_data)

class RegistroHorasSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = RegistroHoras
        fields = '__all__'
        extra_kwargs = {
            'id_usuario': {'required': False}
        }

    def get_usuario_nombre(self, obj):
        return resolver_nombre_usuario(obj.id_usuario)

    def create(self, validated_data):
        # Inyectar id_usuario si no viene en el payload
        request = self.context.get('request')
        if not validated_data.get('id_usuario') and request and hasattr(request, 'user'):
            user_obj = request.user
            user_id = getattr(user_obj, 'id_usuario', getattr(user_obj, 'id', None))
            if user_id:
                validated_data['id_usuario'] = str(user_id)
                
        return super().create(validated_data)

class HistorialPresupuestoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = HistorialPresupuesto
        fields = '__all__'

    def get_usuario_nombre(self, obj):
        return resolver_nombre_usuario(getattr(obj, 'usuario_id', getattr(obj, 'usuario', None)))


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