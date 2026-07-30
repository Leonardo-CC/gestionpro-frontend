'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Alert } from '../../../components/Alert';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  descripcion: string;
  presupuesto_total: number;
  costo_invertido?: number;
  presupuesto_restante?: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export default function ProyectosPage() {
  const { data: proyectos = [], mutate: mutateProyectos } = useSWR('/proyectos', () => api.getProyectos(), {
    revalidateOnFocus: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [projectForm, setProjectForm] = useState({
    nombre: '',
    descripcion: '',
    presupuesto_total: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'Activo',
  });

  const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProjectForm({ ...projectForm, [e.target.name]: e.target.value });
  };

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { nombre, presupuesto_total, fecha_inicio, fecha_fin } = projectForm;

    if (!nombre.trim()) {
      setError('El nombre del proyecto es obligatorio.');
      return;
    }

    const monto = parseFloat(presupuesto_total);
    if (isNaN(monto) || monto <= 0) {
      setError('El presupuesto debe ser un monto positivo mayor a 0 Bs.');
      return;
    }

    if (!fecha_inicio) {
      setError('La fecha de inicio es obligatoria.');
      return;
    }

    if (fecha_fin) {
      const inicio = new Date(fecha_inicio);
      const fin = new Date(fecha_fin);

      if (fin < inicio) {
        setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
      }
    }

    setLoading(true);

    try {
      await api.createProyecto({
        ...projectForm,
        nombre: nombre.trim(),
        presupuesto_total: monto,
        fecha_inicio,
        fecha_fin: fecha_fin || null,
      });

      setSuccess('Proyecto creado exitosamente');
      setProjectForm({
        nombre: '',
        descripcion: '',
        presupuesto_total: '',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'Activo',
      });
      setIsModalOpen(false);
      mutateProyectos();
    } catch (err: any) {
      console.error('Error al crear el proyecto:', err);
      setError(err?.response?.data?.detail || 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      try {
        await api.deleteProyecto(id);
        setSuccess('Proyecto eliminado exitosamente');
        mutateProyectos();
      } catch (err) {
        setError('Error al eliminar el proyecto');
      }
    }
  };

  const estadoBadgeStyles: Record<string, string> = {
    Activo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Completado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Pausado: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Archivado: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Proyectos</h1>
          <p className="text-slate-400 text-xs mt-1">Control de iniciativas, consumos financieros y cronogramas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-500 shadow-md flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Proyecto</span>
        </Button>
      </div>

      {/* Alertas */}
      {error && <Alert type="error" title="Error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" title="Éxito" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Lista de Proyectos */}
      <div className="grid grid-cols-1 gap-4">
        {Array.isArray(proyectos) && proyectos.length > 0 ? (
          proyectos.map((proyecto: Proyecto) => {
            const presTotal = Number(proyecto.presupuesto_total || 0);
            const costoInvertido = Number(proyecto.costo_invertido || 0);
            const saldoRestante = presTotal - costoInvertido;
            const porcentajeConsumido = presTotal > 0 ? Math.min(Math.round((costoInvertido / presTotal) * 100), 100) : 0;
            const sobrepasado = costoInvertido > presTotal && presTotal > 0;

            return (
              <div
                key={proyecto.id_proyecto}
                className={`bg-slate-900/60 border p-5 rounded-2xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-lg backdrop-blur-sm ${
                  sobrepasado ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/proyectos/${proyecto.id_proyecto}`} className="inline-flex items-center gap-2.5 group">
                      <svg className="w-4 h-4 text-blue-400 shrink-0 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <h3 className="text-lg font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                        {proyecto.nombre}
                      </h3>
                    </Link>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        estadoBadgeStyles[proyecto.estado] || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {proyecto.estado}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs">{proyecto.descripcion || 'Sin descripción'}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                    <span>
                      Inicio: <strong className="text-slate-300">{proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString() : 'Sin definir'}</strong>
                    </span>
                    {proyecto.fecha_fin && (
                      <span>Fin: <strong className="text-slate-300">{new Date(proyecto.fecha_fin).toLocaleDateString()}</strong></span>
                    )}
                  </div>
                </div>

                {/* 💰 BARRA DE CONSUMO FINANCIERO */}
                <div className="lg:w-80 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 shrink-0">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px] font-sans font-semibold">Presupuesto:</span>
                    <span className="font-bold text-white">Bs. {presTotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px] font-sans font-semibold">Invertido (Horas×Tarifa):</span>
                    <span className={`font-bold ${sobrepasado ? 'text-rose-400 animate-pulse' : 'text-purple-400'}`}>
                      Bs. {costoInvertido.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Barra de progreso de gastos */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        sobrepasado ? 'bg-rose-500' : porcentajeConsumido > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(porcentajeConsumido, 100)}%` }}
                    />
                  </div>
                    
                  <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
                    <span className="text-slate-500 flex items-center gap-1">
                      {sobrepasado ? (
                        <>
                          <svg className="w-3 h-3 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-rose-400 font-semibold">Excedido</span>
                        </>
                      ) : (
                        `Saldo: Bs. ${saldoRestante.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
                      )}
                    </span>
                    <span className={`font-bold ${sobrepasado ? 'text-rose-400' : 'text-slate-400'}`}>
                      {porcentajeConsumido}% consumido
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end lg:self-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(proyecto.id_proyecto)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 text-center text-slate-400 py-12 rounded-2xl text-xs">
            No hay proyectos registrados en el sistema.
          </div>
        )}
      </div>

      {/* Modal para Crear Proyecto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Proyecto"
        size="lg"
      >
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Proyecto</label>
            <input
              type="text"
              name="nombre"
              value={projectForm.nombre}
              onChange={handleProjectFormChange}
              placeholder="Ej: Migración Cloud AWS"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={projectForm.descripcion}
              onChange={handleProjectFormChange}
              placeholder="Añade los objetivos y alcance del proyecto..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Presupuesto Total (Bs.)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 font-mono">
                Bs.
              </span>
              <input
                type="text"
                inputMode="decimal"
                name="presupuesto_total"
                value={projectForm.presupuesto_total}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  if ((val.match(/\./g) || []).length <= 1) {
                    setProjectForm({ ...projectForm, presupuesto_total: val });
                  }
                }}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Inicio</label>
              <input
                type="date"
                name="fecha_inicio"
                value={projectForm.fecha_inicio}
                onChange={handleProjectFormChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Fin</label>
              <input
                type="date"
                name="fecha_fin"
                min={projectForm.fecha_inicio || new Date().toISOString().split('T')[0]}
                value={projectForm.fecha_fin}
                onChange={handleProjectFormChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Estado Inicial</label>
            <select
              name="estado"
              value={projectForm.estado}
              onChange={handleProjectFormChange}
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
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 shadow-md"
            >
              {loading ? 'Guardando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}