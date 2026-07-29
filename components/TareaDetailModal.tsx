'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Modal } from './Modal';
import { Button } from './Button';
import api from '../services/api';
import { Tarea } from './KanbanBoard';

interface TareaDetailModalProps {
  tarea: Tarea | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess?: () => void | Promise<void>;
}

export default function TareaDetailModal({
  tarea,
  isOpen,
  onClose,
  onUpdateSuccess,
}: TareaDetailModalProps) {
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loadingComentario, setLoadingComentario] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Cargar lista de usuarios para el selector de responsable
  const { data: usuarios = [] } = useSWR('/usuarios', () => api.getUsuarios(), {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (tarea && isOpen) {
      loadComentarios();
    }
  }, [tarea, isOpen]);

  const loadComentarios = async () => {
    if (!tarea) return;
    try {
      const data = await api.getComentarios(tarea.id_tarea);
      setComentarios(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando comentarios:', e);
    }
  };

  const handleSendComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !tarea) return;

    setLoadingComentario(true);
    try {
      const userId = localStorage.getItem('userId');
      await api.createComentario({
        id_tarea: tarea.id_tarea,
        id_usuario: userId,
        texto_comentario: nuevoComentario,
      });
      setNuevoComentario('');
      await loadComentarios();
    } catch (err) {
      console.error('Error enviando comentario:', err);
    } finally {
      setLoadingComentario(false);
    }
  };

  const handleCambiarResponsable = async (idUsuario: string) => {
    if (!tarea) return;
    setSavingUser(true);
    try {
      await api.updateTarea(tarea.id_tarea, {
        usuario_asignado: idUsuario,
      });
      if (onUpdateSuccess) {
        await onUpdateSuccess();
      }
    } catch (e) {
      console.error('Error al reasignar responsable:', e);
    } finally {
      setSavingUser(false);
    }
  };

  if (!tarea) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tarea.codigo || `TSK-${tarea.id_tarea}`} size="lg">
      <div className="space-y-6 text-slate-200">
        {/* Título y Badges */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              {tarea.estado}
            </span>
            {tarea.proyecto_nombre && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                📁 {tarea.proyecto_nombre}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{tarea.titulo}</h2>
        </div>

        {/* Descripción */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {tarea.descripcion || 'Sin descripción detallada.'}
          </p>
        </div>

        {/* Metadata y Asignación de Responsable */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <label className="block text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-[11px]">
              Responsable:
            </label>
            <select
              defaultValue=""
              onChange={(e) => handleCambiarResponsable(e.target.value)}
              disabled={savingUser}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>
                {tarea.responsable_nombre ? `👤 ${tarea.responsable_nombre}` : '👤 Sin Asignar'}
              </option>
              {Array.isArray(usuarios) &&
                usuarios.map((u: any) => (
                  <option key={u.id_usuario} value={String(u.id_usuario)}>
                    👤 {u.nombre || u.email}
                  </option>
                ))}
            </select>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1 uppercase tracking-wider text-[11px]">
              Fecha de Vencimiento:
            </span>
            <strong className="text-slate-200 text-sm font-semibold">
              {tarea.fecha_vencimiento || 'No definida'}
            </strong>
          </div>
        </div>

        {/* Sección de Comentarios */}
        <div className="border-t border-slate-800 pt-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            💬 Comentarios y Respuestas
          </h3>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {comentarios.length > 0 ? (
              comentarios.map((c: any) => (
                <div key={c.id_comentario} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-400">{c.usuario_nombre || 'Usuario'}</span>
                    <span className="text-[10px] text-slate-500">
                      {c.fecha_creacion ? new Date(c.fecha_creacion).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.texto_comentario}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No hay comentarios aún en esta tarea.</p>
            )}
          </div>

          <form onSubmit={handleSendComentario} className="flex gap-2">
            <input
              type="text"
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" size="sm" loading={loadingComentario}>
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
