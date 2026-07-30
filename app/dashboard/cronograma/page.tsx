'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '../../../services/api';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
}

interface Tarea {
  id_tarea: number;
  id_proyecto: number;
  proyecto_nombre?: string;
  titulo: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: string;
  prioridad: string;
  horas_estimadas?: number;
  tarea_predecesora_id?: number;
}

export default function CronogramaPage() {
  const [selectedProyectoId, setSelectedProyectoId] = useState<string>('TODOS');

  // 1. Cargar Proyectos
  const { data: proyectos = [], isLoading: loadingProyectos } = useSWR(
    '/proyectos',
    () => api.getProyectos(),
    { revalidateOnFocus: false }
  );

  // 2. Cargar Tareas
  const { data: tareas = [], isLoading: loadingTareas } = useSWR(
    '/tareas',
    () => api.getTareas(),
    { revalidateOnFocus: false }
  );

  const isLoading = loadingProyectos || loadingTareas;

  // Filtrado de Tareas
  const tareasFiltradas = useMemo(() => {
    if (!Array.isArray(tareas)) return [];
    if (selectedProyectoId === 'TODOS') return tareas;
    return tareas.filter((t: Tarea) => String(t.id_proyecto) === selectedProyectoId);
  }, [tareas, selectedProyectoId]);

  // Cálculo de Rango global de Fechas para dibujar la línea de tiempo
  const timelineDates = useMemo(() => {
    if (tareasFiltradas.length === 0) {
      const hoy = new Date();
      return Array.from({ length: 14 }, (_, i) => {
        const d = new Date(hoy);
        d.setDate(d.getDate() + i);
        return d;
      });
    }

    let minDate = new Date();
    let maxDate = new Date();

    tareasFiltradas.forEach((t: Tarea) => {
      const inicio = new Date(t.fecha_inicio || Date.now());
      const fin = new Date(t.fecha_vencimiento || Date.now());
      if (inicio < minDate) minDate = new Date(inicio);
      if (fin > maxDate) maxDate = new Date(fin);
    });

    // Agregar margen de 2 días antes y después
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 3);

    const dateArray: Date[] = [];
    const current = new Date(minDate);

    while (current <= maxDate) {
      dateArray.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dateArray;
  }, [tareasFiltradas]);

  const totalDays = timelineDates.length;

  const getPositionStyles = (fechaInicioStr: string, fechaFinStr: string) => {
    if (!timelineDates.length) return { left: '0%', width: '100%' };

    const firstDate = timelineDates[0].getTime();
    const lastDate = timelineDates[timelineDates.length - 1].getTime();
    const totalDuration = lastDate - firstDate || 1;

    const inicio = new Date(fechaInicioStr || Date.now()).getTime();
    const fin = new Date(fechaFinStr || Date.now()).getTime();

    const startOffset = Math.max(0, inicio - firstDate);
    const duration = Math.max(86400000, fin - inicio + 86400000); // Mínimo 1 día de duración

    const left = (startOffset / totalDuration) * 100;
    const width = (duration / totalDuration) * 100;

    return {
      left: `${Math.min(Math.max(left, 0), 95)}%`,
      width: `${Math.min(Math.max(width, 5), 100 - left)}%`,
    };
  };

  const estadoGanttColors: Record<string, string> = {
    FINALIZADO: 'bg-emerald-500/80 border-emerald-400 text-emerald-100',
    COMPLETADA: 'bg-emerald-500/80 border-emerald-400 text-emerald-100',
    EN_CURSO: 'bg-blue-500/80 border-blue-400 text-blue-100',
    POR_HACER: 'bg-amber-500/80 border-amber-400 text-amber-100',
    IDEA: 'bg-purple-500/80 border-purple-400 text-purple-100',
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Diagrama de Gantt & Cronograma</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Visualización temporal de hitos, dependencias y tiempos de entrega por proyecto
          </p>
        </div>

        {/* Filtro por Proyecto */}
        <div className="relative">
          <select
            value={selectedProyectoId}
            onChange={(e) => setSelectedProyectoId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none [color-scheme:dark]"
          >
            <option value="TODOS" className="bg-slate-900 text-slate-100">Todos los Proyectos</option>
            {Array.isArray(proyectos) &&
              proyectos.map((p: Proyecto) => (
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
      </div>

      {/* Contenedor del Diagrama de Gantt */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Cargando la línea de tiempo operativa...
          </div>
        ) : tareasFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              
              {/* Cabecera con Fechas de la Línea de Tiempo */}
              <div className="flex border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono text-slate-400 font-bold uppercase py-3">
                <div className="w-72 shrink-0 px-4 border-r border-slate-800 flex items-center">
                  Tarea / Hito
                </div>
                <div className="flex-1 flex justify-between px-2">
                  {timelineDates.map((date, idx) => (
                    <div key={idx} className="text-center flex-1 border-r border-slate-800/40 last:border-r-0">
                      <div>{date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filas de Tareas del Gantt */}
              <div className="divide-y divide-slate-800/50 bg-slate-950/30">
                {tareasFiltradas.map((tarea: Tarea) => {
                  const pos = getPositionStyles(tarea.fecha_inicio, tarea.fecha_vencimiento);
                  const colorClass = estadoGanttColors[tarea.estado?.toUpperCase().replace(' ', '_')] || 'bg-slate-700 border-slate-600 text-slate-200';

                  return (
                    <div key={tarea.id_tarea} className="flex items-center hover:bg-slate-900/80 transition-colors py-3 group">
                      
                      {/* Título de la Tarea e Info */}
                      <div className="w-72 shrink-0 px-4 border-r border-slate-800/80">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                            {tarea.titulo}
                          </span>
                          <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                            TSK-{tarea.id_tarea}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>{new Date(tarea.fecha_inicio).toLocaleDateString()}</span>
                          <span>→</span>
                          <span>{new Date(tarea.fecha_vencimiento).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Barra de Gantt Representativa */}
                      <div className="flex-1 px-3 relative h-7 flex items-center">
                        <div
                          style={{ left: pos.left, width: pos.width }}
                          className={`absolute h-6 rounded-lg border shadow-md flex items-center px-2 text-[10px] font-mono font-bold truncate transition-all ${colorClass}`}
                          title={`${tarea.titulo} (${tarea.estado})`}
                        >
                          <span className="truncate">{tarea.titulo}</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs italic">
            No hay tareas programadas en el proyecto seleccionado.
          </div>
        )}
      </div>
    </div>
  );
}