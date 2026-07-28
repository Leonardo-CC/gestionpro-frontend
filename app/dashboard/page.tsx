'use client';

import React, { useEffect, useState } from 'react';
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

const fetcher = async (url: string) => {
  try {
    if (url === '/proyectos') {
      return await api.getProyectos();
    }
    return [];
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

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
    return Math.floor(Math.random() * 100);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al sistema de gestión de proyectos</p>
      </div>

      {/* Resumen de Proyectos */}
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
              ${proyectos.reduce((sum: number, p: Proyecto) => sum + (p.presupuesto_total || 0), 0)}
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

      {/* Listado de Proyectos */}
      <Card>
        <CardHeader
          title="Proyectos Recientes"
          action={
            <Link href="/dashboard/proyectos">
              <div className="text-blue-600 hover:text-blue-700">Ver todos →</div>
            </Link>
          }
        />
        <CardBody>
          {isLoading ? (
            <p className="text-gray-500">Cargando proyectos...</p>
          ) : proyectos.length > 0 ? (
            <div className="space-y-4">
              {proyectos.slice(0, 5).map((proyecto: Proyecto) => (
                <div
                  key={proyecto.id_proyecto}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{proyecto.nombre}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Presupuesto: ${proyecto.presupuesto_total}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${calcularProgreso(proyecto)}%` }}
                      />
                    </div>
                    <Badge variant={estadoColor[proyecto.estado]}>
                      {proyecto.estado}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay proyectos disponibles</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
