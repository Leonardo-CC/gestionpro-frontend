import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestión de Proyectos',
  description: 'Sistema de gestión de proyectos y control de horas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}