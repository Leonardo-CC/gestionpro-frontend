'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const userName = typeof window !== 'undefined' ? localStorage.getItem('userName') : '';
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';

  const handleSubmitApplication = async () => {
    setLoading(true);
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="w-full max-w-md">
        {!submitted ? (
          <div className="bg-slate-900/80 border border-slate-800/80 p-10 rounded-2xl shadow-2xl backdrop-blur-sm">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white">Postulación a Organización</h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">Únete a nuestro equipo de trabajo colaborativo</p>
            </div>

            <div className="space-y-5 mb-8">
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Tu Información</p>
                <div className="space-y-2">
                  <p className="text-slate-200 text-sm"><span className="font-semibold text-blue-400">{userName}</span></p>
                  <p className="text-slate-400 text-xs break-all">{userEmail}</p>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Próximos Pasos
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs">1</span>
                    <span>Envía tu solicitud de postulación</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs">2</span>
                    <span>El administrador revisará tu perfil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs">3</span>
                    <span>Recibirás confirmación vía email</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSubmitApplication}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Enviar Solicitud</span>
                  </>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-all text-sm"
              >
                Cambiar Cuenta
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800/80 p-10 rounded-2xl shadow-2xl backdrop-blur-sm text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white">¡Solicitud Enviada!</h2>
              <p className="text-slate-400 text-sm mt-2">Tu postulación ha sido registrada exitosamente</p>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 mb-6 text-left">
              <p className="text-slate-200 text-sm leading-relaxed">
                Tu solicitud de postulación ha sido enviada. El administrador la revisará en breve y te notificará por correo electrónico (<span className="font-mono text-xs text-slate-300">{userEmail}</span>) con la decisión.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm"
            >
              Volver a Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
