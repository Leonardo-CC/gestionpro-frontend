// Enums
export enum UserRole {
  ADMIN = 'Administrador',
  PROJECT_MANAGER = 'Gerente_Proyecto',
  TEAM_MEMBER = 'Miembro_Equipo',
  EXECUTIVE = 'Ejecutivo',
}

export enum ProjectStatus {
  ACTIVE = 'Activo',
  PAUSED = 'Pausado',
  COMPLETED = 'Completado',
  ARCHIVED = 'Archivado',
}

export enum TaskStatus {
  TODO = 'Por_hacer',
  IN_PROGRESS = 'En_progreso',
  IN_REVIEW = 'En_revision',
  COMPLETED = 'Completada',
}

export enum TaskPriority {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
}

// User Types
export interface Usuario {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: UserRole | string;
  tarifa_hora: number;
  activo: boolean;
  fecha_creacion: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

// Project Types
export interface Proyecto {
  id_proyecto: number;
  nombre: string;
  descripcion: string;
  presupuesto_total: number;
  estado: ProjectStatus | string;
  fecha_inicio: string;
  fecha_fin: string;
  id_gerente: string;
  fecha_creacion: string;
}

// Task Types
export interface Tarea {
  id_tarea: number;
  id_proyecto: number;
  id_tarea_padre?: number;
  titulo: string;
  descripcion: string;
  prioridad: TaskPriority | string;
  estado: TaskStatus | string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  horas_estimadas: number;
  fecha_creacion: string;
  tarea_predecesora_id?: number;
}

// Assignment Types
export interface Asignacion {
  id: number;
  tarea_id: number;
  usuario_id: string;
  horas_planificadas: number;
}

// Hours Registry
export interface RegistroHoras {
  id_registro: number;
  id_tarea: number;
  id_usuario: string;
  fecha: string;
  horas_trabajadas: number;
  comentario: string;
  fecha_creacion: string;
}

// Comments
export interface Comentario {
  id_comentario: number;
  id_tarea: number;
  id_usuario: string;
  texto_comentario: string;
  fecha_creacion: string;
}

// Files
export interface Archivo {
  id_archivo: number;
  id_tarea: number;
  id_usuario: string;
  url_archivo: string;
  nombre_archivo: string;
  fecha_subida: string;
}

// Budget History
export interface HistorialPresupuesto {
  id: number;
  proyecto_id: number;
  monto_anterior: number;
  monto_nuevo: number;
  usuario_id: string;
  fecha: string;
}

// Audit Logs
export interface LogAuditoria {
  id_log: number;
  id_usuario: string;
  entidad: string;
  id_entidad: number;
  accion: string;
  detalle: string;
  fecha_hora: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Form State
export interface FormState {
  loading: boolean;
  error: string | null;
  success: boolean;
}
