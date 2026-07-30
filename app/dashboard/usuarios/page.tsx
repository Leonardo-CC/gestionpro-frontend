'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
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
        tarifa_hora: usuario.tarifa_hora ? usuario.tarifa_hora.toString() : '0',
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
          tarifa_hora: parseFloat(formData.tarifa_hora) || 0,
        });
        setSuccess('Usuario actualizado exitosamente');
      } else {
        setSuccess('Usuario registrado exitosamente');
      }
      setIsModalOpen(false);
      mutate();
    } catch (err) {
      setError('Error al guardar la información del usuario');
    } finally {
      setLoading(false);
    }
  };

  const rolBadgeStyles: Record<string, string> = {
    Administrador: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Gerente_Proyecto: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Miembro_Equipo: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Ejecutivo: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 max-w-7xl mx-auto">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-400 text-xs mt-1">Administra el equipo de desarrollo, roles y tarifas por hora</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="sm" className="bg-blue-600 hover:bg-blue-500 shadow-md flex items-center gap-1.5 self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Nuevo Usuario</span>
        </Button>
      </div>

      {/* Alertas */}
      {error && <Alert type="error" title="Error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" title="Éxito" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Grilla de Usuarios Corregida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.isArray(usuarios) && usuarios.length > 0 ? (
          usuarios.map((usuario: Usuario) => {
            const iniciales = usuario.nombre
              ? usuario.nombre.substring(0, 2).toUpperCase()
              : 'US';

            return (
              <div
                key={usuario.id_usuario}
                className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg backdrop-blur-sm space-y-4"
              >
                {/* Cabecera de Tarjeta con Flex-wrap/Truncate para evitar desbordes */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                      {iniciales}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-white text-sm leading-tight truncate">{usuario.nombre}</h3>
                      <p className="text-slate-400 text-xs mt-0.5 truncate">{usuario.email}</p>
                    </div>
                  </div>
                  
                  {/* Badge de Rol Sanitizado */}
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 whitespace-nowrap ${
                      rolBadgeStyles[usuario.rol] || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {usuario.rol ? usuario.rol.replace('_', ' ') : 'MIEMBRO'}
                  </span>
                </div>

                {/* Info de Tarifa y Estado */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Tarifa p/ Hora</span>
                    <p className="text-base font-black text-emerald-400 font-mono">
                      Bs. {Number(usuario.tarifa_hora || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        usuario.activo !== false ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-400">
                      {usuario.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(usuario)}
                    className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Editar Usuario</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-slate-900/40 border border-slate-800 text-center text-slate-500 py-12 rounded-2xl text-xs italic">
            No hay usuarios registrados en la plataforma.
          </div>
        )}
      </div>

      {/* Modal Editar / Crear */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan@example.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Rol Asignado</label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [color-scheme:dark]"
            >
              <option value="Administrador" className="bg-slate-900 text-slate-100">Administrador</option>
              <option value="Gerente_Proyecto" className="bg-slate-900 text-slate-100">Gerente de Proyecto</option>
              <option value="Miembro_Equipo" className="bg-slate-900 text-slate-100">Miembro del Equipo</option>
              <option value="Ejecutivo" className="bg-slate-900 text-slate-100">Ejecutivo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tarifa por Hora (Bs.)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 font-mono">
                Bs.
              </span>
              <input
                type="number"
                step="0.01"
                name="tarifa_hora"
                value={formData.tarifa_hora}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono placeholder-slate-500"
                required
              />
            </div>
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
              {loading ? 'Guardando...' : editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}