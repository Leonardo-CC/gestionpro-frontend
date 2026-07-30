'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../services/api';

interface RegistroHorasProps {
  tarea: {
    id_tarea: number;
    titulo: string;
    estado?: string;
    horas_estimadas?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onHorasUpdated?: () => void;
}

export default function RegistroHorasModal({ tarea, isOpen, onClose, onHorasUpdated }: RegistroHorasProps) {
  const { data: registros = [], mutate } = useSWR(
    isOpen && tarea?.id_tarea ? `/registro-horas/?tarea=${tarea.id_tarea}` : null,
    () => api.getRegistroHoras(tarea.id_tarea),
    { revalidateOnFocus: false }
  );

  const [horas, setHoras] = useState('');
  const [comentario, setComentario] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Cálculos Financieros y Operativos
  const totalHorasInvertidas = Array.isArray(registros)
    ? registros.reduce((sum: number, r: any) => sum + Number(r.horas_trabajadas || 0), 0)
    : 0;

  const estimadas = Number(tarea?.horas_estimadas || 0);
  const porcentajeHoras = estimadas > 0 ? Math.min(100, Math.round((totalHorasInvertidas / estimadas) * 100)) : 0;
  
  // Métrica de Eficiencia
  const diferenciaHoras = estimadas - totalHorasInvertidas;
  const esEficiente = diferenciaHoras >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantHoras = parseFloat(horas);
    if (isNaN(cantHoras) || cantHoras <= 0) return;

    setLoading(true);
    try {
      await api.createRegistroHoras({
        id_tarea: tarea.id_tarea,
        horas_trabajadas: cantHoras,
        fecha,
        comentario: comentario.trim() || null,
      });

      setHoras('');
      setComentario('');
      mutate();
      if (onHorasUpdated) onHorasUpdated();
    } catch (err) {
      console.error('Error al registrar horas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-slate-100">
        
        {/* Encabezado */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              TSK-{tarea.id_tarea}
            </span>
            <h3 className="text-base font-bold text-white mt-1">{tarea.titulo}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Indicador de Tiempo y Rendimiento */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Progreso de Horas:</span>
            <span className="text-slate-200">
              <strong className="text-blue-400">{totalHorasInvertidas} hrs</strong> / {estimadas > 0 ? `${estimadas} hrs estimadas` : 'Sin estimar'}
            </span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                estimadas > 0 && totalHorasInvertidas > estimadas ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${porcentajeHoras}%` }}
            />
          </div>

          {/* 💡 Badge de Eficiencia: solo si hay horas trabajadas o la tarea concluyó */}
          {estimadas > 0 && (totalHorasInvertidas > 0 || tarea.estado === 'FINALIZADO' || tarea.estado === 'COMPLETADA') && (
            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-900">
              <span className="text-slate-400">Balance de Eficiencia:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  esEficiente
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {esEficiente
                  ? `+${diferenciaHoras} hrs ahorradas (Óptimo)`
                  : `${Math.abs(diferenciaHoras)} hrs excedidas (Revisar)`}
              </span>
            </div>
          )}
        </div>

        {/* Formulario para Cargar Horas */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
          <h4 className="text-xs font-bold text-slate-300">⏱️ Cargar Registro de Trabajo</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Horas Invertidas</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                placeholder="Ej: 2.5"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Fecha de Ejecución</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Comentario / Resumen del avance</label>
            <input
              type="text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ej: Corrección de consultas SQL y refactorización..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 shadow-md"
            >
              {loading ? 'Guardando...' : 'Registrar Tiempo'}
            </button>
          </div>
        </form>

        {/* Listado de Logs de Trabajo */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400">Historial de Trabajo de esta Tarea</h4>
          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {Array.isArray(registros) && registros.length > 0 ? (
              registros.map((r: any) => (
                <div key={r.id_registro} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{r.comentario || 'Trabajo realizado'}</span>
                    <p className="text-[10px] text-slate-500">
                      Por: <strong className="text-slate-400">{r.usuario_nombre || 'Desarrollador'}</strong> el {new Date(r.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                    +{r.horas_trabajadas} hrs
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 text-xs py-4 italic">No hay registros de horas cargadas todavía.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}