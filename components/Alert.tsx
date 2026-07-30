import React, { ReactNode } from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

// Estilos adaptados al tema Dark Enterprise con transparencias y bordes sutiles
const typeStyles = {
  success: {
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-200',
  },
  error: {
    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-200',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-200',
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-200',
  },
};

export const Alert: React.FC<AlertProps> = ({ type, title, children, onClose }) => {
  const currentStyle = typeStyles[type] || typeStyles.info;

  return (
    <div className={`border rounded-xl p-4 transition-all backdrop-blur-sm ${currentStyle.bg}`}>
      <div className="flex items-start justify-between gap-3">
        
        {/* Contenido Principal con Ícono Vectorial */}
        <div className="flex items-start gap-3">
          {/* Íconos SVG según el tipo de alerta */}
          <div className={`mt-0.5 shrink-0 ${currentStyle.iconColor}`}>
            {type === 'success' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {type === 'error' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {type === 'warning' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {type === 'info' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div>
            {title && <h4 className={`font-bold text-xs tracking-wide uppercase mb-0.5 ${currentStyle.titleColor}`}>{title}</h4>}
            <div className="text-xs font-medium leading-relaxed">{children}</div>
          </div>
        </div>

        {/* Botón de Cierre con SVG */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition-colors shrink-0"
            title="Cerrar notificación"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

      </div>
    </div>
  );
};