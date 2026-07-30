'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '../../../services/auth'; 
import { Alert } from '../../../components/Alert';
import api from '../../../services/api';

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    nombre: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      setFormData(prev => ({ ...prev, nombre: currentUser.nombre || '' }));
    }
    setLoading(false);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden. Inténtalo de nuevo.' });
      return;
    }

    setIsUpdating(true);

    try {
      // 1. Llama a la API real para que el Backend en Django persista el cambio
      if (formData.nombre) {
        await api.updatePerfil({ nombre: formData.nombre }); // Reemplazar con tu método API
      }

      setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });

      if (formData.nombre) {
        const updatedUser = { ...user, nombre: formData.nombre };
        setUser(updatedUser);

        // 2. Actualizamos el localStorage
        localStorage.setItem('userName', formData.nombre);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // 3. ⚡ NOTIFICAMOS AL SIDEBAR EN TIEMPO REAL
        window.dispatchEvent(new CustomEvent('user-profile-updated', {
          detail: { nombre: formData.nombre }
        }));
      }

    } catch (error) {
      setMessage({ type: 'error', text: 'Hubo un error al actualizar los datos en el servidor.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  const inicial = user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U';

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100">
      
      {/* Encabezado */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Mi Perfil</h1>
        <p className="text-slate-400 text-xs mt-1">
          Gestiona tu información personal, rol en el equipo y credenciales de acceso
        </p>
      </div>

      {/* Alerta de notificación */}
      {message.text && (
        <Alert type={message.type as 'error' | 'success'} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Tarjeta de Avatar y Rol */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-sm text-center relative overflow-hidden">
            {/* Glow decorativo de fondo */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="h-24 w-24 rounded-full bg-blue-600/20 text-blue-400 border-2 border-blue-500/40 mx-auto flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl font-black">{inicial}</span>
              </div>

              <h2 className="text-lg font-bold text-white tracking-tight">{user.nombre || 'Usuario'}</h2>
              <p className="text-slate-400 text-xs mt-1 font-mono">{user.email}</p>

              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Rol: {user.rol ? user.rol.replace('_', ' ') : 'Miembro de Equipo'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Edición */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
            <form onSubmit={handleUpdate} className="space-y-6">
              
              {/* Sección Información General */}
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Información General</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Completo</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Seguridad */}
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Seguridad y Acceso</span>
                </h3>
                <p className="text-slate-400 text-xs mb-4">
                  Deja estos campos en blanco si no deseas cambiar tu contraseña actual.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nueva Contraseña</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirmar Contraseña</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  {isUpdating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
