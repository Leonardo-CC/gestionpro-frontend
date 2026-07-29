'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '../../components/AppLogo';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import authService from '../../services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = (await authService.login(formData)) as any;
      
      // Extraemos el token compatible con JWT de Django
      const token = response.access_token || response.token || response.access || response.data?.access_token;

      if (token) {
        localStorage.setItem('authToken', token);

        // Guardamos los datos reales devueltos por el backend
        const userObj = response.user || response.usuario || response;
        
        if (userObj.id_usuario || userObj.id) {
          localStorage.setItem('userId', String(userObj.id_usuario || userObj.id));
        }
        
        if (userObj.nombre || userObj.nombre_usuario || userObj.username) {
          localStorage.setItem('userName', userObj.nombre || userObj.nombre_usuario || userObj.username);
        }

        if (userObj.rol) {
          localStorage.setItem('userRole', userObj.rol);
        }

        router.push('/dashboard');
      } else {
        setError('No se recibió el token de autenticación del servidor');
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.error || 
        'Credenciales inválidas o error de conexión con el servidor'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      
      {/* MITAD IZQUIERDA: Propuesta de valor, objetivos y negocio */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Efectos visuales de fondo sutiles */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo o Marca del Proyecto */}
        <div className="relative z-10 flex items-center gap-4">
          <AppLogo size="md" />
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-xl text-white">
              GestionPro
            </span>
            <span className="text-xs font-semibold text-blue-400 tracking-wider">
              ENTERPRISE SUITE
            </span>
          </div>
        </div>

        {/* Contenido Central: Objetivos del Negocio */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              Plataforma de Gestión Integral
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight mt-2 text-white leading-tight">
              Control total de proyectos, recursos y presupuestos.
            </h1>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
              Diseñado para optimizar el flujo de trabajo ágil, permitiendo la asignación precisa de tareas, seguimiento de horas y auditoría en tiempo real para equipos de alto rendimiento.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-2xl font-bold text-blue-400">100%</p>
              <p className="text-xs text-slate-400 mt-1">Trazabilidad de Tareas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-400">Tiempo Real</p>
              <p className="text-xs text-slate-400 mt-1">Control Financiero</p>
            </div>
          </div>
        </div>

        {/* Pie de página institucional */}
        <div className="relative z-10 text-xs text-slate-500">
          Universidad Mayor de San Andrés (UMSA) • Facultad de Ciencias Puras y Naturales
        </div>
      </div>

      {/* MITAD DERECHA: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert type="error" title="Error de acceso" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Correo Electrónico
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nombre@dominio.com"
                required
                className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Contraseña
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                size="lg" 
                loading={loading} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all text-sm"
              >
                Acceder a la Plataforma
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-sm">
              ¿No tienes cuenta registrada?{' '}
              <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Crear cuenta
              </a>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
