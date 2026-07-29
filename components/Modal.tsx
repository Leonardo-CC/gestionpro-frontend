import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con leve desenfoque */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Contenedor Modal estilo Slate Dark */}
      <div
        className={`relative bg-slate-900 border border-slate-800 rounded-xl shadow-2xl ${sizeClasses[size]} w-full z-10 overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200">
          {children}
        </div>

        {/* Footer opcional */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-950/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
