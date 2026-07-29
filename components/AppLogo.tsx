// components/AppLogo.tsx
import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 shadow-xl shadow-blue-600/30 border border-blue-400/20 overflow-hidden ${sizeClasses[size]} ${className}`}>
      {/* Efectos geométricos internos para darle profundidad (diseño tipo app moderna) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_50%)]"></div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-800/40 rounded-full blur-sm"></div>
      
      {/* Iconografía vectorial interna (Monograma GP minimalista y elegante) */}
      <svg className="w-1/2 h-1/2 text-white relative z-10 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
        <path d="M13 2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    </div>
  );
};
