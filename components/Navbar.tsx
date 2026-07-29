'use client';

import React, { useEffect, useState } from 'react';

export default function Navbar() {
  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">Plataforma de Gestión</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center uppercase">
            {userName.charAt(0)}
          </div>
          <span className="text-sm font-semibold text-gray-700 capitalize">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
