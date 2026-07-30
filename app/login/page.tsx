'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '../../components/AppLogo';
import authService from '../../services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      const token = response.access_token || response.token || response.access || response.data?.access_token;

      if (token) {
        localStorage.setItem('authToken', token);

        const userObj = response.user || response.usuario || response;
        
        if (userObj.id_usuario || userObj.id) {
          localStorage.setItem('userId', String(userObj.id_usuario || userObj.id));
        }
        
        if (userObj.nombre || userObj.nombre_usuario || userObj.username) {
          localStorage.setItem('userName', userObj.nombre || userObj.nombre_usuario || userObj.username);
        }

        if (userObj.email) {
          localStorage.setItem('userEmail', userObj.email);
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
    <div className="min-h-screen w-full flex bg-slate-950 font-sans antialiased text-slate-100">
      
      {/* MITAD IZQUIERDA: Propuesta de valor y branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 border-r border-slate-800/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Glows de fondo decorativos */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Logo Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <AppLogo size="md" />
          <div className="flex flex-col">
            <span className="font-black tracking-tight text-xl text-white">
              GestionPro
            </span>
            <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">
              ENTERPRISE SUITE
            </span>
          </div>
        </div>

        {/* Mensajes Principales */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-4">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Plataforma de Gestión Integral
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
              Control total de proyectos, recursos y presupuestos.
            </h1>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed font-normal">
              Diseñado para optimizar el flujo de trabajo ágil, permitiendo la asignación precisa de tareas, seguimiento de horas y auditoría en tiempo real para equipos de alto rendimiento.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800/80">
            <div>
              <p className="text-3xl font-black text-blue-400 font-mono">100%</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Trazabilidad de Tareas</p>
            </div>
            <div>
              <p className="text-3xl font-black text-indigo-400 font-mono">Real-time</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Control Financiero & Horas</p>
            </div>
          </div>
        </div>

        {/* Footer Institucional */}
        <div className="relative z-10 text-xs text-slate-500 font-medium border-t border-slate-800/50 pt-4">
          Universidad Mayor de San Andrés (UMSA) • Facultad de Ciencias Puras y Naturales
        </div>
      </div>

      {/* MITAD DERECHA: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-2xl shadow-2xl relative">
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-slate-400 text-xs mt-1.5">
              Ingresa tus credenciales para acceder a la plataforma
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campo Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nombre@dominio.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Campo Contraseña con Toggle SVG */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 014.122-.922c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botón Submit */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Acceder a la Plataforma</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer de Registro */}
          <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
            <p className="text-slate-400 text-xs">
              ¿No tienes cuenta registrada?{' '}
              <a href="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline underline-offset-4">
                Crear cuenta
              </a>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
