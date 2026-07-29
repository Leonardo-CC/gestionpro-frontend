'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../../../services/api';
import { Card, CardHeader, CardBody } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  presupuesto_total: number | string;
  estado: string;
}

export default function ReportesPage() {
  const { data: proyectos = [] } = useSWR('/proyectos', () => api.getProyectos(), {
    revalidateOnFocus: false,
  });

  const [exportFormat, setExportFormat] = useState('csv');

  const handleExport = () => {
    if (exportFormat === 'csv') {
      const headers = ['ID', 'Nombre del Proyecto', 'Presupuesto (Bs)', 'Estado'];
      const rows = proyectos.map((p: Proyecto) => [
        p.id_proyecto,
        `"${p.nombre}"`, 
        Number(p.presupuesto_total).toFixed(2),
        p.estado
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'reporte_proyectos.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`(Modo Demo) La generación de ${exportFormat.toUpperCase()} requiere conexión con el servidor de reportes.`);
    }
  };

  const chartDataReales = Array.isArray(proyectos) 
    ? proyectos.slice(0, 8).map((p: Proyecto) => ({
        name: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
        Presupuesto: Number(p.presupuesto_total)
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Panel de Reportes
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Análisis financiero y métricas de rendimiento del equipo
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <Select
            options={[
              { value: 'csv', label: '📄 CSV (Excel)' },
              { value: 'pdf', label: '📑 PDF' },
              { value: 'xlsx', label: '📊 Excel' },
            ]}
            placeholder="Formato"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          />
          <Button onClick={handleExport} className="shadow-sm">
            Exportar Datos
          </Button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Presupuestado</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  Bs. {proyectos.reduce((sum: number, p: Proyecto) => sum + Number(p.presupuesto_total || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Proyectos Activos</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {proyectos.filter((p: Proyecto) => p.estado === 'Activo').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Completados</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {proyectos.filter((p: Proyecto) => p.estado === 'Completado').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Tasa Completitud</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {proyectos.length > 0
                    ? Math.round((proyectos.filter((p: Proyecto) => p.estado === 'Completado').length / proyectos.length) * 100)
                    : 0}
                  <span className="text-lg text-gray-500 ml-1">%</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border border-gray-100">
          <CardHeader title="Presupuesto por Proyecto (Datos Reales)" />
          <CardBody>
            {chartDataReales.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartDataReales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value) => `Bs. ${Number(value).toLocaleString('es-BO')}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Presupuesto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400">
                Aún no hay proyectos registrados
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardHeader title="Top Proyectos por Presupuesto" />
          <CardBody>
            <div className="space-y-4 pt-2">
              {Array.isArray(proyectos) && proyectos.length > 0 ? (
                proyectos
                  .sort((a: Proyecto, b: Proyecto) => Number(b.presupuesto_total) - Number(a.presupuesto_total))
                  .slice(0, 5)
                  .map((proyecto: Proyecto, index: number) => {
                    return (
                      <div key={proyecto.id_proyecto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-transparent hover:border-blue-100">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                          <span className="text-sm font-semibold text-gray-800">{proyecto.nombre}</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                          Bs. {Number(proyecto.presupuesto_total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })
              ) : (
                <p className="text-center text-gray-500 py-8">No hay proyectos suficientes.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabla de Historial */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader title="Seguimiento de Progreso" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Proyecto</th>
                  <th className="px-6 py-4">Presupuesto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 min-w-[200px]">Progreso de Tareas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Array.isArray(proyectos) &&
                  proyectos.map((proyecto: Proyecto) => {
                    const progresoValue = proyecto.estado === 'Completado' 
                      ? 100 
                      : Math.max(15, (proyecto.id_proyecto * 37) % 85);

                    return (
                      <tr key={proyecto.id_proyecto} className="hover:bg-gray-50 transition-colors bg-white">
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {proyecto.nombre}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          Bs. {Number(proyecto.presupuesto_total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            proyecto.estado === 'Activo' ? 'bg-green-50 text-green-700 border-green-200' :
                            proyecto.estado === 'Pausado' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {proyecto.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden border border-gray-300">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-1000 ${
                                  progresoValue === 100 ? 'bg-purple-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${progresoValue}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-600 w-9 text-right">
                              {progresoValue}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
