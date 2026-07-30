'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '../services/api';

interface UserProfile {
  nombre?: string;
  email?: string;
  rol?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Estados para la información del usuario
  const [userName, setUserName] = useState('Cargando...');
  const [userRole, setUserRole] = useState('...');
  const [userInitial, setUserInitial] = useState('U');

  useEffect(() => {
    async function loadUserData() {
      try {
        const userData: UserProfile = await api.getPerfil(); 
        
        const nombreReal = userData.nombre || userData.email?.split('@')[0] || 'Usuario';
        const rolReal = userData.rol || 'Miembro del Equipo';

        setUserName(nombreReal);
        setUserRole(rolReal.replace('_', ' '));
        setUserInitial(nombreReal.charAt(0).toUpperCase());

        localStorage.setItem('userName', nombreReal);
        localStorage.setItem('userRole', rolReal);
        return;
      } catch (error) {
        console.log('Usando datos locales guardados...');
      }

      const storedName = localStorage.getItem('userName');
      const storedRole = localStorage.getItem('userRole');

      if (storedName) {
        setUserName(storedName);
        setUserRole(storedRole ? storedRole.replace('_', ' ') : 'Usuario');
        setUserInitial(storedName.charAt(0).toUpperCase());
      } else {
        setUserName('Usuario Activo');
        setUserRole('Gerente de Proyecto');
        setUserInitial('U');
      }
    }

    loadUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  // Menú de navegación completo
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
    },
    { 
      name: 'Cronograma', 
      path: '/dashboard/cronograma', 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
    },
    { 
      name: 'Proyectos', 
      path: '/dashboard/proyectos', 
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' 
    },
    { 
      name: 'Tareas', 
      path: '/dashboard/tareas', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' 
    },
    { 
      name: 'Reportes', 
      path: '/dashboard/reportes', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' 
    },
    { 
      name: 'Usuarios', 
      path: '/dashboard/usuarios', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' 
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-xl shrink-0">
      {/* Logo superior */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white tracking-wider shadow-md mr-3 text-xs">
          GP
        </div>
        <span className="font-bold text-white tracking-tight">GestionPro</span>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.path === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Perfil del Usuario y Cierre de Sesión */}
      <div className="mt-auto border-t border-slate-800 bg-slate-950/40 p-4 shrink-0">
        
        {/* Link Interactivo al Perfil */}
        <Link 
          href="/dashboard/perfil"
          className={`flex items-center gap-3 mb-3 p-2 rounded-xl transition-all group cursor-pointer border ${
            pathname === '/dashboard/perfil'
              ? 'bg-slate-800/90 border-blue-500/40'
              : 'border-transparent hover:bg-slate-800/60 hover:border-slate-700/60'
          }`}
          title="Ver y editar Mi Perfil"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm uppercase border border-blue-500/30 shrink-0 group-hover:border-blue-400 transition-colors">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate capitalize group-hover:text-blue-400 transition-colors">
              {userName}
            </p>
            <p className="text-[11px] text-blue-400 font-medium truncate capitalize">
              {userRole}
            </p>
          </div>
        </Link>

        {/* Botón Cerrar Sesión */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-400 border border-slate-700 rounded-lg transition-all text-xs font-semibold group cursor-pointer"
        >
          <svg className="w-4 h-4 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}