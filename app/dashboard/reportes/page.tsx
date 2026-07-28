'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '../../../services/api';
import { Card, CardHeader, CardBody } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Proyecto {
  id_proyecto: number;
  nombre: string;
  presupuesto_total: number;
  estado: string;
}

interface RegistroHoras {
  id_usuario: string;
  horas_trabajadas: number;
  fecha: string;
}

export default function ReportesPage() {
  const { data: proyectos = [] } = useSWR('/proyectos', () => api.getProyectos(), {
    revalidateOnFocus: false,
  });

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState('csv');

  const handleExport = () => {
    // Implementar exportación
    console.log('Exportar en formato:', exportFormat);
  };

  // Datos simulados para gráficos
  const costVsBudgetData = [
    { name: 'Proyecto A', presupuesto: 5000, costo: 4200 },
    { name: 'Proyecto B', presupuesto: 3000, costo: 2800 },
    { name: 'Proyecto C', presupuesto: 4500, costo: 4100 },
    { name: 'Proyecto D', presupuesto: 2000, costo: 1900 },
  ];

  const horasData = [
    { name: 'Lunes', horas: 8 },
    { name: 'Martes', horas: 9 },
    { name: 'Miércoles', horas: 7 },
    { name: 'Jueves', horas: 8 },
    { name: 'Viernes', horas: 6 },
  ];

  const estadoData = [
    { name: 'Activos', value: 5 },
    { name: 'Completados', value: 3 },
    { name: 'Pausados', value: 2 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">Análisis y exportación de datos</p>
        </div>
        <div className="flex gap-2">
          <Select
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'pdf', label: 'PDF' },
              { value: 'xlsx', label: 'Excel' },
            ]}
            placeholder="Formato"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          />
          <Button onClick={handleExport}>Exportar</Button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Total Presupuestado</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ${proyectos.reduce((sum: number, p: Proyecto) => sum + (p.presupuesto_total || 0), 0)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Proyectos Activos</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {proyectos.filter((p: Proyecto) => p.estado === 'Activo').length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Proyectos Completados</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {proyectos.filter((p: Proyecto) => p.estado === 'Completado').length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-gray-600 text-sm font-medium">Tasa Completitud</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {proyectos.length > 0
                ? Math.round(
                    (proyectos.filter((p: Proyecto) => p.estado === 'Completado').length /
                      proyectos.length) *
                      100
                  )
                : 0}
              %
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Costo vs Presupuesto */}
        <Card>
          <CardHeader title="Costo vs Presupuesto" />
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costVsBudgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="presupuesto" fill="#3b82f6" name="Presupuesto" />
                <Bar dataKey="costo" fill="#ef4444" name="Costo" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Horas por Día */}
        <Card>
          <CardHeader title="Horas Trabajadas" />
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={horasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="horas" fill="#10b981" name="Horas" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Estado de Proyectos */}
        <Card>
          <CardHeader title="Distribución por Estado" />
          <CardBody className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={estadoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {estadoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Resumen de Proyectos */}
        <Card>
          <CardHeader title="Top Proyectos por Presupuesto" />
          <CardBody>
            <div className="space-y-3">
              {Array.isArray(proyectos) &&
                proyectos
                  .sort((a: Proyecto, b: Proyecto) => b.presupuesto_total - a.presupuesto_total)
                  .slice(0, 5)
                  .map((proyecto: Proyecto) => (
                    <div key={proyecto.id_proyecto} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{proyecto.nombre}</span>
                      <span className="text-sm font-bold text-blue-600">
                        ${proyecto.presupuesto_total}
                      </span>
                    </div>
                  ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabla de Historial */}
      <Card>
        <CardHeader title="Historial de Proyectos" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Proyecto</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Presupuesto</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Estado</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Progreso</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(proyectos) &&
                  proyectos.map((proyecto: Proyecto) => (
                    <tr
                      key={proyecto.id_proyecto}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">{proyecto.nombre}</td>
                      <td className="px-4 py-3">${proyecto.presupuesto_total}</td>
                      <td className="px-4 py-3">{proyecto.estado}</td>
                      <td className="px-4 py-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.random() * 100}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
