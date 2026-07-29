'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '../../components/AppLogo';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import authService from '../../services/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
      });
      router.push('/login');
    } catch (err: any) {
      console.error("Detalle del error:", err);
      setError(err.message || 'Error al registrar la cuenta en el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      
      {/* MITAD IZQUIERDA: Propuesta de valor, objetivos y marca */}
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

        {/* Contenido Central: Beneficios del Registro */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              Incorporación de Colaboradores
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight mt-2 text-white leading-tight">
              Únete a la gestión inteligente de proyectos académicos y corporativos.
            </h1>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
              Crea tu cuenta institucional para comenzar a coordinar tableros, registrar horas de trabajo, interactuar mediante notas en tiempo real y asegurar la transparencia financiera.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-2xl font-bold text-blue-400">Seguro</p>
              <p className="text-xs text-slate-400 mt-1">Autenticación JWT & RLS</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-400">Dinámico</p>
              <p className="text-xs text-slate-400 mt-1">Gestión de Roles Activos</p>
            </div>
          </div>
        </div>

        {/* Pie de página institucional */}
        <div className="relative z-10 text-xs text-slate-500">
          Universidad Mayor de San Andrés (UMSA) • Facultad de Ciencias Puras y Naturales
        </div>
      </div>

      {/* MITAD DERECHA: Formulario de Registro */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Crear Cuenta
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Completa los datos para registrarte en la plataforma
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert type="error" title="Error de registro" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nombre Completo
              </label>
              <Input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Juan Pérez"
                required
                className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Confirmar Contraseña
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
                Completar Registro
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-sm">
              ¿Ya tienes una cuenta?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Inicia sesión aquí
              </a>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
