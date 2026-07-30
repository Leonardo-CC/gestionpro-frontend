'use client';

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import api from '../../services/api';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  presupuesto_total: number;
  estado: string;
  fecha_fin: string;
}

interface Tarea {
  id_tarea: number;
  id_proyecto: number;
  estado: string;
  horas_estimadas?: number;
}

interface RegistroHora {
  id_registro: number;
  id_tarea: number;
  horas_trabajadas: number | string;
}

export default function DashboardPage() {
  // 1. Cargar Proyectos
  const { data: proyectos = [], isLoading: loadingProyectos } = useSWR(
    '/proyectos',
    () => api.getProyectos(),
    { revalidateOnFocus: false }
  );

  // 2. Cargar Tareas para calcular progreso real
  const { data: tareas = [], isLoading: loadingTareas } = useSWR(
    '/tareas',
    () => api.getTareas(),
    { revalidateOnFocus: false }
  );

  // 3. Cargar Registro de Horas
  const { data: registrosHoras = [], isLoading: loadingHoras } = useSWR(
    '/registro-horas',
    () => api.getRegistroHoras(),
    { revalidateOnFocus: false }
  );

  const isLoading = loadingProyectos || loadingTareas || loadingHoras;

  const estadoBadgeClass: Record<string, string> = {
    Activo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Completado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Pausado: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Archivado: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  // HELPER: Convertir decimales a formato de tiempo limpio
  const formatHorasLimpio = (valDecimal: number) => {
    if (!valDecimal || isNaN(valDecimal) || valDecimal <= 0) return '0 hrs';
    const hrs = Math.floor(valDecimal);
    const mins = Math.round((valDecimal - hrs) * 60);

    if (mins === 0) return `${hrs} hrs`;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  // Cálculo de progreso real por proyecto
  const obtenerProgresoReal = (idProyecto: number) => {
    if (!Array.isArray(tareas) || tareas.length === 0) return 0;

    const tareasDelProyecto = tareas.filter(
      (t: Tarea) => Number(t.id_proyecto) === Number(idProyecto)
    );

    if (tareasDelProyecto.length === 0) return 0;

    const completadas = tareasDelProyecto.filter(
      (t: Tarea) => t.estado === 'FINALIZADO' || t.estado === 'COMPLETADA'
    ).length;

    return Math.round((completadas / tareasDelProyecto.length) * 100);
  };

  // Cálculo de horas por proyecto
  const obtenerHorasTrabajadasProyecto = (idProyecto: number) => {
    if (!Array.isArray(tareas) || !Array.isArray(registrosHoras)) return 0;

    const idsTareasProyecto = tareas
      .filter((t: Tarea) => Number(t.id_proyecto) === Number(idProyecto))
      .map((t: Tarea) => Number(t.id_tarea));

    return registrosHoras
      .filter((r: RegistroHora) => idsTareasProyecto.includes(Number(r.id_tarea)))
      .reduce((sum: number, r: RegistroHora) => sum + Number(r.horas_trabajadas || 0), 0);
  };

  // Presupuesto total acumulado
  const presupuestoTotalAcc = Array.isArray(proyectos)
    ? proyectos.reduce((sum: number, p: Proyecto) => sum + Number(p.presupuesto_total || 0), 0)
    : 0;

  // Horas acumuladas globales
  const totalHorasInvertidasSistema = Array.isArray(registrosHoras)
    ? registrosHoras.reduce((sum: number, r: RegistroHora) => sum + Number(r.horas_trabajadas || 0), 0)
    : 0;

  return (
    <div className="space-y-8 text-slate-200">
      {/* Encabezado Principal */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard General</h1>
        <p className="text-slate-400 text-xs mt-1">
          Resumen ejecutivo de proyectos, métricas operativas y seguimiento del tiempo real trabajado
        </p>
      </div>

      {/* Tarjetas de Métricas Clave con Bordes de Color Uniformes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* 1. Total Proyectos */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm border-l-4 border-l-blue-500">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Total Proyectos</span>
          <p className="text-3xl font-black text-blue-400 mt-2">
            {isLoading ? '...' : proyectos.length}
          </p>
        </div>

        {/* 2. Proyectos Activos */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm border-l-4 border-l-emerald-500">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Proyectos Activos</span>
          <p className="text-3xl font-black text-emerald-400 mt-2">
            {isLoading ? '...' : proyectos.filter((p: Proyecto) => p.estado === 'Activo').length}
          </p>
        </div>

        {/* 3. Presupuesto Acumulado */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm border-l-4 border-l-indigo-500">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Presupuesto Acumulado</span>
          <p className="text-2xl font-black text-indigo-400 mt-2">
            Bs. {isLoading ? '...' : presupuestoTotalAcc.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* 4. Horas Invertidas */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm border-l-4 border-l-purple-500">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Horas Invertidas</span>
          <p className="text-3xl font-black text-purple-400 mt-2 font-mono">
            {isLoading ? '...' : formatHorasLimpio(totalHorasInvertidasSistema)}
          </p>
        </div>

      </div>

      {/* Listado de Proyectos Recientes */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Proyectos Recientes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Acceso directo al resumen y tablero operativo</p>
          </div>
          <Link
            href="/dashboard/proyectos"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
          >
            <span>Ver todos los proyectos</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              Cargando información de proyectos y tareas...
            </div>
          ) : Array.isArray(proyectos) && proyectos.length > 0 ? (
            <div className="space-y-3">
              {proyectos.slice(0, 5).map((proyecto: Proyecto) => {
                const porcentaje = obtenerProgresoReal(proyecto.id_proyecto);
                const hrsTrabajadasNum = obtenerHorasTrabajadasProyecto(proyecto.id_proyecto);

                return (
                  <Link
                    key={proyecto.id_proyecto}
                    href={`/dashboard/proyectos/${proyecto.id_proyecto}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/70 hover:bg-slate-950 rounded-xl border border-slate-800/80 transition-all group gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-sm">
                          {proyecto.nombre}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-[11px] text-slate-400">
                          Presupuesto: <span className="text-slate-200 font-semibold">Bs. {Number(proyecto.presupuesto_total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                        </p>
                        
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                          <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatHorasLimpio(hrsTrabajadasNum)} registradas</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                      {/* Barra de Progreso REAL */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-28 bg-slate-900 border border-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              porcentaje === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400 w-8 text-right">
                          {porcentaje}%
                        </span>
                      </div>

                      {/* Badge de Estado */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${
                          estadoBadgeClass[proyecto.estado] || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {proyecto.estado}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              No hay proyectos registrados en el sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}