'use client';

import React, { useEffect, useState } from 'react';

export default function Navbar() {
  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold text-slate-200 tracking-wide">
          Plataforma de Gestión
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold text-xs flex items-center justify-center uppercase shrink-0">
            {userName.charAt(0)}
          </div>
          <span className="text-xs font-semibold text-slate-200 capitalize">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
