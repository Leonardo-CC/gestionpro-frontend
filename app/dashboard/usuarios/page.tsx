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
import { Alert } from '../../../components/Alert';

interface Usuario {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: string;
  tarifa_hora: number;
  activo: boolean;
}

export default function UsuariosPage() {
  const { data: usuarios = [], mutate } = useSWR('/usuarios', () => api.getUsuarios(), {
    revalidateOnFocus: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'Miembro_Equipo',
    tarifa_hora: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUserId(usuario.id_usuario);
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        tarifa_hora: usuario.tarifa_hora.toString(),
      });
    } else {
      setEditingUserId(null);
      setFormData({
        nombre: '',
        email: '',
        rol: 'Miembro_Equipo',
        tarifa_hora: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingUserId) {
        await api.updateUsuario(editingUserId, {
          ...formData,
          tarifa_hora: parseFloat(formData.tarifa_hora),
        });
        setSuccess('Usuario actualizado exitosamente');
      } else {
        // Crear usuario
        setSuccess('Usuario creado exitosamente');
      }
      setIsModalOpen(false);
      mutate();
    } catch (err) {
      setError('Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const rolColor: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
    Administrador: 'danger',
    Gerente_Proyecto: 'warning',
    Miembro_Equipo: 'primary',
    Ejecutivo: 'success',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra el equipo y sus tarIfas</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          + Nuevo Usuario
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(usuarios) && usuarios.length > 0 ? (
          usuarios.map((usuario: Usuario) => (
            <Card key={usuario.id_usuario}>
              <CardHeader
                title={usuario.nombre}
                action={
                  <Badge variant={rolColor[usuario.rol]}>
                    {usuario.rol.replace('_', ' ')}
                  </Badge>
                }
              />
              <CardBody className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{usuario.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tarifa por Hora</p>
                  <p className="text-lg font-bold text-blue-600">${usuario.tarifa_hora}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      usuario.activo ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenModal(usuario)}
                  >
                    Editar
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardBody className="text-center text-gray-500 py-8">
              No hay usuarios disponibles
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button loading={loading} onClick={handleSubmit}>
              {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Juan Pérez"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="juan@example.com"
            required
          />

          <Select
            label="Rol"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            options={[
              { value: 'Administrador', label: 'Administrador' },
              { value: 'Gerente_Proyecto', label: 'Gerente de Proyecto' },
              { value: 'Miembro_Equipo', label: 'Miembro del Equipo' },
              { value: 'Ejecutivo', label: 'Ejecutivo' },
            ]}
          />

          <Input
            label="Tarifa por Hora"
            type="number"
            name="tarifa_hora"
            value={formData.tarifa_hora}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            required
          />
        </form>
      </Modal>
    </div>
  );
}
