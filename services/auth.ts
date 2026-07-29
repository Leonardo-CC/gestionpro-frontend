import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre?: string;
  [key: string]: any;
}

export interface AuthResponse {
  access?: string;
  token?: string;
  refresh?: string;
  user?: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };
  [key: string]: any;
}

class AuthService {
  // Garantiza que la URL base nunca sea undefined en local
  private getApiUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gestion-de-proyectos-j6ax.onrender.com';
    return baseUrl.replace(/\/$/, ''); // Quita barra final si existe
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Credenciales inválidas');
      }

      const data: AuthResponse = await response.json();
      
      const token = data.access || data.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', String(data.user.id));
        localStorage.setItem('userName', data.user.nombre);
        localStorage.setItem('userRole', data.user.rol);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: RegisterData) {
    try {
      const cleanData = {
        email: userData.email,
        password: userData.password,
        nombre: userData.nombre || 'Nuevo Usuario',
      };

      const response = await fetch(`${this.getApiUrl()}/api/auth/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || errorData.message || JSON.stringify(errorData) || 'Error en el registro';
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  getUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

export default new AuthService();