'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar que el usuario esté autenticado pero pendiente de aprobación
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const token = localStorage.getItem('authToken');
    const isActive = localStorage.getItem('userActive');

    if (!token) {
      // Si no hay token, redirigir al login
      router.push('/login');
      return;
    }

    if (isActive === 'true') {
      // Si está activo, redirigir al dashboard
      router.push('/dashboard');
      return;
    }

    setUserName(name || 'Usuario');
    setUserEmail(email || '');
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userActive');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
        {/* Icono de Estado */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Encabezado */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Solicitud Pendiente de Aprobación</h1>
          <p className="text-slate-400 text-sm">
            Hola <span className="font-semibold text-slate-200">{userName}</span>, tu solicitud de acceso ha sido registrada.
          </p>
        </div>

        {/* Contenido Principal */}
        <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-5 space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-slate-200">Tu estado: <span className="text-amber-400">Pendiente</span></p>
              <p className="text-slate-400 text-xs mt-1">
                Un administrador revisará tu solicitud próximamente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-slate-200">Email registrado: <span className="text-blue-400">{userEmail}</span></p>
              <p className="text-slate-400 text-xs mt-1">
                Recibirás una notificación cuando sea aprobado.
              </p>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 text-left text-sm">
          <p className="text-slate-300 mb-2">
            Si tienes preguntas, contacta al administrador:
          </p>
          <p className="text-green-400 font-mono text-xs">
            admin@gestionpro.com
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors border border-slate-700"
          >
            Cambiar Cuenta
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Recargar
          </button>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 pt-4 border-t border-slate-800">
          <p>
            GestionPro © 2026 | 
            <Link href="/login" className="text-blue-400 hover:underline ml-2">
              Volver al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
