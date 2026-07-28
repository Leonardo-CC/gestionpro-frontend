'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../../../services/api';
import { Card, CardHeader, CardBody } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import Link from 'next/link';
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
  const { data: proyectos = [], mutate } = useSWR('/proyectos', () => api.getProyectos(), {
    revalidateOnFocus: false,
  });

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
      mutate();
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
        mutate();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-600 mt-1">Gestiona todos tus proyectos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          + Nuevo Proyecto
        </Button>
      </div>

      {error && (
        <Alert type="error" title="Error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" title="Éxito" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4">
        {Array.isArray(proyectos) && proyectos.length > 0 ? (
          proyectos.map((proyecto: Proyecto) => (
            <Card key={proyecto.id_proyecto} hoverable>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link href={`/dashboard/proyectos/${proyecto.id_proyecto}`}>
                    <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700">
                      {proyecto.nombre}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mt-1">{proyecto.descripcion}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm text-gray-500">
                      Presupuesto: ${proyecto.presupuesto_total}
                    </span>
                    <span className="text-sm text-gray-500">
                      Inicio: {new Date(proyecto.fecha_inicio).toLocaleDateString()}
                    </span>
                    {proyecto.fecha_fin && (
                      <span className="text-sm text-gray-500">
                        Fin: {new Date(proyecto.fecha_fin).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={estadoColor[proyecto.estado]}>
                    {proyecto.estado}
                  </Badge>
                  <Link href={`/dashboard/proyectos/${proyecto.id_proyecto}`}>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(proyecto.id_proyecto)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <CardBody className="text-center text-gray-500 py-8">
              No hay proyectos disponibles
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Proyecto"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button loading={loading} onClick={handleSubmit}>
              Crear Proyecto
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del Proyecto"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Mi Proyecto"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Descripción del proyecto"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Input
            label="Presupuesto Total"
            type="number"
            name="presupuesto_total"
            value={formData.presupuesto_total}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            required
          />

          <Input
            label="Fecha de Inicio"
            type="date"
            name="fecha_inicio"
            value={formData.fecha_inicio}
            onChange={handleChange}
            required
          />

          <Input
            label="Fecha de Fin"
            type="date"
            name="fecha_fin"
            value={formData.fecha_fin}
            onChange={handleChange}
          />

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
        </form>
      </Modal>
    </div>
  );
}
