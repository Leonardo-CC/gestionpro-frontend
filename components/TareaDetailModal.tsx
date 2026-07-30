'use client';

import React, { useState, useEffect } from 'react';
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
    usuario_asignado?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

export default function TareaDetailModal({ tarea, isOpen, onClose, onUpdateSuccess }: TareaDetailModalProps) {
  // 1. Extraer ID de manera segura (Regla de Hooks)
  const tareaId = isOpen && tarea ? tarea.id_tarea : null;

  // 🔒 Identificación de Rol y Permisos
  const [userRole, setUserRole] = useState<string>('');
  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'Miembro_Equipo');
  }, []);
  const isManagerOrAdmin = userRole === 'Administrador' || userRole === 'Gerente_Proyecto';

  // Cargar lista de Usuarios para el selector de asignación del Gerente
  const { data: rawUsuarios = [] } = useSWR(isManagerOrAdmin ? '/usuarios' : null, () => api.getUsuarios());
  const usuarios = Array.isArray(rawUsuarios) ? rawUsuarios : [];

  // 2. Declaración de Hooks SWR
  const { data: rawComentarios = [], mutate: mutateComentarios } = useSWR(
    tareaId ? `/comentarios/?tarea=${tareaId}` : null,
    () => (tareaId ? api.getComentarios(tareaId) : []),
    { revalidateOnFocus: false }
  );

  const { data: rawRegistrosHoras = [], mutate: mutateHoras } = useSWR(
    tareaId ? `/registro-horas/?tarea=${tareaId}` : null,
    () => (tareaId ? api.getRegistroHoras(tareaId) : []),
    { revalidateOnFocus: false }
  );

  const { data: rawArchivos = [], mutate: mutateArchivos } = useSWR(
    tareaId ? `/archivos/?tarea=${tareaId}` : null,
    () => (tareaId ? api.getArchivos(tareaId) : []),
    { revalidateOnFocus: false }
  );

  // 🔒 FILTRADO ESTRICTO DE CLIENTE PARA EVITAR MEZCLA DE DATOS DE OTRAS TAREAS
  const comentarios = Array.isArray(rawComentarios)
    ? rawComentarios.filter((c: any) => {
        const itemTareaId = typeof c.id_tarea === 'object' ? c.id_tarea?.id_tarea : c.id_tarea;
        return Number(itemTareaId) === Number(tareaId);
      })
    : [];

  const registrosHoras = Array.isArray(rawRegistrosHoras)
    ? rawRegistrosHoras.filter((r: any) => {
        const itemTareaId = typeof r.id_tarea === 'object' ? r.id_tarea?.id_tarea : r.id_tarea;
        return Number(itemTareaId) === Number(tareaId);
      })
    : [];

  const archivos = Array.isArray(rawArchivos)
    ? rawArchivos.filter((a: any) => {
        const itemTareaId = typeof a.id_tarea === 'object' ? a.id_tarea?.id_tarea : a.id_tarea;
        return Number(itemTareaId) === Number(tareaId);
      })
    : [];

  const [comentarioTexto, setComentarioTexto] = useState('');
  const [minutosAHoras, setMinutosAHoras] = useState<number>(0);
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para Edición Gerencial (Estado y Responsable)
  const [nuevoEstado, setNuevoEstado] = useState<string>('');
  const [nuevoResponsableId, setNuevoResponsableId] = useState<string>('');

  useEffect(() => {
    if (tarea) {
      setNuevoEstado(tarea.estado || 'POR_HACER');
      setNuevoResponsableId(tarea.usuario_asignado || '');
    }
  }, [tarea]);

  if (!isOpen || !tarea) return null;

  // 💡 HELPER VISUAL: Convierte minutos enteros a formato limpio
  const formatTiempoHumano = (totalMinutos: number) => {
    if (!totalMinutos || totalMinutos <= 0) return '0m';
    const hrs = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;

    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const formatDecimalAHumano = (decimalVal: number) => {
    if (!decimalVal || decimalVal <= 0) return '0m';
    const minsTotales = Math.round(decimalVal * 60);
    return formatTiempoHumano(minsTotales);
  };

  const agregarMinutos = (mins: number) => {
    setMinutosAHoras((prev) => prev + mins);
  };

  const totalHorasInvertidasDecimal = registrosHoras.reduce((sum: number, r: any) => sum + Number(r.horas_trabajadas || 0), 0);
  const estimadasDecimal = Number(tarea.horas_estimadas || 0);
  const diferenciaHorasDecimal = estimadasDecimal - totalHorasInvertidasDecimal;
  const esEficiente = diferenciaHorasDecimal >= 0;

  // 💡 UNIFICACIÓN DE EVENTOS EN LA BITÁCORA
  const bitacoraUnificada = (() => {
    const lista: any[] = [];

    comentarios.forEach((c: any) => {
      lista.push({
        id: `com-${c.id_comentario || c.id}`,
        autor: c.usuario_nombre || 'Desarrollador',
        texto: c.texto_comentario || c.comentario || c.contenido || c.texto,
        fecha: c.fecha_creacion ? new Date(c.fecha_creacion) : new Date(),
      });
    });

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
      const horasParaBackend = minutosAHoras > 0 ? minutosAHoras / 60 : 0;

      if (comentarioTexto.trim()) {
        await api.createComentario({
          id_tarea: tarea.id_tarea,
          texto_comentario: comentarioTexto.trim(),
          comentario: comentarioTexto.trim(),
        });
      }

      if (horasParaBackend > 0) {
        await api.createRegistroHoras({
          id_tarea: tarea.id_tarea,
          horas_trabajadas: horasParaBackend,
          fecha: new Date().toISOString().split('T')[0],
          comentario: comentarioTexto.trim() || `Tiempo registrado (+${formatTiempoHumano(minutosAHoras)})`,
        });
      }

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

  // 👑 GUARDAR CAMBIOS DE GESTIÓN GERENCIAL (Estado y Reasignación)
  const handleGuardarGestionGerencial = async () => {
    try {
      setLoading(true);
      const payload: any = { estado: nuevoEstado };
      if (nuevoResponsableId) {
        payload.usuario_asignado = nuevoResponsableId;
      }
      await api.updateTarea(tarea.id_tarea, payload);
      if (onUpdateSuccess) onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('Error al actualizar gestión de tarea:', err);
      setError('Error al actualizar el responsable o el estado.');
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

              {/* SECTOR DE TIEMPO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-300">⏱️ Tiempo a Cargar</label>
                    <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {formatTiempoHumano(minutosAHoras)}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button type="button" onClick={() => agregarMinutos(15)} className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors">+15m</button>
                    <button type="button" onClick={() => agregarMinutos(30)} className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors">+30m</button>
                    <button type="button" onClick={() => agregarMinutos(60)} className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors">+1h</button>
                    <button type="button" onClick={() => agregarMinutos(120)} className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors">+2h</button>
                  </div>

                  {minutosAHoras > 0 && (
                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={() => setMinutosAHoras(0)} className="text-[10px] text-rose-400 hover:underline">Reiniciar tiempo</button>
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

            {/* BITÁCORA UNIFICADA */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bitácora de Comentarios & Historial</h3>
              
              <div className="space-y-3">
                {bitacoraUnificada.length > 0 ? (
                  bitacoraUnificada.map((item: any) => (
                    <div key={item.id} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-bold text-slate-200">👤 {item.autor}</span>
                        <span className="text-[10px]">{item.fecha.toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300 font-medium whitespace-pre-line">{item.texto}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-xs py-4 italic">No hay comentarios ni registros cargados para esta tarea.</p>
                )}
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Control de Tiempo, Evidencias & Gestión Gerencial */}
          <div className="space-y-6">
            
            {/* 👑 BLOQUE DE GESTIÓN GERENCIAL (CAMBIO DE RESPONSABLE Y ESTADO) */}
            {isManagerOrAdmin && (
              <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/40 space-y-3">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Gestión de Tarea (Gerencia)</h4>
                
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Responsable Asignado</label>
                  <select
                    value={nuevoResponsableId}
                    onChange={(e) => setNuevoResponsableId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                  >
                    <option value="">Sin Asignar</option>
                    {usuarios.map((u: any) => (
                      <option key={u.id_usuario} value={String(u.id_usuario)}>
                        {u.nombre || u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Estado de la Tarea</label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                  >
                    <option value="IDEA">Propuestas e Ideas</option>
                    <option value="POR_HACER">Por Ejecutar</option>
                    <option value="EN_CURSO">En Proceso</option>
                    <option value="PRUEBAS">Revisión / Control</option>
                    <option value="FINALIZADO">Concluido</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleGuardarGestionGerencial}
                  disabled={loading}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors shadow-md disabled:opacity-50"
                >
                  Guardar Gestión
                </button>
              </div>
            )}

            {/* CONTROL DE TIEMPO */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Control de Tiempo</h4>
              
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 font-medium">Responsable Actual:</span>
                <span className="text-slate-200 font-bold">{tarea.responsable_nombre || 'Sin asignar'}</span>
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Invertidas:</span>
                <span className="text-blue-400 font-bold font-mono">{formatDecimalAHumano(totalHorasInvertidasDecimal)}</span>
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Estimadas:</span>
                <span className="text-slate-200 font-bold font-mono">{estimadasDecimal > 0 ? formatDecimalAHumano(estimadasDecimal) : 'Sin estimar'}</span>
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

            {/* EVIDENCIAS ADJUNTAS */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>📁 Evidencias Adjuntas</span>
                <span className="text-[10px] text-blue-400 font-mono font-normal">({archivos.length})</span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {archivos.length > 0 ? (
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