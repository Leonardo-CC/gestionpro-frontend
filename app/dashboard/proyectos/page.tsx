'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import api from '../../../services/api';
import { Card, CardBody } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { Alert } from '../../../components/Alert';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  descripcion: string;
  presupuesto_total: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export default function ProyectosPage() {
  const { data: proyectos = [], mutate: mutateProyectos } = useSWR('/proyectos', () => api.getProyectos());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    presupuesto_total: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'Activo',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.createProyecto({
        ...formData,
        presupuesto_total: parseFloat(formData.presupuesto_total),
      });
      setSuccess('Proyecto creado exitosamente');
      setFormData({
        nombre: '',
        descripcion: '',
        presupuesto_total: '',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'Activo',
      });
      setIsModalOpen(false);
      mutateProyectos();
    } catch (err) {
      setError('Error al crear el proyecto');
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

  const estadoColor: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
    Activo: 'success',
    Completado: 'primary',
    Pausado: 'warning',
    Archivado: 'danger',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Proyectos</h1>
          <p className="text-slate-400 text-xs mt-1">Gestión general de proyectos y presupuestos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          + Nuevo Proyecto
        </Button>
      </div>

      {error && <Alert type="error" title="Error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" title="Éxito" onClose={() => setSuccess('')}>{success}</Alert>}

      <div className="grid grid-cols-1 gap-4">
        {Array.isArray(proyectos) && proyectos.length > 0 ? (
          proyectos.map((proyecto: Proyecto) => (
            <div key={proyecto.id_proyecto} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all flex items-start justify-between">
              <div className="flex-1">
                <Link href={`/dashboard/proyectos/${proyecto.id_proyecto}`}>
                  <h3 className="text-lg font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                    {proyecto.nombre}
                  </h3>
                </Link>
                <p className="text-slate-400 text-sm mt-1">{proyecto.descripcion}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span>Presupuesto: <strong className="text-slate-200">${proyecto.presupuesto_total}</strong></span>
                  <span>Inicio: {new Date(proyecto.fecha_inicio).toLocaleDateString()}</span>
                  {proyecto.fecha_fin && <span>Fin: {new Date(proyecto.fecha_fin).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={estadoColor[proyecto.estado]}>{proyecto.estado}</Badge>
                <Button variant="danger" size="sm" onClick={() => handleDelete(proyecto.id_proyecto)}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-900 border border-slate-800 text-center text-slate-400 py-12 rounded-xl">
            No hay proyectos registrados
          </div>
        )}
      </div>

      {/* Modal Crear Proyecto */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Proyecto" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-200">
          <Input label="Nombre del Proyecto" name="nombre" value={formData.nombre} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Input label="Presupuesto Total" type="number" name="presupuesto_total" value={formData.presupuesto_total} onChange={handleChange} required />
          <Input label="Fecha de Inicio" type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} required />
          <Input label="Fecha de Fin" type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} />
          <Select
            label="Estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            options={[
              { value: 'Activo', label: 'Activo' },
              { value: 'Pausado', label: 'Pausado' },
              { value: 'Archivado', label: 'Archivado' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Crear Proyecto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
