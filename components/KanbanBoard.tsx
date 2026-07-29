'use client';

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

export interface Tarea {
  id_tarea: number;
  id_proyecto?: number;
  proyecto_nombre?: string;
  titulo: string;
  descripcion?: string;
  estado: string;
  codigo?: string;
  fecha_vencimiento?: string;
  prioridad?: string;
  responsable_nombre?: string;
}

export interface KanbanBoardRef {
  scrollToColumnIndex: (index: number) => void;
}

interface KanbanBoardProps {
  tareas: Tarea[];
  onTareaClick: (tarea: Tarea) => void;
  onCrearTarea?: (estado: string) => void;
  onCambiarEstadoTarea?: (idTarea: number, nuevoEstado: string) => Promise<void> | void;
  onScrollChange?: (scrollRatio: number, viewportRatio: number) => void;
}

const COLUMNAS = [
  { id: 'IDEA', titulo: 'Propuestas e Ideas', color: 'border-purple-500/40' },
  { id: 'POR_HACER', titulo: 'Por Ejecutar', color: 'border-amber-500/40' },
  { id: 'EN_CURSO', titulo: 'En Proceso', color: 'border-blue-500/40' },
  { id: 'PRUEBAS', titulo: 'Revisión / Control', color: 'border-orange-500/40' },
  { id: 'FINALIZADO', titulo: 'Concluido', color: 'border-emerald-500/40' },
];

const KanbanBoard = forwardRef<KanbanBoardRef, KanbanBoardProps>(({
  tareas = [],
  onTareaClick,
  onCrearTarea,
  onCambiarEstadoTarea,
  onScrollChange,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedTareaId, setDraggedTareaId] = useState<number | null>(null);
  const [columnaTarget, setColumnaTarget] = useState<string | null>(null);

  // Notificar al componente padre cuando hay scroll
  const handleScroll = () => {
    if (!containerRef.current || !onScrollChange) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    if (maxScroll > 0) {
      onScrollChange(scrollLeft / maxScroll, clientWidth / scrollWidth);
    } else {
      onScrollChange(0, 1);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [tareas]);

  // Exponer la función de scroll a la ref
  useImperativeHandle(ref, () => ({
    scrollToColumnIndex: (index: number) => {
      if (!containerRef.current) return;
      const { scrollWidth, clientWidth } = containerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const ratio = index / (COLUMNAS.length - 1);
      containerRef.current.scrollTo({
        left: ratio * maxScroll,
        behavior: 'smooth',
      });
    },
  }));

  const getTareasPorEstado = (estadoId: string) => {
    return tareas.filter((t) => t.estado?.toUpperCase().replace(' ', '_') === estadoId);
  };

  const formatFecha = (fechaStr?: string) => {
    if (!fechaStr) return null;
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getPrioridadColor = (prioridad?: string) => {
    switch (prioridad?.toLowerCase()) {
      case 'alta':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'media':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'baja':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/30';
    }
  };

  const handleDragStart = (e: React.DragEvent, idTarea: number) => {
    setDraggedTareaId(idTarea);
    e.dataTransfer.setData('text/plain', String(idTarea));
  };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    setColumnaTarget(null);
    const idTarea = draggedTareaId || Number(e.dataTransfer.getData('text/plain'));
    if (idTarea && onCambiarEstadoTarea) {
      await onCambiarEstadoTarea(idTarea, nuevoEstado);
    }
    setDraggedTareaId(null);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-x-auto p-6 text-slate-200 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-4 min-w-max">
          {COLUMNAS.map((col) => {
            const tareasColumna = getTareasPorEstado(col.id);
            const isTarget = columnaTarget === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); setColumnaTarget(col.id); }}
                onDragLeave={() => setColumnaTarget(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-80 bg-slate-900/90 border transition-all rounded-xl flex flex-col min-h-[550px] max-h-[calc(100vh-220px)] ${
                  isTarget ? 'border-blue-500 bg-slate-900 ring-2 ring-blue-500/20' : 'border-slate-800'
                }`}
              >
                {/* Encabezado */}
                <div className={`p-3.5 flex items-center justify-between border-b ${col.color}`}>
                  <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase">{col.titulo}</h3>
                  <span className="text-[11px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/50">
                    {tareasColumna.length}
                  </span>
                </div>

                {/* Lista de Tarjetas */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {tareasColumna.map((tarea) => {
                    const iniciales = tarea.responsable_nombre
                      ? tarea.responsable_nombre.substring(0, 2).toUpperCase()
                      : 'SA';

                    return (
                      <div
                        key={tarea.id_tarea}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tarea.id_tarea)}
                        onClick={() => onTareaClick(tarea)}
                        className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 rounded-lg p-3.5 shadow-md cursor-pointer transition-all group"
                      >
                        {tarea.proyecto_nombre && (
                          <div className="mb-2">
                            <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                              📁 {tarea.proyecto_nombre}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-slate-400">{tarea.codigo || `TSK-${tarea.id_tarea}`}</span>
                          {tarea.prioridad && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getPrioridadColor(tarea.prioridad)}`}>
                              {tarea.prioridad}
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                          {tarea.titulo}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 mt-2">
                          <span className="text-[11px] text-slate-400">{formatFecha(tarea.fecha_vencimiento) || 'Sin fecha'}</span>
                          <div
                            title={tarea.responsable_nombre || 'Sin asignar'}
                            className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold"
                          >
                            {iniciales}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => onCrearTarea && onCrearTarea(col.id)}
                  className="m-2 p-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-dashed border-slate-800 hover:border-slate-700 transition-all text-center"
                >
                  + Agregar Tarea
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

KanbanBoard.displayName = 'KanbanBoard';
export default KanbanBoard;
