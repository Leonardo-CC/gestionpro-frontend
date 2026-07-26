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

class TareasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tareas
        fields = '__all__'

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
