'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '@/services/api';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Alert } from '@/components/Alert';
import { useParams } from 'next/navigation';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  descripcion: string;
  presupuesto_total: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Tarea {
  id_tarea: number;
  titulo: string;
  estado: string;
  prioridad: string;
  fecha_vencimiento: string;
  horas_estimadas: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);

  const { data: proyecto, mutate: mutateProyecto } = useSWR(
    `/proyecto/${projectId}`,
    () => api.getProyecto(projectId),
    { revalidateOnFocus: false }
  );

  const { data: tareas = [], mutate: mutateTareas } = useSWR(
    `/tareas/${projectId}`,
    () => api.getTareas(projectId),
    { revalidateOnFocus: false }
  );

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [taskForm, setTaskForm] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    prioridad: 'Media',
    horas_estimadas: '',
    estado: 'Por_hacer',
  });

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.createTarea({
        ...taskForm,
        id_proyecto: projectId,
        horas_estimadas: parseFloat(taskForm.horas_estimadas) || null,
      });
      setSuccess('Tarea creada exitosamente');
      setTaskForm({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_vencimiento: '',
        prioridad: 'Media',
        horas_estimadas: '',
        estado: 'Por_hacer',
      });
      setIsTaskModalOpen(false);
      mutateTareas();
    } catch (err) {
      setError('Error al crear la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      try {
        await api.deleteTarea(id);
        setSuccess('Tarea eliminada exitosamente');
        mutateTareas();
      } catch (err) {
        setError('Error al eliminar la tarea');
      }
    }
  };

  const prioridadColor: Record<string, 'danger' | 'warning' | 'primary'> = {
    Alta: 'danger',
    Media: 'warning',
    Baja: 'primary',
  };

  const estadoColor: Record<string, 'danger' | 'warning' | 'primary' | 'success'> = {
    Por_hacer: 'danger',
    En_progreso: 'warning',
    En_revision: 'primary',
    Completada: 'success',
  };

  if (!proyecto) {
    return <div className="text-center py-8">Cargando proyecto...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{proyecto.nombre}</h1>
          <p className="text-gray-600 mt-1">{proyecto.descripcion}</p>
        </div>
        <Badge variant={proyecto.estado === 'Activo' ? 'success' : proyecto.estado === 'Pausado' ? 'warning' : 'danger'}>
          {proyecto.estado}
        </Badge>
      </div>

      {error && (
        <Alert type="error" title="Error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" title="Éxito" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Resumen del Proyecto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Presupuesto Total</h3>
            <p className="text-2xl font-bold text-blue-600 mt-2">${proyecto.presupuesto_total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Inicio</h3>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {new Date(proyecto.fecha_inicio).toLocaleDateString()}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Fin Previsto</h3>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toLocaleDateString() : 'N/A'}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Tareas */}
      <Card>
        <CardHeader
          title="Tareas del Proyecto"
          action={
            <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
              + Nueva Tarea
            </Button>
          }
        />
        <CardBody>
          {Array.isArray(tareas) && tareas.length > 0 ? (
            <div className="space-y-3">
              {tareas.map((tarea: Tarea) => (
                <div
                  key={tarea.id_tarea}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{tarea.titulo}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={prioridadColor[tarea.prioridad]}>
                        {tarea.prioridad}
                      </Badge>
                      <Badge variant={estadoColor[tarea.estado]}>
                        {tarea.estado.replace('_', ' ')}
                      </Badge>
                      {tarea.horas_estimadas && (
                        <span className="text-sm text-gray-600">
                          {tarea.horas_estimadas} horas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                    </span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteTask(tarea.id_tarea)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay tareas en este proyecto</p>
          )}
        </CardBody>
      </Card>

      {/* Modal para crear tarea */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Crear Nueva Tarea"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTaskModalOpen(false)}>
              Cancelar
            </Button>
            <Button loading={loading} onClick={handleCreateTask}>
              Crear Tarea
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Título de la Tarea"
            name="titulo"
            value={taskForm.titulo}
            onChange={handleTaskChange}
            placeholder="Mi tarea"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={taskForm.descripcion}
              onChange={handleTaskChange}
              placeholder="Descripción de la tarea"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Input
            label="Fecha de Inicio"
            type="date"
            name="fecha_inicio"
            value={taskForm.fecha_inicio}
            onChange={handleTaskChange}
            required
          />

          <Input
            label="Fecha de Vencimiento"
            type="date"
            name="fecha_vencimiento"
            value={taskForm.fecha_vencimiento}
            onChange={handleTaskChange}
            required
          />

          <Input
            label="Horas Estimadas"
            type="number"
            name="horas_estimadas"
            value={taskForm.horas_estimadas}
            onChange={handleTaskChange}
            placeholder="0"
            step="0.5"
          />

          <Select
            label="Prioridad"
            name="prioridad"
            value={taskForm.prioridad}
            onChange={handleTaskChange}
            options={[
              { value: 'Baja', label: 'Baja' },
              { value: 'Media', label: 'Media' },
              { value: 'Alta', label: 'Alta' },
            ]}
          />

          <Select
            label="Estado"
            name="estado"
            value={taskForm.estado}
            onChange={handleTaskChange}
            options={[
              { value: 'Por_hacer', label: 'Por Hacer' },
              { value: 'En_progreso', label: 'En Progreso' },
              { value: 'En_revision', label: 'En Revisión' },
              { value: 'Completada', label: 'Completada' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
}
