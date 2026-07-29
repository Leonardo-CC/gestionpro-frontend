'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '../../services/auth'; 
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import { Card } from '../../components/Card'; // Asumiendo que tu Card exporta { Card, CardBody, etc. } si es necesario

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
      // Simulación de la llamada a la API (Reemplazar con tu endpoint real)
      // await authService.updateProfile({...});
      
      setMessage({ type: 'success', text: '¡Perfil actualizado! Redirigiendo al dashboard...' });
      
      if (formData.nombre) {
        const updatedUser = { ...user, nombre: formData.nombre };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); 
      }

      // Redirección con un pequeño retraso para que el usuario lea el mensaje de éxito
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      setMessage({ type: 'error', text: 'Hubo un error al actualizar los datos.' });
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu información personal y credenciales de acceso.</p>
      </div>
      
      {message.text && (
        <Alert type={message.type as 'error' | 'success'} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Tarjeta de Información Estática */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
            <div className="p-6 text-center">
              <div className="h-24 w-24 rounded-full bg-white/20 mx-auto flex items-center justify-center backdrop-blur-sm mb-4">
                <span className="text-4xl font-bold text-white">
                  {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <h2 className="text-xl font-bold">{user.nombre || 'Usuario'}</h2>
              <p className="text-blue-100 text-sm mt-1">{user.email}</p>
              
              <div className="mt-4 pt-4 border-t border-blue-400/30">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  Rol: {user.rol || 'Miembro de Equipo'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Formulario de Edición */}
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Información General</h3>
                <div className="space-y-4">
                  <Input
                    label="Nombre Completo"
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Seguridad</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Deja estos campos en blanco si no deseas cambiar tu contraseña actual.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nueva Contraseña"
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  <Input
                    label="Confirmar Contraseña"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="mr-3" 
                  onClick={() => router.push('/dashboard')}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={isUpdating}>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
}