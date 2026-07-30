'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import api from '../../../services/api';
import KanbanBoard, { Tarea, KanbanBoardRef } from '../../../components/KanbanBoard';
import TareaDetailModal from '../../../components/TareaDetailModal';
import RegistroHorasModal from '../../../components/RegistroHorasModal';
import { Modal } from '../../../components/Modal';
import { Alert } from '../../../components/Alert';

function TareasContent() {
  const searchParams = useSearchParams();
  const proyectoParam = searchParams.get('proyecto');

  const [selectedProyectoId, setSelectedProyectoId] = useState<string>('TODOS');
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 🔒 Datos de Sesión y Rol
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'Miembro_Equipo');
    setUserId(localStorage.getItem('userId') || '');
    setUserName(localStorage.getItem('userName') || 'Usuario Activo');
  }, []);

  const isManagerOrAdmin = userRole === 'Administrador' || userRole === 'Gerente_Proyecto';

  // Modal para Registro de Horas
  const [tareaParaHoras, setTareaParaHoras] = useState<Tarea | null>(null);
  const [isHorasModalOpen, setIsHorasModalOpen] = useState(false);

  // Captura el proyecto de la URL (?proyecto=ID)
  useEffect(() => {
    if (proyectoParam) {
      setSelectedProyectoId(String(proyectoParam));
    }
  }, [proyectoParam]);

  // Estados del Minimapa
  const [scrollRatio, setScrollRatio] = useState(0);
  const [viewportRatio, setViewportRatio] = useState(1);
  const kanbanRef = useRef<KanbanBoardRef>(null);

  // 1. Cargar Proyectos
  const { data: proyectos = [] } = useSWR('/proyectos', () => api.getProyectos(), {
    revalidateOnFocus: false,
  });

  // 2. Cargar Usuarios
  const { data: usuarios = [] } = useSWR('/usuarios', () => api.getUsuarios(), {
    revalidateOnFocus: false,
  });

  // 3. Cargar Tareas
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);

  const loadTareas = async () => {
    setLoadingTareas(true);
    try {
      const data = await api.getTareas();
      setTareas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando las tareas:', e);
    } finally {
      setLoadingTareas(false);
    }
  };

  useEffect(() => {
    loadTareas();
  }, []);

  // 4. Vincular Nombre del Proyecto a cada Tarea
  const tareasEnriquecidas = tareas.map((t) => {
    const proy = Array.isArray(proyectos)
      ? proyectos.find((p: any) => p.id_proyecto === t.id_proyecto)
      : null;
    return {
      ...t,
      proyecto_nombre: proy ? proy.nombre : undefined,
    };
  });

  // 5. Filtrar Tareas según el Selector
  const tareasFiltradas =
    selectedProyectoId === 'TODOS'
      ? tareasEnriquecidas
      : tareasEnriquecidas.filter((t) => String(t.id_proyecto) === selectedProyectoId);

  // 6. Arrastrar y Soltar Tareas
  const handleCambiarEstadoTarea = async (idTarea: number, nuevoEstado: string) => {
    try {
      setTareas((prev) =>
        prev.map((t) => (t.id_tarea === idTarea ? { ...t, estado: nuevoEstado } : t))
      );
      await api.updateTarea(idTarea, { estado: nuevoEstado });
    } catch (error) {
      console.error('Error al guardar el nuevo estado:', error);
      await loadTareas();
    }
  };

  // 7. Lógica para Crear Nueva Tarea
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newTareaData, setNewTareaData] = useState({
    titulo: '',
    descripcion: '',
    id_proyecto: '',
    estado: 'POR_HACER',
    prioridad: 'Media',
    fecha_vencimiento: '',
    horas_estimadas: '',
    usuario_asignado: '',
  });

  const handleOpenCrearTarea = (estadoInicial: string = 'POR_HACER') => {
    const primerProyecto = Array.isArray(proyectos) && proyectos.length > 0 ? String(proyectos[0].id_proyecto) : '';
    const proySeleccionado = selectedProyectoId !== 'TODOS' ? selectedProyectoId : primerProyecto;

    // 💡 Si es Miembro de Equipo, la tarea se asigna automáticamente a su ID
    const usuarioAsignadoInicial = isManagerOrAdmin ? '' : userId;

    setNewTareaData({
      titulo: '',
      descripcion: '',
      id_proyecto: proySeleccionado,
      estado: estadoInicial,
      prioridad: 'Media',
      fecha_vencimiento: '',
      horas_estimadas: '',
      usuario_asignado: usuarioAsignadoInicial,
    });
    setErrorMsg('');
    setIsCreateModalOpen(true);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTareaData.titulo.trim()) {
      setErrorMsg('El título de la tarea es obligatorio.');
      return;
    }
    if (!newTareaData.id_proyecto) {
      setErrorMsg('Debes seleccionar un proyecto.');
      return;
    }

    setCreateLoading(true);
    setErrorMsg('');

    try {
      const payload: any = {
        titulo: newTareaData.titulo.trim(),
        descripcion: newTareaData.descripcion.trim() || null,
        id_proyecto: Number(newTareaData.id_proyecto),
        estado: newTareaData.estado,
        prioridad: newTareaData.prioridad,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_vencimiento: newTareaData.fecha_vencimiento || null,
        horas_estimadas: parseFloat(newTareaData.horas_estimadas) || null,
      };

      // Determinar asignado final
      const finalUsuarioAsignado = isManagerOrAdmin ? newTareaData.usuario_asignado : userId;
      if (finalUsuarioAsignado) {
        payload.usuario_asignado = finalUsuarioAsignado;
      }

      await api.createTarea(payload);
      setSuccessMsg('Tarea creada correctamente');
      setIsCreateModalOpen(false);
      await loadTareas();
    } catch (err: any) {
      console.error('Error al crear la tarea:', err);
      setErrorMsg(
        err?.response?.data?.fecha_inicio?.[0] ||
        err?.response?.data?.detail ||
        'Error al guardar la tarea'
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenRegistroHoras = (tarea: Tarea) => {
    setTareaParaHoras(tarea);
    setIsHorasModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {errorMsg && (
        <Alert type="error" title="Error" onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert type="success" title="Éxito" onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {/* Encabezado y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tablero General de Tareas</h1>
          <p className="text-slate-400 text-xs mt-1">
            Visualiza, arrastra y gestiona el rendimiento del equipo en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Minimapa Arriba */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 rounded-lg shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400">Vista:</span>
            <div className="relative flex gap-1 h-5 px-1 py-0.5 bg-slate-950 rounded border border-slate-800 cursor-pointer">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  onClick={() => kanbanRef.current?.scrollToColumnIndex(idx)}
                  className="w-2.5 h-full bg-slate-800 rounded-sm hover:bg-slate-700 transition-colors"
                  title={`Ir a columna ${idx + 1}`}
                />
              ))}

              <div
                className="absolute top-0.5 bottom-0.5 border-2 border-blue-500 bg-blue-500/20 rounded pointer-events-none transition-all duration-75"
                style={{
                  width: `${Math.max(viewportRatio * 100, 30)}%`,
                  left: `${scrollRatio * (100 - Math.max(viewportRatio * 100, 30))}%`,
                }}
              />
            </div>
          </div>

          {/* Selector de Proyecto */}
          <div className="relative">
            <select
              value={selectedProyectoId}
              onChange={(e) => setSelectedProyectoId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none [color-scheme:dark]"
            >
              <option value="TODOS" className="bg-slate-900 text-slate-100">Todos los Proyectos</option>
              {Array.isArray(proyectos) &&
                proyectos.map((p: any) => (
                  <option key={p.id_proyecto} value={String(p.id_proyecto)} className="bg-slate-900 text-slate-100">
                    {p.nombre}
                  </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCrearTarea('POR_HACER')}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Contenedor del Tablero Kanban */}
      <div className="bg-slate-900/40 rounded-xl border border-slate-800/80 overflow-hidden min-h-[550px]">
        {loadingTareas ? (
          <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
            Cargando tareas del servidor...
          </div>
        ) : (
          <KanbanBoard
            ref={kanbanRef}
            tareas={tareasFiltradas}
            onTareaClick={(tarea) => {
              setSelectedTarea(tarea);
              setIsDetailOpen(true);
            }}
            onRegistrarHoras={(tarea) => {
              handleOpenRegistroHoras(tarea);
            }}
            onCrearTarea={(estadoColumna) => handleOpenCrearTarea(estadoColumna)}
            onCambiarEstadoTarea={handleCambiarEstadoTarea}
            onScrollChange={(sRatio, vRatio) => {
              setScrollRatio(sRatio);
              setViewportRatio(vRatio);
            }}
          />
        )}
      </div>

      {/* Modal para Ver Detalles de Tarea y Comentarios */}
      <TareaDetailModal
        tarea={selectedTarea}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateSuccess={loadTareas}
      />

      {/* Modal para Registro de Horas */}
      {tareaParaHoras && (
        <RegistroHorasModal
          tarea={tareaParaHoras}
          isOpen={isHorasModalOpen}
          onClose={() => {
            setIsHorasModalOpen(false);
            setTareaParaHoras(null);
          }}
          onHorasUpdated={loadTareas}
        />
      )}

      {/* Modal para Crear Nueva Tarea */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Tarea"
        size="lg"
      >
        <form onSubmit={handleCreateTaskSubmit} className="space-y-4 text-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Título de la Tarea</label>
            <input
              type="text"
              value={newTareaData.titulo}
              onChange={(e) => setNewTareaData({ ...newTareaData, titulo: e.target.value })}
              placeholder="Ej: Diseñar componentes UI"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 placeholder-slate-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Proyecto</label>
              <select
                value={newTareaData.id_proyecto}
                onChange={(e) => setNewTareaData({ ...newTareaData, id_proyecto: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 cursor-pointer [color-scheme:dark]"
                required
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Selecciona un proyecto
                </option>
                {Array.isArray(proyectos) &&
                  proyectos.map((p: any) => (
                    <option key={p.id_proyecto} value={String(p.id_proyecto)} className="bg-slate-900 text-slate-100">
                      {p.nombre}
                    </option>
                  ))}
              </select>
            </div>

            {/* 🔒 ASIGNACIÓN SEGÚN EL ROL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Asignar Responsable</label>
              {isManagerOrAdmin ? (
                /* 👑 Gerente / Admin: Selección libre de usuarios */
                <select
                  value={newTareaData.usuario_asignado}
                  onChange={(e) => setNewTareaData({ ...newTareaData, usuario_asignado: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 cursor-pointer [color-scheme:dark]"
                >
                  <option value="" className="bg-slate-900 text-slate-100">Sin Asignar</option>
                  {Array.isArray(usuarios) &&
                    usuarios.map((u: any) => (
                      <option key={u.id_usuario} value={String(u.id_usuario)} className="bg-slate-900 text-slate-100">
                        {u.nombre || u.email}
                      </option>
                    ))}
                </select>
              ) : (
                /* 💻 Miembro de Equipo: Auto-asignado bloqueado */
                <input
                  type="text"
                  readOnly
                  value={`👤 ${userName} (Auto-asignado)`}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 text-sm font-medium cursor-not-allowed"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
            <textarea
              value={newTareaData.descripcion}
              onChange={(e) => setNewTareaData({ ...newTareaData, descripcion: e.target.value })}
              placeholder="Detalles sobre lo que debe realizarse"
              rows={3}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Estado</label>
              <select
                value={newTareaData.estado}
                onChange={(e) => setNewTareaData({ ...newTareaData, estado: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [color-scheme:dark]"
              >
                <option value="IDEA" className="bg-slate-900 text-slate-100">Propuestas e Ideas</option>
                <option value="POR_HACER" className="bg-slate-900 text-slate-100">Por Ejecutar</option>
                <option value="EN_CURSO" className="bg-slate-900 text-slate-100">En Proceso</option>
                <option value="PRUEBAS" className="bg-slate-900 text-slate-100">Revisión / Control</option>
                <option value="FINALIZADO" className="bg-slate-900 text-slate-100">Concluido</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridad</label>
              <select
                value={newTareaData.prioridad}
                onChange={(e) => setNewTareaData({ ...newTareaData, prioridad: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [color-scheme:dark]"
              >
                <option value="Baja" className="bg-slate-900 text-slate-100">Baja</option>
                <option value="Media" className="bg-slate-900 text-slate-100">Media</option>
                <option value="Alta" className="bg-slate-900 text-slate-100">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Horas Est.</label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="Ej: 8"
                value={newTareaData.horas_estimadas}
                onChange={(e) => setNewTareaData({ ...newTareaData, horas_estimadas: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha Límite</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={newTareaData.fecha_vencimiento}
                onChange={(e) => setNewTareaData({ ...newTareaData, fecha_vencimiento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 shadow-md"
            >
              {createLoading ? 'Guardando...' : 'Guardar Tarea'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function TareasPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-400 text-sm">Cargando tablero...</div>}>
      <TareasContent />
    </Suspense>
  );
}