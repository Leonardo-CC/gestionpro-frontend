// app/dashboard/layout.tsx
import React from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 print:h-auto print:w-auto print:overflow-visible print:bg-white print:text-black">
      {/* Sidebar Fijo -> Oculto en impresión */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950 print:h-auto print:overflow-visible print:bg-white">
        {/* Navbar Superior -> Oculto en impresión */}
        <div className="print:hidden">
          <Navbar />
        </div>
        
        {/* Contenido Dinámico -> Ajustado para PDF/Impresión */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 print:p-0 print:m-0 print:overflow-visible print:bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}