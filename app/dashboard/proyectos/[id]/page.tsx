'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../../../../services/api';
import { Card, CardHeader, CardBody } from '../../../../components/Card';
import { Badge } from '../../../../components/Badge';
import { Button } from '../../../../components/Button';
import { Modal } from '../../../../components/Modal';
import { Input } from '../../../../components/Input';
import { Select } from '../../../../components/Select';
import { Alert } from '../../../../components/Alert';
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
  descripcion: string;
  estado: string;
  prioridad: string;
  fecha_vencimiento: string;
  horas_estimadas: number;
  responsable_nombre?: string;
}

interface Comentario {
  id_comentario: number;
  id_tarea: number;
  id_usuario: string;
  texto_comentario: string;
  fecha_creacion: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);

  const { data: proyecto } = useSWR(
    `/proyecto/${projectId}`,
    () => api.getProyecto(projectId),
    { revalidateOnFocus: false }
  );

  const { data: tareas = [], mutate: mutateTareas } = useSWR(
    projectId ? ['tareas', projectId] : null,
    () => api.getTareas(projectId),
    { revalidateOnFocus: false }
  );

  const { data: usuarios = [] } = useSWR(
    '/usuarios',
    () => api.getUsuarios(),
    { fallbackData: [] }
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
    usuario_id: '', 
  });

  // ESTILOS ESTILO JIRA PARA COMENTARIOS
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const { data: comentarios = [], mutate: mutateComentarios } = useSWR(
    expandedTask ? ['comentarios', expandedTask] : null,
    () => api.getComentarios(expandedTask!),
    { fallbackData: [], revalidateOnFocus: false }
  );

  const handleAddComment = async (tareaId: number) => {
    if (!newCommentText.trim()) return;

    try {
      const usuarioActual = usuarios[0]?.id_usuario;
      if (!usuarioActual) {
        alert('No se encontró un usuario activo.');
        return;
      }

      await api.createComentario({
        id_tarea: tareaId,
        id_usuario: usuarioActual,
        texto_comentario: newCommentText
      });

      setNewCommentText('');
      mutateComentarios();
    } catch (err) {
      setError('Error al guardar el comentario');
    }
  };

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
        usuario_asignado: taskForm.usuario_id
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
        usuario_id: '',
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

  const handleAssignUser = async (tareaId: number, usuarioId: string) => {
    try {
      if (api.updateTarea) {
        await api.updateTarea(tareaId, { usuario_asignado: usuarioId });
        mutateTareas();
        setSuccess('Responsable asignado exitosamente');
      }
    } catch (err) {
      setError('Error al asignar el usuario');
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
    return <div className="text-center py-12 text-gray-500 font-medium">Cargando tablero Jira...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Encabezado Estilo Tablero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-xs border border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <span>PROYECTO JIRA / ID #{proyecto.id_proyecto}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{proyecto.nombre}</h1>
          <p className="text-gray-600 mt-1 text-sm">{proyecto.descripcion}</p>
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

      {/* Métricas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-t-4 border-t-blue-500 shadow-xs">
          <CardBody>
            <h3 className="text-gray-500 text-xs font-bold uppercase">Presupuesto Total</h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">Bs. {Number(proyecto.presupuesto_total).toFixed(2)}</p>
          </CardBody>
        </Card>
        <Card className="border-t-4 border-t-green-500 shadow-xs">
          <CardBody>
            <h3 className="text-gray-500 text-xs font-bold uppercase">Fecha de Inicio</h3>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {new Date(proyecto.fecha_inicio).toLocaleDateString()}
            </p>
          </CardBody>
        </Card>
        <Card className="border-t-4 border-t-purple-500 shadow-xs">
          <CardBody>
            <h3 className="text-gray-500 text-xs font-bold uppercase">Fecha de Fin</h3>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toLocaleDateString() : 'Sin definir'}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Tarjetas de Tareas Estilo "Issue" de Jira */}
      <Card className="shadow-xs border border-gray-200">
        <CardHeader
          title="Backlog / Tareas del Proyecto"
          action={
            <Button onClick={() => setIsTaskModalOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-xs">
              + Crear Tarea
            </Button>
          }
        />
        <CardBody className="p-4 bg-gray-50/50">
          {Array.isArray(tareas) && tareas.length > 0 ? (
            <div className="space-y-3">
              {tareas.map((tarea: Tarea) => (
                <div
                  key={tarea.id_tarea}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Información Principal de la Tarea */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          TSK-{tarea.id_tarea}
                        </span>
                        <h4 className="font-bold text-gray-900 text-base">{tarea.titulo}</h4>
                        
                        {/* Asignación Estilo Jira (Avatar circular) */}
                        {(!tarea.responsable_nombre || tarea.responsable_nombre.trim().toLowerCase() === "sin asignar") ? (
                          <select
                            className="text-xs border border-gray-300 rounded-full bg-gray-50 px-3 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs hover:bg-white transition-colors"
                            onChange={(e) => handleAssignUser(tarea.id_tarea, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>👤 Asignar miembro...</option>
                            {usuarios.map((u: any) => (
                              <option key={u.id_usuario} value={u.id_usuario}>
                                {u.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
                              {tarea.responsable_nombre.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-blue-900">
                              {tarea.responsable_nombre}
                            </span>
                          </div>
                        )}
                      </div>

                      {tarea.descripcion && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{tarea.descripcion}</p>
                      )}
                      
                      {/* Badges de Prioridad y Estado */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant={prioridadColor[tarea.prioridad]}>
                          {tarea.prioridad}
                        </Badge>
                        <Badge variant={estadoColor[tarea.estado]}>
                          {tarea.estado.replace('_', ' ')}
                        </Badge>
                        {tarea.horas_estimadas && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md flex items-center gap-1 border border-gray-200">
                            ⏱ {tarea.horas_estimadas}h
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Acciones Laterales */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg">
                        📅 {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                      </span>
                      
                      {/* Botón Desplegable de Comentarios Estilo Jira */}
                      <Button
                        variant={expandedTask === tarea.id_tarea ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setExpandedTask(expandedTask === tarea.id_tarea ? null : tarea.id_tarea)}
                        className="text-xs shadow-xs"
                      >
                        💬 Comentarios
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTask(tarea.id_tarea)}
                        className="text-xs opacity-80 hover:opacity-100"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>

                  {/* ================= SECCIÓN DE COMENTARIOS ESTILO JIRA ================= */}
                  {expandedTask === tarea.id_tarea && (
                    <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/80 rounded-xl p-4 animate-fade-in">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <span>📋</span> Actividad y Comentarios ({comentarios.length})
                        </h5>
                      </div>
                      
                      {/* Lista de Comentarios Estilo Chat Profesional */}
                      <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
                        {Array.isArray(comentarios) && comentarios.length > 0 ? (
                          comentarios.map((c: Comentario) => (
                            <div key={c.id_comentario} className="flex gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                U
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-gray-900 text-xs">Colaborador / Gerente</span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(c.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(c.fecha_creacion).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.texto_comentario}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-xs text-gray-400">Aún no hay comentarios en esta tarea. Inicia la conversación con tu equipo.</p>
                          </div>
                        )}
                      </div>

                      {/* Input de Comentarios Estilo Jira */}
                      <div className="flex gap-2 items-center bg-white p-1.5 rounded-xl border border-gray-300 shadow-xs">
                        <Input
                          name="newCommentText"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Escribe un comentario o actualización..."
                          className="flex-1 border-none shadow-none focus:ring-0 text-sm bg-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(tarea.id_tarea);
                            }
                          }}
                        />
                        <Button 
                          onClick={() => handleAddComment(tarea.id_tarea)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 px-4 text-xs shadow-xs"
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* ====================================================================== */}

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-sm text-gray-500 font-medium">No hay tareas creadas en este proyecto.</p>
              <p className="text-xs text-gray-400 mt-1">Haz clic en "+ Crear Tarea" para comenzar el sprint.</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal para Crear Tarea */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Crear Nueva Tarea (Issue)"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTaskModalOpen(false)}>
              Cancelar
            </Button>
            <Button loading={loading} onClick={handleCreateTask} className="bg-blue-600 hover:bg-blue-700">
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
            placeholder="Ej: Configurar base de datos en Supabase"
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
              placeholder="Añade detalles o requerimientos de la tarea..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <Select
            label="Asignar Responsable"
            name="usuario_id"
            value={taskForm.usuario_id}
            onChange={handleTaskChange}
            options={[
              { value: '', label: '-- Seleccionar Responsable --' },
              ...usuarios.map((u: any) => ({
                value: u.id_usuario,
                label: `${u.nombre} (${u.rol.replace('_', ' ')})`
              }))
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </form>
      </Modal>
    </div>
  );
}
