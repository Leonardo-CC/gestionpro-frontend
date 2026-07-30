'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { Badge } from '../../../../components/Badge';
import { Modal } from '../../../../components/Modal';
import { Alert } from '../../../../components/Alert';

interface Tarea {
  id_tarea: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fecha_vencimiento: string;
  horas_estimadas: number;
  responsable_nombre?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);

  // 🔒 Estado y control de Roles
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'Miembro_Equipo';
    setUserRole(role);
  }, []);

  const isManagerOrAdmin = userRole === 'Administrador' || userRole === 'Gerente_Proyecto';

  // 1. Cargar datos del proyecto
  const { data: proyecto, mutate: mutateProyecto } = useSWR(
    projectId ? `/proyectos/${projectId}` : null,
    () => api.getProyecto(projectId),
    { revalidateOnFocus: false }
  );

  // 2. Cargar tareas (Asegurando fallback a Array vacío)
  const { data: tareasData } = useSWR(
    projectId ? `/tareas/?proyecto=${projectId}` : null,
    () => api.getTareas(projectId),
    { revalidateOnFocus: false }
  );
  const tareas: Tarea[] = Array.isArray(tareasData) ? tareasData : [];

  // 3. Cargar usuarios
  const { data: usuariosData } = useSWR('/usuarios', () => api.getUsuarios(), {
    revalidateOnFocus: false,
  });
  const usuarios = Array.isArray(usuariosData) ? usuariosData : [];

  // 4. Cargar Historial de Presupuesto (🔒 Solo se solicita si es Admin o Gerente)
  const { data: historialData, mutate: mutateHistorial } = useSWR(
    projectId && isManagerOrAdmin ? `/historial-presupuesto/?proyecto=${projectId}` : null,
    () => api.getHistorialPresupuesto(projectId),
    { revalidateOnFocus: false }
  );
  const historial = Array.isArray(historialData) ? historialData : [];

  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    nombre: '',
    descripcion: '',
    presupuesto_total: '',
    estado: 'Activo',
  });

  const handleOpenEditModal = () => {
    if (!isManagerOrAdmin) return;
    if (proyecto) {
      setEditForm({
        nombre: proyecto.nombre || '',
        descripcion: proyecto.descripcion || '',
        presupuesto_total: String(proyecto.presupuesto_total || ''),
        estado: proyecto.estado || 'Activo',
      });
      setIsEditProjectOpen(true);
    }
  };

  const handleUpdateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManagerOrAdmin) return;

    const monto = parseFloat(editForm.presupuesto_total);
    if (isNaN(monto) || monto <= 0) {
      setError('El presupuesto debe ser un monto mayor a 0 Bs.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.updateProyecto(projectId, {
        nombre: editForm.nombre.trim(),
        descripcion: editForm.descripcion.trim() || null,
        presupuesto_total: monto,
        estado: editForm.estado,
      });

      setSuccess('Proyecto y presupuesto actualizados correctamente');
      setIsEditProjectOpen(false);
      mutateProyecto();
      mutateHistorial();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al actualizar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Métricas
  const totalTareas = tareas.length;
  const completadas = tareas.filter(
    (t: Tarea) => t.estado === 'FINALIZADO' || t.estado === 'COMPLETADA'
  ).length;
  const porcentajeProgreso = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

  if (!proyecto) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-medium">
        Cargando detalles del proyecto...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-200">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">
            <span>PROYECTO / ID #{proyecto.id_proyecto}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{proyecto.nombre}</h1>
          <p className="text-slate-400 mt-1 text-xs max-w-2xl">{proyecto.descripcion || 'Sin descripción asignada.'}</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <Badge variant={proyecto.estado === 'Activo' ? 'success' : proyecto.estado === 'Pausado' ? 'warning' : 'danger'}>
            {proyecto.estado}
          </Badge>

          {/* 🔒 BOTÓN EDITAR SOLO VISIBLE PARA ADMIN O GERENTE */}
          {isManagerOrAdmin && (
            <button
              onClick={handleOpenEditModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition-all"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {error && <Alert type="error" title="Error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" title="Éxito" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Métricas e Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* 🔒 ADAPTACIÓN SEGÚN EL ROL DEL USUARIO */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            {isManagerOrAdmin ? 'Presupuesto Actual' : 'Total de Tareas'}
          </span>
          <p className="text-2xl font-black text-blue-400 mt-1">
            {isManagerOrAdmin
              ? `Bs. ${Number(proyecto.presupuesto_total || 0).toFixed(2)}`
              : `${totalTareas} asignadas`}
          </p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Progreso Global</span>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajeProgreso}%` }}
              />
            </div>
            <span className="text-xs font-bold text-white">{porcentajeProgreso}%</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Fecha Inicio</span>
          <p className="text-sm font-bold text-slate-200 mt-1">
            {proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString() : 'Sin definir'}
          </p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Fecha Límite</span>
          <p className="text-sm font-bold text-slate-200 mt-1">
            {proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toLocaleDateString() : 'Sin definir'}
          </p>
        </div>
      </div>

      {/* Tareas Activas y Miembros del Equipo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista Resumida de Tareas */}
        <div className="lg:col-span-2 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-tight">Tareas Activas del Proyecto ({tareas.length})</h3>
            <button
              onClick={() => router.push(`/dashboard/tareas?proyecto=${projectId}`)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              Ir al Tablero Kanban →
            </button>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {tareas.length > 0 ? (
              tareas.map((t: Tarea) => (
                <div
                  key={t.id_tarea}
                  onClick={() => router.push(`/dashboard/tareas?proyecto=${projectId}`)}
                  className="p-3.5 bg-slate-950/80 hover:bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      TSK-{t.id_tarea}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {t.titulo}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {t.responsable_nombre ? `👤 ${t.responsable_nombre}` : '👤 Sin asignar'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {t.estado}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500 italic">
                No hay tareas creadas aún para este proyecto.
              </div>
            )}
          </div>
        </div>

        {/* Equipo Asignado */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3">
            Equipo del Proyecto
          </h3>
          <div className="space-y-3">
            {usuarios.length > 0 ? (
              usuarios.slice(0, 5).map((u: any) => (
                <div key={u.id_usuario} className="flex items-center gap-3 p-2 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold text-xs flex items-center justify-center shrink-0">
                    {(u.nombre || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{u.nombre || u.email}</p>
                    <span className="text-[10px] text-slate-500 capitalize">{u.rol ? u.rol.replace('_', ' ') : 'Colaborador'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No hay miembros registrados.</p>
            )}
          </div>
        </div>
      </div>

      {/* 🔒 HISTORIAL DE CAMBIOS FINANCIEROS (OCULTO PARA MIEMBROS DE EQUIPO) */}
      {isManagerOrAdmin && (
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Historial de Modificaciones Financieras</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {historial.length > 0 ? (
              historial.map((h: any) => {
                const incremento = Number(h.monto_nuevo) > Number(h.monto_anterior);
                const diferencia = Math.abs(Number(h.monto_nuevo) - Number(h.monto_anterior));

                return (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-200">
                        Ajuste de Presupuesto: <span className="text-slate-400 font-mono">Bs. {Number(h.monto_anterior).toFixed(2)}</span> → <span className="text-blue-400 font-mono font-black">Bs. {Number(h.monto_nuevo).toFixed(2)}</span>
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Modificado por: <strong className="text-slate-400">{h.usuario_nombre || 'Gerente'}</strong> el {new Date(h.fecha).toLocaleDateString()} a las {new Date(h.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`font-mono font-bold px-2.5 py-1 rounded-lg text-[10px] ${
                        incremento
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {incremento ? '+' : '-'} Bs. {diferencia.toFixed(2)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 italic">
                No se han registrado modificaciones en el presupuesto de este proyecto.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔒 MODAL EDITAR PROYECTO & PRESUPUESTO (SOLO RENDERIZABLE PARA GERENTE / ADMIN) */}
      {isManagerOrAdmin && (
        <Modal
          isOpen={isEditProjectOpen}
          onClose={() => setIsEditProjectOpen(false)}
          title="Editar Proyecto & Presupuesto"
          size="md"
        >
          <form onSubmit={handleUpdateProjectSubmit} className="space-y-4 text-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Proyecto</label>
              <input
                type="text"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Presupuesto Total (Bs.)</label>
              <input
                type="text"
                inputMode="decimal"
                value={editForm.presupuesto_total}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  if ((val.match(/\./g) || []).length <= 1) {
                    setEditForm({ ...editForm, presupuesto_total: val });
                  }
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Estado</label>
              <select
                value={editForm.estado}
                onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [color-scheme:dark]"
              >
                <option value="Activo" className="bg-slate-900 text-slate-100">Activo</option>
                <option value="Pausado" className="bg-slate-900 text-slate-100">Pausado</option>
                <option value="Completado" className="bg-slate-900 text-slate-100">Completado</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditProjectOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}