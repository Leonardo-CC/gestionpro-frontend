# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
import uuid

# ==========================================
# 1. USUARIOS
# ==========================================
class Usuarios(models.Model):
    ROL_CHOICES = [
        ('Administrador', 'Administrador'),
        ('Gerente_Proyecto', 'Gerente de Proyecto'),
        ('Miembro_Equipo', 'Miembro del Equipo'),
        ('Ejecutivo', 'Ejecutivo'),
    ]

    id_usuario = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255)
    email = models.CharField(unique=True, max_length=255)
    rol = models.CharField(max_length=30, choices=ROL_CHOICES, default='Miembro_Equipo')
    tarifa_hora = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'usuarios'

    def __str__(self):
        return f"{self.nombre} ({self.rol})"


# ==========================================
# 2. PROYECTOS
# ==========================================
class Proyectos(models.Model):
    ESTADO_PROYECTO_CHOICES = [
        ('Activo', 'Activo'),
        ('Archivado', 'Archivado'),
    ]

    id_proyecto = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(blank=True, null=True)
    presupuesto_total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADO_PROYECTO_CHOICES, default='Activo')
    id_gerente = models.ForeignKey(Usuarios, on_delete=models.CASCADE, db_column='id_gerente', related_name='proyectos_gestionados')
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'proyectos'

    def __str__(self):
        return self.nombre


# ==========================================
# 3. TAREAS (Con los 5 estados del Kanban Jira)
# ==========================================
class Tareas(models.Model):
    ESTADO_CHOICES = [
        ('IDEA', 'Idea'),
        ('POR_HACER', 'Por Hacer'),
        ('EN_CURSO', 'En Curso'),
        ('PRUEBAS', 'Pruebas'),
        ('FINALIZADO', 'Finalizado'),
    ]

    PRIORIDAD_CHOICES = [
        ('Baja', 'Baja'),
        ('Media', 'Media'),
        ('Alta', 'Alta'),
    ]

    id_tarea = models.AutoField(primary_key=True)
    id_proyecto = models.ForeignKey(Proyectos, on_delete=models.CASCADE, db_column='id_proyecto', related_name='tareas')
    id_tarea_padre = models.ForeignKey('self', on_delete=models.SET_NULL, db_column='id_tarea_padre', blank=True, null=True, related_name='subtareas')
    tarea_predecesora = models.ForeignKey('self', on_delete=models.SET_NULL, db_column='tarea_predecesora_id', blank=True, null=True, related_name='tareas_dependientes')
    
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateField(auto_now_add=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='Media')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='POR_HACER')
    
    horas_estimadas = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'tareas'

    def __str__(self):
        return f"[{self.estado}] {self.titulo}"


# ==========================================
# 4. TABLAS RELACIONALES Y AUXILIARES
# ==========================================
class Asignaciones(models.Model):
    # Clave primaria compuesta en Postgres / Django asigna id si no especifica
    tarea = models.ForeignKey(Tareas, on_delete=models.CASCADE, related_name='asignaciones')
    usuario = models.ForeignKey(Usuarios, on_delete=models.CASCADE, related_name='asignaciones')
    horas_planificadas = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    class Meta:
        managed = False
        db_table = 'asignaciones'


class ArchivosTarea(models.Model):
    id_archivo = models.AutoField(primary_key=True)
    id_tarea = models.ForeignKey(Tareas, on_delete=models.CASCADE, db_column='id_tarea', related_name='archivos')
    id_usuario = models.ForeignKey(Usuarios, on_delete=models.CASCADE, db_column='id_usuario')
    url_archivo = models.CharField(max_length=500)
    nombre_archivo = models.CharField(max_length=255, blank=True, null=True)
    fecha_subida = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'archivos_tarea'


class ComentariosTarea(models.Model):
    id_comentario = models.AutoField(primary_key=True)
    id_tarea = models.ForeignKey(Tareas, on_delete=models.CASCADE, db_column='id_tarea', related_name='comentarios')
    id_usuario = models.ForeignKey(Usuarios, on_delete=models.CASCADE, db_column='id_usuario')
    texto_comentario = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'comentarios_tarea'


class RegistroHoras(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_tarea = models.ForeignKey(Tareas, on_delete=models.CASCADE, db_column='id_tarea', related_name='registros_horas')
    id_usuario = models.ForeignKey(Usuarios, on_delete=models.CASCADE, db_column='id_usuario')
    fecha = models.DateField()
    horas_trabajadas = models.DecimalField(max_digits=5, decimal_places=2)
    comentario = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'registro_horas'


class HistorialPresupuesto(models.Model):
    proyecto = models.ForeignKey(Proyectos, on_delete=models.CASCADE, related_name='historial_presupuesto')
    monto_anterior = models.DecimalField(max_digits=12, decimal_places=2)
    monto_nuevo = models.DecimalField(max_digits=12, decimal_places=2)
    usuario = models.ForeignKey(Usuarios, on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'historial_presupuesto'


class LogsAuditoria(models.Model):
    id_log = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuarios, on_delete=models.SET_NULL, db_column='id_usuario', null=True)
    entidad = models.CharField(max_length=50)
    id_entidad = models.IntegerField()
    accion = models.CharField(max_length=50)
    detalle = models.TextField(blank=True, null=True)
    fecha_hora = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'logs_auditoria'