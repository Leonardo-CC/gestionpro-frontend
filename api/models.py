# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.db import models
from django.contrib.auth.models import AbstractBaseUser

class ArchivosTarea(models.Model):
    id_archivo = models.AutoField(primary_key=True)
    id_tarea = models.ForeignKey('Tareas', models.DO_NOTHING, db_column='id_tarea')
    id_usuario = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='id_usuario')
    url_archivo = models.CharField(max_length=500)
    nombre_archivo = models.CharField(max_length=255, blank=True, null=True)
    fecha_subida = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'archivos_tarea'


class ComentariosTarea(models.Model):
    id_comentario = models.AutoField(primary_key=True)
    id_tarea = models.ForeignKey('Tareas', models.DO_NOTHING, db_column='id_tarea')
    id_usuario = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='id_usuario')
    texto_comentario = models.TextField()
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'comentarios_tarea'


class DependenciasTareas(models.Model):
    id_dependencia = models.AutoField(primary_key=True)
    id_tarea = models.ForeignKey('Tareas', models.DO_NOTHING, db_column='id_tarea')
    id_tarea_predecesora = models.ForeignKey('Tareas', models.DO_NOTHING, db_column='id_tarea_predecesora', related_name='dependenciastareas_id_tarea_predecesora_set')

    class Meta:
        managed = False
        db_table = 'dependencias_tareas'


class LogsAuditoria(models.Model):
    id_log = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='id_usuario')
    entidad = models.CharField(max_length=50)
    id_entidad = models.IntegerField()
    accion = models.CharField(max_length=50)
    detalle = models.TextField(blank=True, null=True)
    fecha_hora = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'logs_auditoria'


class Proyectos(models.Model):
    id_proyecto = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(blank=True, null=True)
    presupuesto_total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.TextField(blank=True, null=True)  # This field type is a guess.
    id_gerente = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='id_gerente')
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'proyectos'


class RegistroHoras(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_tarea = models.ForeignKey('Tareas', models.DO_NOTHING, db_column='id_tarea')
    id_usuario = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='id_usuario')
    fecha = models.DateField()
    horas_trabajadas = models.DecimalField(max_digits=5, decimal_places=2)
    comentario = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'registro_horas'


class Tareas(models.Model):
    id_tarea = models.AutoField(primary_key=True)
    id_proyecto = models.ForeignKey(Proyectos, models.DO_NOTHING, db_column='id_proyecto')
    id_tarea_padre = models.ForeignKey('self', models.DO_NOTHING, db_column='id_tarea_padre', blank=True, null=True)
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    id_responsable = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='id_responsable')
    fecha_inicio = models.DateField()
    fecha_vencimiento = models.DateField()
    prioridad = models.TextField()  # This field type is a guess.
    estado = models.TextField(blank=True, null=True)  # This field type is a guess.
    horas_estimadas = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tareas'


class Usuarios(AbstractBaseUser):
    id_usuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    email = models.CharField(unique=True, max_length=255)
    contrasena_cifrada = models.CharField(max_length=255)
    rol = models.TextField()  # This field type is a guess.
    tarifa_hora = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    USERNAME_FIELD = 'email' # 3. Agrega esto

    class Meta:
        managed = False
        db_table = 'usuarios'
