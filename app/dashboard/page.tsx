'use client';

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import api from '../../services/api';

interface Tarea {
  id_tarea: number;
  titulo: string;
  estado: string;
  prioridad: string;
  fecha_vencimiento: string;
  id_proyecto: number;
}

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  presupuesto_total: number;
  costo_invertido?: number;
  estado: string;
}

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('Usuario');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'Miembro_Equipo');
    setUserName(localStorage.getItem('userName') || 'Usuario');
  }, []);

  const { data: proyectos = [] } = useSWR('/proyectos', () => api.getProyectos(), { revalidateOnFocus: false });
  const { data: tareas = [] } = useSWR('/tareas', () => api.getTareas(), { revalidateOnFocus: false });
  const { data: registroHoras = [] } = useSWR('/registro-horas', () => api.getRegistroHoras(), { revalidateOnFocus: false });

  const isMiembro = userRole === 'Miembro_Equipo';

  // Métricas calculadas para el Miembro de Equipo
  const tareasPendientes = useMemo(() => {
    if (!Array.isArray(tareas)) return [];
    return tareas.filter((t: Tarea) => t.estado !== 'COMPLETADA' && t.estado !== 'FINALIZADO');
  }, [tareas]);

  const tareasEnProceso = useMemo(() => {
    if (!Array.isArray(tareas)) return [];
    return tareas.filter((t: Tarea) => t.estado === 'EN_PROCESO' || t.estado === 'EN_CURSO');
  }, [tareas]);

  const misHorasTotales = useMemo(() => {
    if (!Array.isArray(registroHoras)) return 0;
    return registroHoras.reduce((acc: number, r: any) => acc + Number(r.horas_trabajadas || 0), 0);
  }, [registroHoras]);

  // Métricas calculadas para Gerente/Admin
  const presupuestoAcumulado = useMemo(() => {
    if (!Array.isArray(proyectos)) return 0;
    return proyectos.reduce((acc: number, p: Proyecto) => acc + Number(p.presupuesto_total || 0), 0);
  }, [proyectos]);

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Saludo y Encabezado */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          ¡Hola, {userName}!
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          {isMiembro
            ? 'Resumen de tus asignaciones activas, progreso personal y registros de tiempo'
            : 'Resumen ejecutivo de proyectos, métricas operativas y consumo presupuestario global'}
        </p>
      </div>

      {/* 📊 TARJETAS DE MÉTRICAS CON SUS BORDES Y ESTILOS DE COLOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {isMiembro ? (
          <>
            {/* Tareas Pendientes (Azul Slate) */}
            <div className="bg-slate-900/60 border-l-4 border-l-blue-500 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tareas Pendientes</span>
              <p className="text-3xl font-black text-white mt-2 font-mono">{tareasPendientes.length}</p>
            </div>

            {/* En Desarrollo Hoy (Azul Vivo) */}
            <div className="bg-slate-900/60 border-l-4 border-l-cyan-400 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">En Desarrollo Hoy</span>
              <p className="text-3xl font-black text-cyan-400 mt-2 font-mono">{tareasEnProceso.length}</p>
            </div>

            {/* Horas Imputadas (Púrpura) */}
            <div className="bg-slate-900/60 border-l-4 border-l-purple-500 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Horas Imputadas</span>
              <p className="text-3xl font-black text-purple-400 mt-2 font-mono">{misHorasTotales} hrs</p>
            </div>

            {/* Proyectos Activos (Esmeralda) */}
            <div className="bg-slate-900/60 border-l-4 border-l-emerald-500 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Proyectos Activos</span>
              <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                {Array.isArray(proyectos) ? proyectos.filter((p: Proyecto) => p.estado === 'Activo').length : 0}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* 👑 TOTAL PROYECTOS (Borde Azul Principal) */}
            <div className="bg-slate-900/60 border-l-4 border-l-blue-500 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Proyectos</span>
              <p className="text-3xl font-black text-white mt-2 font-mono">{proyectos.length}</p>
            </div>

            {/* 👑 PROYECTOS ACTIVOS (Borde Esmeralda Verde) */}
            <div className="bg-slate-900/60 border-l-4 border-l-emerald-400 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Proyectos Activos</span>
              <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                {Array.isArray(proyectos) ? proyectos.filter((p: Proyecto) => p.estado === 'Activo').length : 0}
              </p>
            </div>

            {/* 👑 PRESUPUESTO ACUMULADO (Borde Azul Rey) */}
            <div className="bg-slate-900/60 border-l-4 border-l-blue-400 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Presupuesto Acumulado</span>
              <p className="text-2xl font-black text-blue-400 mt-2 font-mono">
                Bs. {presupuestoAcumulado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* 👑 HORAS INVERTIDAS (Borde Púrpura) */}
            <div className="bg-slate-900/60 border-l-4 border-l-purple-500 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Horas Invertidas</span>
              <p className="text-3xl font-black text-purple-400 mt-2 font-mono">{misHorasTotales} hrs</p>
            </div>
          </>
        )}

      </div>

      {/* 📋 SECCIÓN PRINCIPAL DE CONTENIDO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2 Cols): Tareas del Desarrollador o Proyectos Recientes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {isMiembro ? 'Mis Tareas Prioritarias' : 'Proyectos Recientes'}
              </h2>
              <Link
                href={isMiembro ? '/dashboard/tareas' : '/dashboard/proyectos'}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ver todo →
              </Link>
            </div>

            {isMiembro ? (
              /* Vista Lista de Tareas para Miembro */
              <div className="space-y-2.5">
                {tareasPendientes.slice(0, 5).map((tarea: Tarea) => (
                  <div
                    key={tarea.id_tarea}
                    className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{tarea.titulo}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                          TSK-{tarea.id_tarea}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Vence: {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                      </p>
                    </div>

                    <Link
                      href="/dashboard/tareas"
                      className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Ir a Kanban
                    </Link>
                  </div>
                ))}

                {tareasPendientes.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No tienes tareas pendientes por el momento.</p>
                )}
              </div>
            ) : (
              /* Vista Lista de Proyectos para Gerente / Admin */
              <div className="space-y-2.5">
                {proyectos.slice(0, 4).map((proyecto: Proyecto) => (
                  <div
                    key={proyecto.id_proyecto}
                    className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">{proyecto.nombre}</h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Presupuesto: Bs. {Number(proyecto.presupuesto_total).toLocaleString('es-BO')}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                      {proyecto.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha (1 Col): Accesos Rápidos */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
            <h2 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3">
              Acceso Rápido
            </h2>

            <Link
              href="/dashboard/tareas"
              className="w-full flex items-center justify-between p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>Tablero Kanban</span>
              <span className="text-blue-400">→</span>
            </Link>

            <Link
              href="/dashboard/cronograma"
              className="w-full flex items-center justify-between p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>Diagrama de Gantt</span>
              <span className="text-blue-400">→</span>
            </Link>

            <Link
              href="/dashboard/perfil"
              className="w-full flex items-center justify-between p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>Mi Perfil & Seguridad</span>
              <span className="text-blue-400">→</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}