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
  const tareaId = isOpen && tarea ? tarea.id_tarea : null;

  const [userRole, setUserRole] = useState<string>('');
  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'Miembro_Equipo');
  }, []);
  const isManagerOrAdmin = userRole === 'Administrador' || userRole === 'Gerente_Proyecto';

  // Cargar lista general de Usuarios
  const { data: rawUsuarios = [] } = useSWR(tareaId ? '/usuarios' : null, () => api.getUsuarios(), { revalidateOnFocus: false });
  const usuarios = Array.isArray(rawUsuarios) ? rawUsuarios : [];

  // Cargar asignaciones filtradas por tarea
  const { data: rawAsignaciones = [], mutate: mutateAsignaciones } = useSWR(
    tareaId ? `/asignaciones/?tarea=${tareaId}` : null,
    () => (tareaId ? api.getAsignaciones(tareaId) : []),
    { revalidateOnFocus: false }
  );

  // Helper de resolución de nombres en cliente
  const resolverNombreEnCliente = (idUsuarioRaw: any, nombreApi?: string) => {
    if (nombreApi && !['Desarrollador', 'Sin asignar', 'Sin Asignar', 'Usuario', 'Miembro del Equipo'].includes(nombreApi)) {
      return nombreApi;
    }

    if (!idUsuarioRaw) return 'Sin asignar';

    const uuidStr = typeof idUsuarioRaw === 'object' 
      ? String(idUsuarioRaw.id_usuario || idUsuarioRaw.usuario_id || idUsuarioRaw.id || '') 
      : String(idUsuarioRaw);

    const usrEncontrado = usuarios.find((u: any) => String(u.id_usuario) === uuidStr || String(u.id) === uuidStr);

    if (usrEncontrado) {
      return usrEncontrado.nombre || usrEncontrado.email || 'Usuario Registrado';
    }

    return 'Sin asignar';
  };

  // Peticiones SWR a los endpoints exactos de tu Swagger
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

  // Filtrado estricto en cliente
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

  const [nuevoEstado, setNuevoEstado] = useState<string>('');
  const [nuevoResponsableId, setNuevoResponsableId] = useState<string>('');

  // Encontrar la asignación activa para esta tarea específica
  const asignacionActiva = Array.isArray(rawAsignaciones) && rawAsignaciones.length > 0
    ? rawAsignaciones.find((a: any) => {
        const tareaIdInAsignacion = a.tarea_id || a.tarea || a.id_tarea;
        return Number(tareaIdInAsignacion) === Number(tareaId);
      })
    : null;

  const idResponsableReal = asignacionActiva 
    ? (asignacionActiva.usuario_id || asignacionActiva.usuario || asignacionActiva.id_usuario) 
    : tarea?.usuario_asignado;

  useEffect(() => {
    if (tarea) {
      setNuevoEstado(tarea.estado || 'POR_HACER');
      setNuevoResponsableId(idResponsableReal ? String(idResponsableReal) : '');
    }
  }, [tarea, idResponsableReal]);

  if (!isOpen || !tarea) return null;

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

  const responsableActualNombre = resolverNombreEnCliente(idResponsableReal, tarea.responsable_nombre);

  // Obtener tarifa del responsable actual
  const responsableActual = usuarios.find(
    (u: any) => String(u.id_usuario) === String(idResponsableReal)
  );
  const tarifaResponsable = responsableActual ? Number(responsableActual.tarifa_hora || 0) : 0;
  const costoInvertido = totalHorasInvertidasDecimal * tarifaResponsable;
  const costoEstimado = estimadasDecimal * tarifaResponsable;

  const bitacoraUnificada = (() => {
    const lista: any[] = [];

    comentarios.forEach((c: any) => {
      lista.push({
        id: `com-${c.id_comentario || c.id}`,
        autor: resolverNombreEnCliente(c.id_usuario, c.usuario_nombre),
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
          autor: resolverNombreEnCliente(r.id_usuario, r.usuario_nombre),
          texto: r.comentario || `Se registró un tiempo de +${formatDecimalAHumano(hrsNum)} de trabajo.`,
          fecha: r.fecha_creacion ? new Date(r.fecha_creacion) : new Date(r.fecha),
        });
      }
    });

    return lista.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  })();

  const handleRegistrarAvanceCompleto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación inicial
    if (!comentarioTexto.trim() && minutosAHoras <= 0 && !archivoEvidencia) {
      setError('Por favor ingresa un comentario de avance, tiempo o adjunta una evidencia.');
      return;
    }

    // Validar que tarea tenga ID válido
    if (!tarea?.id_tarea || Number(tarea.id_tarea) <= 0) {
      setError('Error: Tarea inválida. Recarga la página.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const horasParaBackend = minutosAHoras > 0 ? minutosAHoras / 60 : 0;
      const comentarioLimpio = comentarioTexto.trim();
      const erroresRegistro = [];

      // 1. Registrar comentario si existe
      if (comentarioLimpio) {
        try {
          await api.createComentario({
            id_tarea: tarea.id_tarea,
            texto_comentario: comentarioLimpio,
            comentario: comentarioLimpio,
          });
        } catch (err: any) {
          console.error('[v0] Error al crear comentario:', err);
          erroresRegistro.push('comentario');
        }
      }

      // 2. Registrar horas si existen
      if (horasParaBackend > 0) {
        try {
          await api.createRegistroHoras({
            id_tarea: tarea.id_tarea,
            horas_trabajadas: horasParaBackend,
            fecha: new Date().toISOString().split('T')[0],
            comentario: comentarioLimpio || `Tiempo registrado (+${formatTiempoHumano(minutosAHoras)})`,
          });
        } catch (err: any) {
          console.error('[v0] Error al registrar horas:', err);
          erroresRegistro.push('horas');
        }
      }

      // 3. Subir archivo si existe
      if (archivoEvidencia) {
        try {
          await api.uploadArchivo(tarea.id_tarea, archivoEvidencia);
        } catch (err: any) {
          console.error('[v0] Error al subir archivo:', err);
          erroresRegistro.push('archivo');
        }
      }

      // Si hubo errores, mostrarlos
      if (erroresRegistro.length > 0) {
        const erroresTexto = erroresRegistro.join(', ');
        setError(`Error al registrar: ${erroresTexto}. Revisa que todos los datos sean válidos.`);
        setLoading(false);
        return;
      }

      // Limpiar formulario
      setComentarioTexto('');
      setMinutosAHoras(0);
      setArchivoEvidencia(null);

      // Revalidar datos
      await Promise.all([
        mutateComentarios(),
        mutateHoras(),
        mutateArchivos(),
      ]);

      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err: any) {
      console.error('[v0] Error general al guardar el avance:', err);
      setError('Error inesperado al registrar el avance y la evidencia. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarGestionGerencial = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Actualizar estado de la tarea
      const payload: any = { 
        estado: nuevoEstado,
      };
      await api.updateTarea(tarea.id_tarea, payload);

      // 2. Manejar asignación del responsable
      if (nuevoResponsableId) {
        if (asignacionActiva) {
          // Actualizar asignación existente
          const asignacionId = asignacionActiva.id || asignacionActiva.id_asignacion;
          await api.updateAsignacion(asignacionId, {
            usuario_id: nuevoResponsableId,
            horas_planificadas: asignacionActiva.horas_planificadas || 0,
          });
        } else {
          // Crear nueva asignación
          await api.createAsignacion({
            tarea_id: tarea.id_tarea,
            usuario_id: nuevoResponsableId,
            horas_planificadas: 0,
          });
        }
      } else if (asignacionActiva) {
        // Eliminar asignación si se deasigna
        const asignacionId = asignacionActiva.id || asignacionActiva.id_asignacion;
        await api.deleteAsignacion(asignacionId);
      }

      // Esperar a que se revaliden los datos antes de cerrar
      await Promise.all([
        mutateAsignaciones(),
        mutateComentarios(),
      ]);
      
      if (onUpdateSuccess) onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('[v0] Error al actualizar gestión de tarea:', err);
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
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Publicar Nuevo Avance con Evidencia
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
                    <label className="block text-xs font-semibold text-slate-300">Tiempo a Cargar</label>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Adjuntar Evidencia (Captura/PDF)</label>
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
                        <span className="font-bold text-slate-200">{item.autor}</span>
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

          {/* COLUMNA DERECHA */}
          <div className="space-y-6">
            
            {/* BLOQUE DE GESTIÓN GERENCIAL */}
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
                      <option key={u.id_usuario || u.id} value={String(u.id_usuario || u.id)}>
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
                <span className="text-slate-200 font-bold">{responsableActualNombre}</span>
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Invertidas:</span>
                <span className="text-blue-400 font-bold font-mono">{formatDecimalAHumano(totalHorasInvertidasDecimal)}</span>
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Estimadas:</span>
                <span className="text-slate-200 font-bold font-mono">{estimadasDecimal > 0 ? formatDecimalAHumano(estimadasDecimal) : 'Sin estimar'}</span>
              </div>

              {tarifaResponsable > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 block">Inversión en Costo (Horas × Tarifa):</span>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Costo Invertido:</span>
                    <span className="text-amber-400 font-mono">${costoInvertido.toFixed(2)}</span>
                  </div>
                  {estimadasDecimal > 0 && (
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Costo Estimado:</span>
                      <span className="text-slate-300 font-mono">${costoEstimado.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

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
                <span>Evidencias Adjuntas</span>
                <span className="text-[10px] text-blue-400 font-mono font-normal">({archivos.length})</span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {archivos.length > 0 ? (
                  archivos.map((arc: any) => {
                    const urlDescarga = arc.archivo || arc.url_archivo;

                    return (
                      <div key={arc.id_archivo || arc.id} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
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
