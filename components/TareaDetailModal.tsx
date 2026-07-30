'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../services/api';

interface TareaDetailModalProps {
  tarea: {
    id_tarea: number;
    titulo: string;
    descripcion?: string;
    estado?: string;
    prioridad?: string;
    fecha_vencimiento?: string;
    horas_estimadas?: number;
    responsable_nombre?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

export default function TareaDetailModal({ tarea, isOpen, onClose, onUpdateSuccess }: TareaDetailModalProps) {
  // 1. Extraer ID de manera segura (Regla de Hooks)
  const tareaId = isOpen && tarea ? tarea.id_tarea : null;

  // 2. Declaración de Hooks
  const { data: comentarios = [], mutate: mutateComentarios } = useSWR(
    tareaId ? `/comentarios/?tarea=${tareaId}` : null,
    () => (tareaId ? api.getComentarios(tareaId) : []),
    { revalidateOnFocus: false }
  );

  const { data: registrosHoras = [], mutate: mutateHoras } = useSWR(
    tareaId ? `/registro-horas/?tarea=${tareaId}` : null,
    () => (tareaId ? api.getRegistroHoras(tareaId) : []),
    { revalidateOnFocus: false }
  );

  const { data: archivos = [], mutate: mutateArchivos } = useSWR(
    tareaId ? `/archivos/?tarea=${tareaId}` : null,
    () => (tareaId ? api.getArchivos(tareaId) : []),
    { revalidateOnFocus: false }
  );

  const [comentarioTexto, setComentarioTexto] = useState('');
  
  // 💡 Mantenemos el tiempo a registrar internamente en MINUTOS TOTALES para evitar decimales
  const [minutosAHoras, setMinutosAHoras] = useState<number>(0);
  
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 3. Condicional de salida
  if (!isOpen || !tarea) return null;

  // 💡 HELPER VISUAL: Convierte minutos enteros a formato limpio (ej: 75 mins -> "1h 15m")
  const formatTiempoHumano = (totalMinutos: number) => {
    if (!totalMinutos || totalMinutos <= 0) return '0m';
    const hrs = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;

    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // 💡 HELPER PARA REGISTROS PROVENIENTES DE LA BASE DE DATOS (Decimal -> Formato Humano)
  const formatDecimalAHumano = (decimalVal: number) => {
    if (!decimalVal || decimalVal <= 0) return '0m';
    const minsTotales = Math.round(decimalVal * 60);
    return formatTiempoHumano(minsTotales);
  };

  // Sumar tiempo rápido en minutos
  const agregarMinutos = (mins: number) => {
    setMinutosAHoras((prev) => prev + mins);
  };

  // Total acumulado de horas (en la BD)
  const totalHorasInvertidasDecimal = Array.isArray(registrosHoras)
    ? registrosHoras.reduce((sum: number, r: any) => sum + Number(r.horas_trabajadas || 0), 0)
    : 0;

  const estimadasDecimal = Number(tarea.horas_estimadas || 0);
  const diferenciaHorasDecimal = estimadasDecimal - totalHorasInvertidasDecimal;
  const esEficiente = diferenciaHorasDecimal >= 0;

  // 💡 UNIFICACIÓN DE EVENTOS EN LA BITÁCORA (Sin mostrar números con comas/puntos)
  const bitacoraUnificada = (() => {
    const lista: any[] = [];

    // A) Comentarios
    if (Array.isArray(comentarios)) {
      comentarios.forEach((c: any) => {
        lista.push({
          id: `com-${c.id_comentario || c.id}`,
          autor: c.usuario_nombre || 'Desarrollador',
          texto: c.texto_comentario || c.comentario || c.contenido || c.texto,
          fecha: c.fecha_creacion ? new Date(c.fecha_creacion) : new Date(),
        });
      });
    }

    // B) Registros de horas cuando no tienen comentario de texto
    if (Array.isArray(registrosHoras)) {
      registrosHoras.forEach((r: any) => {
        const hrsNum = Number(r.horas_trabajadas || 0);
        const yaExisteEnComentarios = comentarios.some(
          (c: any) => (c.texto_comentario || c.comentario) === r.comentario && r.comentario
        );

        if (!yaExisteEnComentarios && hrsNum > 0) {
          lista.push({
            id: `hrs-${r.id_registro || r.id}`,
            autor: r.usuario_nombre || 'Desarrollador',
            texto: r.comentario || `⏱️ Se registró un tiempo de +${formatDecimalAHumano(hrsNum)} de trabajo.`,
            fecha: r.fecha_creacion ? new Date(r.fecha_creacion) : new Date(r.fecha),
          });
        }
      });
    }

    return lista.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  })();

  const handleRegistrarAvanceCompleto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentarioTexto.trim() && minutosAHoras <= 0 && !archivoEvidencia) {
      setError('Por favor ingresa un comentario de avance, tiempo o adjunta una evidencia.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convertimos los minutos a valor decimal que espera la BD (ej. 90 mins -> 1.5)
      const horasParaBackend = minutosAHoras > 0 ? minutosAHoras / 60 : 0;

      // A) Guardar Comentario
      if (comentarioTexto.trim()) {
        await api.createComentario({
          id_tarea: tarea.id_tarea,
          texto_comentario: comentarioTexto.trim(),
          comentario: comentarioTexto.trim(),
        });
      }

      // B) Guardar Horas
      if (horasParaBackend > 0) {
        await api.createRegistroHoras({
          id_tarea: tarea.id_tarea,
          horas_trabajadas: horasParaBackend,
          fecha: new Date().toISOString().split('T')[0],
          comentario: comentarioTexto.trim() || `Tiempo registrado (+${formatTiempoHumano(minutosAHoras)})`,
        });
      }

      // C) Subir Archivo
      if (archivoEvidencia) {
        await api.uploadArchivo(tarea.id_tarea, archivoEvidencia);
      }

      setComentarioTexto('');
      setMinutosAHoras(0);
      setArchivoEvidencia(null);

      mutateComentarios();
      mutateHoras();
      mutateArchivos();

      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err: any) {
      console.error('Error al guardar el avance:', err);
      setError('Error al registrar el avance y la evidencia.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArchivo = async (idArchivo: number) => {
    if (!confirm('¿Deseas eliminar esta evidencia adjunta?')) return;
    try {
      await api.deleteArchivo(idArchivo);
      mutateArchivos();
    } catch (err) {
      console.error('Error al eliminar archivo:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Encabezado */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                TSK-{tarea.id_tarea}
              </span>
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {tarea.estado || 'POR_HACER'}
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">{tarea.titulo}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg p-1">
            ✕
          </button>
        </div>

        {/* Cuerpo Modal */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: Formulario & Bitácora */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</h4>
              <p className="text-sm text-slate-200 whitespace-pre-line">
                {tarea.descripcion || 'Sin descripción detallada.'}
              </p>
            </div>

            {/* FORMULARIO DE REGISTRO */}
            <form onSubmit={handleRegistrarAvanceCompleto} className="bg-slate-950 p-5 rounded-xl border border-blue-500/30 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span> Publicar Nuevo Avance con Evidencia
              </h3>

              {error && <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resumen / Comentario del Trabajo</label>
                <textarea
                  rows={2}
                  value={comentarioTexto}
                  onChange={(e) => setComentarioTexto(e.target.value)}
                  placeholder="Escribe aquí el detalle del avance realizado..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* SECTOR DE TIEMPO CON FORMATO AMIGABLE (SIN DECIMALES VISIBLES) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-300">⏱️ Tiempo a Cargar</label>
                    <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {formatTiempoHumano(minutosAHoras)}
                    </span>
                  </div>

                  {/* Botones rápidos de selección en formato tiempo real */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => agregarMinutos(15)}
                      className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => agregarMinutos(30)}
                      className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
                    >
                      +30m
                    </button>
                    <button
                      type="button"
                      onClick={() => agregarMinutos(60)}
                      className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
                    >
                      +1h
                    </button>
                    <button
                      type="button"
                      onClick={() => agregarMinutos(120)}
                      className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
                    >
                      +2h
                    </button>
                  </div>

                  {minutosAHoras > 0 && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setMinutosAHoras(0)}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Reiniciar tiempo
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">📎 Adjuntar Evidencia (Captura/PDF)</label>
                  <input
                    type="file"
                    onChange={(e) => setArchivoEvidencia(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? 'Publicando...' : 'Publicar Avance & Evidencia'}
                </button>
              </div>
            </form>

            {/* BITÁCORA UNIFICADA DE COMUNICACIÓN Y LOGS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bitácora de Comentarios & Historial</h3>
              
              <div className="space-y-3">
                {bitacoraUnificada.length > 0 ? (
                  bitacoraUnificada.map((item: any) => (
                    <div key={item.id} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-bold text-slate-200">👤 {item.autor}</span>
                        <span className="text-[10px]">
                          {item.fecha.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium whitespace-pre-line">
                        {item.texto}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-xs py-4 italic">No hay comentarios ni registros cargados para esta tarea.</p>
                )}
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Control de Tiempo & Evidencias */}
          <div className="space-y-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Control de Tiempo</h4>
              
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Invertidas:</span>
                <span className="text-blue-400 font-bold font-mono">
                  {formatDecimalAHumano(totalHorasInvertidasDecimal)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Estimadas:</span>
                <span className="text-slate-200 font-bold font-mono">
                  {estimadasDecimal > 0 ? formatDecimalAHumano(estimadasDecimal) : 'Sin estimar'}
                </span>
              </div>

              {estimadasDecimal > 0 && (totalHorasInvertidasDecimal > 0 || tarea.estado === 'FINALIZADO') && (
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500 block mb-1">Eficiencia del Desarrollo:</span>
                  <span
                    className={`font-mono font-bold text-[10px] px-2 py-1 rounded block text-center ${
                      esEficiente
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {esEficiente
                      ? `+${formatDecimalAHumano(diferenciaHorasDecimal)} ahorradas (Óptimo)`
                      : `${formatDecimalAHumano(Math.abs(diferenciaHorasDecimal))} excedidas (Revisar)`}
                  </span>
                </div>
              )}
            </div>

            {/* Evidencias Adjuntas */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>📁 Evidencias Adjuntas</span>
                <span className="text-[10px] text-blue-400 font-mono font-normal">({archivos.length})</span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {Array.isArray(archivos) && archivos.length > 0 ? (
                  archivos.map((arc: any) => {
                    const esImagen = arc.archivo?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || arc.nombre_archivo?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const urlDescarga = arc.archivo || arc.url_archivo;

                    return (
                      <div key={arc.id_archivo || arc.id} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-base">{esImagen ? '🖼️' : '📄'}</span>
                          <div className="truncate">
                            <a
                              href={urlDescarga}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-200 hover:text-blue-400 truncate block transition-colors"
                              title={arc.nombre_archivo || 'Ver evidencia'}
                            >
                              {arc.nombre_archivo || `Evidencia #${arc.id_archivo}`}
                            </a>
                            <span className="text-[9px] text-slate-500 block">
                              {arc.fecha_subida ? new Date(arc.fecha_subida).toLocaleDateString() : 'Adjunto'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteArchivo(arc.id_archivo || arc.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 text-xs font-bold transition-colors"
                          title="Eliminar archivo"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-xs text-center py-4 italic">No hay evidencias cargadas para esta tarea.</p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}