'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  presupuesto_total: number | string;
  estado: string;
}

interface Tarea {
  id_tarea: number;
  id_proyecto: number;
  estado: string;
}

export default function ReportesPage() {
  const { data: proyectos = [], isLoading: loadingProyectos } = useSWR(
    '/proyectos',
    () => api.getProyectos(),
    { revalidateOnFocus: false }
  );

  const { data: tareas = [], isLoading: loadingTareas } = useSWR(
    '/tareas',
    () => api.getTareas(),
    { revalidateOnFocus: false }
  );

  const [exportFormat, setExportFormat] = useState('csv');

  // Función para calcular el progreso real basado en las tareas
  const obtenerProgresoReal = (idProyecto: number) => {
    if (!Array.isArray(tareas) || tareas.length === 0) return 0;
    const tareasProyecto = tareas.filter(
      (t: Tarea) => Number(t.id_proyecto) === Number(idProyecto)
    );
    if (tareasProyecto.length === 0) return 0;

    const completadas = tareasProyecto.filter(
      (t: Tarea) => t.estado === 'FINALIZADO' || t.estado === 'COMPLETADA'
    ).length;

    return Math.round((completadas / tareasProyecto.length) * 100);
  };

  // Función para manejar la exportación de reportes
  const handleExport = () => {
    if (exportFormat === 'csv') {
      const headers = ['ID Proyecto', 'Nombre del Proyecto', 'Presupuesto (Bs)', 'Estado', 'Progreso (%)'];
      const rows = proyectos.map((p: Proyecto) => [
        p.id_proyecto,
        `"${p.nombre.replace(/"/g, '""')}"`,
        Number(p.presupuesto_total || 0).toFixed(2),
        p.estado,
        `${obtenerProgresoReal(p.id_proyecto)}%`,
      ]);

      const csvContent =
        '\uFEFF' +
        [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_ejecutivo_proyectos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'pdf') {
      window.print();
    } else {
      alert(`Exportando datos en formato ${exportFormat.toUpperCase()}...`);
    }
  };

  const chartDataReales = Array.isArray(proyectos)
    ? proyectos.slice(0, 8).map((p: Proyecto) => ({
        name: p.nombre.length > 12 ? p.nombre.substring(0, 12) + '...' : p.nombre,
        Presupuesto: Number(p.presupuesto_total || 0),
      }))
    : [];

  const totalPresupuesto = Array.isArray(proyectos)
    ? proyectos.reduce((sum: number, p: Proyecto) => sum + Number(p.presupuesto_total || 0), 0)
    : 0;

  const proyectosCompletadosCount = Array.isArray(proyectos)
    ? proyectos.filter((p: Proyecto) => p.estado === 'Completado' || p.estado === 'FINALIZADO').length
    : 0;

  const tasaCompletitudGlobal = Array.isArray(proyectos) && proyectos.length > 0
    ? Math.round((proyectosCompletadosCount / proyectos.length) * 100)
    : 0;

  const estadoBadgeStyles: Record<string, string> = {
    Activo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Completado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Pausado: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Archivado: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Panel de Reportes & Analítica</span>
          </h1>
          <p className="text-slate-400 mt-1 text-xs">
            Métricas financieras, rendimiento operativo y seguimiento de hitos
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <div className="relative">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none [color-scheme:dark]"
            >
              <option value="csv" className="bg-slate-900 text-slate-100">CSV (Excel)</option>
              <option value="pdf" className="bg-slate-900 text-slate-100">Imprimir / PDF</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <Button
            onClick={handleExport}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg shadow-md font-semibold transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Exportar Reporte</span>
          </Button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm border-l-4 border-l-blue-500">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Total Presupuestado
          </span>
          <p className="text-2xl font-black text-blue-400 mt-1 font-mono">
            Bs. {totalPresupuesto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm border-l-4 border-l-emerald-500">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Proyectos Activos
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {proyectos.filter((p: Proyecto) => p.estado === 'Activo').length}
          </p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm border-l-4 border-l-indigo-500">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Concluidos
          </span>
          <p className="text-2xl font-black text-indigo-400 mt-1">
            {proyectosCompletadosCount}
          </p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm border-l-4 border-l-amber-500">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Tasa de Completitud
          </span>
          <p className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {tasaCompletitudGlobal}%
          </p>
        </div>
      </div>

      {/* Gráficos Recharts & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3">
            Presupuesto por Proyecto (Top 8)
          </h3>
          {chartDataReales.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartDataReales} margin={{ top: 10, right: 10, left: 15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => `Bs. ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value) => [`Bs. ${Number(value).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 'Presupuesto']}
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} />
                <Bar dataKey="Presupuesto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-500 text-xs italic">
              Aún no hay datos de proyectos para visualizar
            </div>
          )}
        </div>

        {/* Ranking de Proyectos por Presupuesto */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3">
            Top 5 Proyectos con Mayor Inversión
          </h3>
          <div className="space-y-3 pt-1">
            {Array.isArray(proyectos) && proyectos.length > 0 ? (
              [...proyectos]
                .sort((a: Proyecto, b: Proyecto) => Number(b.presupuesto_total || 0) - Number(a.presupuesto_total || 0))
                .slice(0, 5)
                .map((proyecto: Proyecto, index: number) => (
                  <div
                    key={proyecto.id_proyecto}
                    className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{proyecto.nombre}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                      Bs. {Number(proyecto.presupuesto_total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-center text-slate-500 text-xs py-12 italic">No hay suficientes proyectos registrados.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Seguimiento de Progreso Real */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white tracking-tight">Seguimiento Operativo y Avance de Tareas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Proyecto</th>
                <th className="px-6 py-3.5">Presupuesto</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 min-w-[220px]">Avance Real de Tareas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
              {Array.isArray(proyectos) && proyectos.length > 0 ? (
                proyectos.map((proyecto: Proyecto) => {
                  const progreso = obtenerProgresoReal(proyecto.id_proyecto);
                  return (
                    <tr key={proyecto.id_proyecto} className="hover:bg-slate-950/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-100 flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span>{proyecto.nombre}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-300">
                        Bs. {Number(proyecto.presupuesto_total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${
                            estadoBadgeStyles[proyecto.estado] || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {proyecto.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-700 ${
                                progreso === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progreso}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400 w-8 text-right">
                            {progreso}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500 italic">
                    Sin proyectos registrados para generar reporte.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}