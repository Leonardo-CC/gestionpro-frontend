'use client';

import React from 'react';
import useSWR from 'swr';
import api from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Badge } from '../../components/Badge';
import Link from 'next/link';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  presupuesto_total: number;
  estado: string;
  fecha_fin: string;
}

export default function DashboardPage() {
  const { data: proyectos = [], isLoading } = useSWR('/api/proyectos', () => api.getProyectos(), {
    revalidateOnFocus: false,
  });
  
  const estadoColor: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
    Activo: 'success',
    Completado: 'primary',
    Pausado: 'warning',
    Archivado: 'danger',
  };

  const calcularProgreso = (proyecto: Proyecto) => {
    // Calculo porcentual visual basado en el ID para mantener consistencia
    return ((proyecto.id_proyecto * 35) % 80) + 20;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido al sistema de gestión de proyectos</p>
      </div>

      {/* Resumen de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Total Proyectos</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{proyectos.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Activos</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {proyectos.filter((p: Proyecto) => p.estado === 'Activo').length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Presupuesto Total</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {proyectos.reduce((sum: number, p: Proyecto) => sum + Number(p.presupuesto_total || 0), 0).toFixed(2)} Bs
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Completados</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {proyectos.filter((p: Proyecto) => p.estado === 'Completado').length}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Listado de Proyectos con Enlace Directo */}
      <Card>
        <CardHeader
          title="Proyectos Recientes"
          action={
            <Link href="/proyectos" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Ver todos →
            </Link>
          }
        />
        <CardBody>
          {isLoading ? (
            <p className="text-gray-500 py-4 text-center">Cargando proyectos...</p>
          ) : proyectos.length > 0 ? (
            <div className="space-y-3">
              {proyectos.slice(0, 5).map((proyecto: Proyecto) => (
                <Link
                  key={proyecto.id_proyecto}
                  href={`/proyectos/${proyecto.id_proyecto}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-slate-50 transition-all hover:shadow-xs group block"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {proyecto.nombre}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      Presupuesto: Bs. {Number(proyecto.presupuesto_total).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${calcularProgreso(proyecto)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-400">
                        {calcularProgreso(proyecto)}%
                      </span>
                    </div>

                    <Badge variant={estadoColor[proyecto.estado] || 'primary'}>
                      {proyecto.estado}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">No hay proyectos disponibles</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
