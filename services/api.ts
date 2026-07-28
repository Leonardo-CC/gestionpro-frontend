import axios, { AxiosInstance, AxiosError } from 'axios';

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    this.api = axios.create({
      baseURL: `${this.baseURL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token
    this.api.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Usuarios
  async getUsuarios() {
    const response = await this.api.get('/usuarios/');
    return response.data;
  }

  async getUsuario(id: string) {
    const response = await this.api.get(`/usuarios/${id}/`);
    return response.data;
  }

  async updateUsuario(id: string, data: any) {
    const response = await this.api.patch(`/usuarios/${id}/`, data);
    return response.data;
  }

  async updateTarifaHora(id: string, tarifaHora: number) {
    const response = await this.api.patch(`/usuarios/${id}/`, { tarifa_hora: tarifaHora });
    return response.data;
  }

  // Proyectos
  async getProyectos() {
    const response = await this.api.get('/proyectos/');
    return response.data;
  }

  async getProyecto(id: number) {
    const response = await this.api.get(`/proyectos/${id}/`);
    return response.data;
  }

  async createProyecto(data: any) {
    const response = await this.api.post('/proyectos/', data);
    return response.data;
  }

  async updateProyecto(id: number, data: any) {
    const response = await this.api.patch(`/proyectos/${id}/`, data);
    return response.data;
  }

  async deleteProyecto(id: number) {
    await this.api.delete(`/proyectos/${id}/`);
  }

  // Tareas
  async getTareas(proyectoId?: number) {
    const params = proyectoId ? { proyecto: proyectoId } : {};
    const response = await this.api.get('/tareas/', { params });
    return response.data;
  }

  async getTarea(id: number) {
    const response = await this.api.get(`/tareas/${id}/`);
    return response.data;
  }

  async createTarea(data: any) {
    const response = await this.api.post('/tareas/', data);
    return response.data;
  }

  async updateTarea(id: number, data: any) {
    const response = await this.api.patch(`/tareas/${id}/`, data);
    return response.data;
  }

  async deleteTarea(id: number) {
    await this.api.delete(`/tareas/${id}/`);
  }

  // Asignaciones
  async getAsignaciones(tareaId?: number) {
    const params = tareaId ? { tarea: tareaId } : {};
    const response = await this.api.get('/asignaciones/', { params });
    return response.data;
  }

  async createAsignacion(data: any) {
    const response = await this.api.post('/asignaciones/', data);
    return response.data;
  }

  async updateAsignacion(id: number, data: any) {
    const response = await this.api.patch(`/asignaciones/${id}/`, data);
    return response.data;
  }

  async deleteAsignacion(id: number) {
    await this.api.delete(`/asignaciones/${id}/`);
  }

  // Registro de Horas
  async getRegistroHoras(tareaId?: number) {
    const params = tareaId ? { tarea: tareaId } : {};
    const response = await this.api.get('/registro-horas/', { params });
    return response.data;
  }

  async createRegistroHoras(data: any) {
    const response = await this.api.post('/registro-horas/', data);
    return response.data;
  }

  async updateRegistroHoras(id: number, data: any) {
    const response = await this.api.patch(`/registro-horas/${id}/`, data);
    return response.data;
  }

  async deleteRegistroHoras(id: number) {
    await this.api.delete(`/registro-horas/${id}/`);
  }

  // Comentarios
  async getComentarios(tareaId: number) {
    const response = await this.api.get('/comentarios/', { params: { tarea: tareaId } });
    return response.data;
  }

  async createComentario(data: any) {
    const response = await this.api.post('/comentarios/', data);
    return response.data;
  }

  async deleteComentario(id: number) {
    await this.api.delete(`/comentarios/${id}/`);
  }

  // Archivos
  async getArchivos(tareaId: number) {
    const response = await this.api.get('/archivos/', { params: { tarea: tareaId } });
    return response.data;
  }

  async uploadArchivo(tareaId: number, file: File) {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tarea', tareaId.toString());
    
    const response = await this.api.post('/archivos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async deleteArchivo(id: number) {
    await this.api.delete(`/archivos/${id}/`);
  }

  // Historial de Presupuesto
  async getHistorialPresupuesto(proyectoId: number) {
    const response = await this.api.get('/historial-presupuesto/', {
      params: { proyecto: proyectoId },
    });
    return response.data;
  }

  // Logs de Auditoría
  async getLogs(params?: any) {
    const response = await this.api.get('/logs-auditoria/', { params });
    return response.data;
  }
}

export default new ApiService();
