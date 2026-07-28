'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '../services/auth';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Gestión de Proyectos
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/proyectos" className="text-gray-700 hover:text-blue-600">
              Proyectos
            </Link>
            <Link href="/usuarios" className="text-gray-700 hover:text-blue-600">
              Usuarios
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
                {user.nombre} ▼
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl hidden group-hover:block z-10">
                <Link
                  href="/perfil"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Mi Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <Link href="/proyectos" className="block text-gray-700 hover:text-blue-600 py-2">
              Proyectos
            </Link>
            <Link href="/usuarios" className="block text-gray-700 hover:text-blue-600 py-2">
              Usuarios
            </Link>
            <Link href="/perfil" className="block text-gray-700 hover:text-blue-600 py-2">
              Mi Perfil
            </Link>
            <Button variant="danger" size="sm" onClick={handleLogout} className="w-full">
              Cerrar Sesión
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
