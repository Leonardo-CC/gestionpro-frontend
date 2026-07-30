import axios, { AxiosInstance, AxiosError } from 'axios';

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://gestion-de-proyectos-j6ax.onrender.com';
    this.api = axios.create({
      baseURL: `${this.baseURL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token en cada petición
    this.api.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para manejar sesión expirada
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== USUARIOS ====================
  async getUsuarios() {
    const response = await this.api.get('/usuarios/');
    return response.data;
  }

  async getUsuario(id: string | number) {
    const response = await this.api.get(`/usuarios/${id}/`);
    return response.data;
  }

  async getUsuarioById(idUsuario: number | string) {
    const response = await this.api.get(`/usuarios/${idUsuario}/`);
    return response.data;
  }

  async updateUsuario(id: string | number, data: any) {
    const response = await this.api.patch(`/usuarios/${id}/`, data);
    return response.data;
  }

  async updateTarifaHora(id: string | number, tarifaHora: number) {
    const response = await this.api.patch(`/usuarios/${id}/`, { tarifa_hora: tarifaHora });
    return response.data;
  }

  async createUsuario(data: any) {
    const response = await this.api.post('/usuarios/', data);
    return response.data;
  }

  async getPerfil() {
    if (typeof window === 'undefined') return {};

    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        return await this.getUsuarioById(userId);
      } catch (e) {
        console.warn('No se pudo obtener el usuario por ID, buscando en lista...');
      }
    }

    // Si no tenemos el ID, buscamos por el token o email
    const usuarios = await this.getUsuarios();
    const token = localStorage.getItem('authToken');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userEmail = payload.email || payload.user_id;
        const userFound = Array.isArray(usuarios) 
          ? usuarios.find((u: any) => u.email === userEmail || u.id_usuario === userEmail)
          : null;
        if (userFound) return userFound;
      } catch (e) {
        console.error('Error al decodificar token:', e);
      }
    }

    return Array.isArray(usuarios) ? usuarios[0] : {};
  }

  // 💡 NUEVO MÉTODO: Actualizar perfil del usuario autenticado
  async updatePerfil(data: { nombre?: string; password?: string; [key: string]: any }) {
    if (typeof window === 'undefined') throw new Error('No disponible en servidor');

    // 1. Obtener perfil para conocer el id_usuario actual
    const perfilActual = await this.getPerfil();
    const idUsuario = perfilActual?.id_usuario || localStorage.getItem('userId');

    if (!idUsuario) {
      throw new Error('No se pudo determinar el ID del usuario en sesión.');
    }

    // 2. Mapear 'password' si viene del formulario
    const payload: any = { ...data };
    if (payload.password) {
      payload.password = payload.password;
    }

    // 3. Enviar actualización vía PATCH a Django
    const response = await this.api.patch(`/usuarios/${idUsuario}/`, payload);
    return response.data;
  }

  // ==================== PROYECTOS ====================
  async getProyectos() {
    const response = await this.api.get('/proyectos/');
    return response.data;
  }

  async getProyectosAccesiblesCompleto() {
    try {
      if (typeof window === 'undefined') return [];
      
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      if (!userId) return [];

      // Get all projects
      const allProyectos = await this.getProyectos();
      
      // If admin, show all projects
      if (userRole === 'Administrador') {
        return allProyectos;
      }

      if (!Array.isArray(allProyectos)) return [];

      // If Gerente_Proyecto or Miembro, filter by:
      // 1. Projects where they are the manager (id_gerente)
      // 2. Projects where they have tasks assigned
      const tareas = await this.getTareas();
      const asignaciones = await this.getAsignaciones();

      const projectIdsFromTasks = new Set<number>();
      
      if (Array.isArray(asignaciones)) {
        asignaciones.forEach((asignacion: any) => {
          if (String(asignacion.usuario_id || asignacion.usuario) === String(userId)) {
            const tareaAsignada = tareas.find((t: any) => 
              Number(t.id_tarea) === Number(asignacion.tarea_id || asignacion.tarea)
            );
            if (tareaAsignada) {
              projectIdsFromTasks.add(Number(tareaAsignada.id_proyecto));
            }
          }
        });
      }

      // Filter projects: manager OR has task assignment
      return allProyectos.filter((proyecto: any) => {
        const isManager = String(proyecto.id_gerente) === String(userId);
        const hasTaskAssignment = projectIdsFromTasks.has(Number(proyecto.id_proyecto));
        return isManager || hasTaskAssignment;
      });
    } catch (error) {
      console.error('Error fetching accessible projects:', error);
      return [];
    }
  }

  async getProyectosAccesibles() {
    // Alias para compatibilidad hacia atrás
    return this.getProyectosAccesiblesCompleto();
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

  // ==================== TAREAS ====================
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

  // ==================== ASIGNACIONES ====================
  async getAsignaciones(tareaId?: number) {
    const params = tareaId ? { tarea: tareaId } : {};
    const response = await this.api.get('/asignaciones/', { params });
    return response.data;
  }

  async createAsignacion(data: any) {
    // 🎯 Mapeo inteligente para asegurar que Django reciba 'tarea' y 'usuario'
    const payload = {
      tarea: Number(data.tarea || data.id_tarea || data.tarea_id),
      usuario: String(data.usuario || data.id_usuario || data.usuario_id || data.usuario_asignado || ''),
      horas_planificadas: Number(data.horas_planificadas || data.horas_estimadas || 0)
    };

    // Si falta alguno de los campos clave, cancelamos el envío para evitar el 400
    if (!payload.tarea || !payload.usuario || payload.usuario === 'null' || payload.usuario === 'undefined') {
      console.warn('[ApiService] Payload de asignación incompleto:', payload);
      return null;
    }

    const response = await this.api.post('/asignaciones/', payload);
    return response.data;
  }

  async updateAsignacion(id: number, data: any) {
    const payload = {
      tarea: Number(data.tarea || data.id_tarea || data.tarea_id),
      usuario: String(data.usuario || data.id_usuario || data.usuario_id || data.usuario_asignado || ''),
      horas_planificadas: Number(data.horas_planificadas || 0)
    };

    const response = await this.api.patch(`/asignaciones/${id}/`, payload);
    return response.data;
  }

  async deleteAsignacion(id: number) {
    await this.api.delete(`/asignaciones/${id}/`);
  }
  
  // ==================== REGISTRO DE HORAS ====================
  async getRegistroHoras(tareaId?: number) {
    const params = tareaId ? { tarea: tareaId } : {};
    const response = await this.api.get('/registro-horas/', { params });
    return response.data;
  }

  async createRegistroHoras(data: any) {
    // Validar datos requeridos
    const tareaId = Number(data.id_tarea || data.tarea);
    const horas = Number(data.horas_trabajadas || data.horas || 0);
    const fecha = data.fecha || new Date().toISOString().split('T')[0];
    const comentario = String(data.comentario || '').trim();

    if (!tareaId || tareaId <= 0) {
      throw new Error('ID de tarea inválido para registro de horas');
    }
    if (horas <= 0) {
      throw new Error('Las horas deben ser mayor a 0');
    }

    // Payload limpio - solo campos que Django espera
    const payload = {
      tarea: tareaId,
      horas_trabajadas: horas,
      fecha: fecha,
      comentario: comentario,
    };

    const response = await this.api.post('/registro-horas/', payload);
    return response.data;
  }

  async updateRegistroHoras(id: number, data: any) {
    const response = await this.api.patch(`/registro-horas/${id}/`, data);
    return response.data;
  }

  async deleteRegistroHoras(id: number) {
    await this.api.delete(`/registro-horas/${id}/`);
  }

  // ==================== COMENTARIOS ====================
  async getComentarios(tareaId: number) {
    const response = await this.api.get('/comentarios/', { params: { tarea: tareaId } });
    return response.data;
  }

  async createComentario(data: any) {
    // Validar que tenemos ID de tarea y texto
    const tareaId = Number(data.id_tarea || data.tarea || data.tarea_id);
    const texto = String(data.texto_comentario || data.comentario || data.texto || '').trim();

    if (!tareaId || tareaId <= 0) {
      throw new Error('ID de tarea inválido');
    }
    if (!texto) {
      throw new Error('El comentario no puede estar vacío');
    }

    // Payload limpio - solo campos que Django espera
    const payload = {
      id_tarea: tareaId,
      texto_comentario: texto,
    };

    const response = await this.api.post('/comentarios/', payload);
    return response.data;
  }

  async deleteComentario(id: number) {
    await this.api.delete(`/comentarios/${id}/`);
  }

  // ==================== ARCHIVOS ====================
  async getArchivos(tareaId: number) {
    const response = await this.api.get('/archivos/', { params: { tarea: tareaId } });
    return response.data;
  }

  async uploadArchivo(tareaId: number, file: File) {
    // Validación básica
    if (!file || file.size === 0) {
      throw new Error('El archivo no puede estar vacío');
    }
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('El archivo es demasiado grande (máximo 50MB)');
    }
    if (!tareaId || tareaId <= 0) {
      throw new Error('ID de tarea inválido para archivo');
    }

    const formData = new FormData();
    formData.append('id_tarea', tareaId.toString());
    formData.append('archivo', file);
    
    // IMPORTANTE: No establecer Content-Type header - dejar que axios lo maneje con el boundary correcto
    const response = await this.api.post('/archivos/', formData);
    return response.data;
  }

  async deleteArchivo(id: number) {
    await this.api.delete(`/archivos/${id}/`);
  }

  // ==================== HISTORIAL Y AUDITORÍA ====================
  async getHistorialPresupuesto(proyectoId?: number) {
    const params = proyectoId ? { proyecto: proyectoId } : {};
    const response = await this.api.get('/historial-presupuesto/', { params });
    return response.data;
  }

  async getLogs(params?: any) {
    const response = await this.api.get('/logs-auditoria/', { params });
    return response.data;
  }
}

export default new ApiService();
