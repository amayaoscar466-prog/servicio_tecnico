export type Rol = "usuario" | "tecnico";

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  rol: Rol;
  created_at?: string;
  updated_at?: string;
}

export type UsuarioPublico = Omit<Usuario, "password">;

export type Prioridad = "baja" | "media" | "alta";
export type EstadoSolicitud = "pendiente" | "en_proceso" | "cerrada";

export interface Solicitud {
  id: number;
  usuario_id: number;
  tecnico_id: number | null;
  asunto: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoSolicitud;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface SolicitudDetallada extends Solicitud {
  usuario_nombres: string;
  usuario_apellidos: string;
  usuario_email: string;
  tecnico_nombres: string | null;
  tecnico_apellidos: string | null;
}

export interface Archivo {
  id: number;
  solicitud_id: number;
  nombre: string;
  ruta: string;
  tipo: string;
  fecha: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  rol: Rol;
}

export interface ParametrosConsulta {
  pagina?: number;
  limite?: number;
  buscar?: string;
  ordenarPor?: string;
  orden?: "ASC" | "DESC";
  estado?: string;
  prioridad?: string;
}

export interface RespuestaPaginada<T> {
  datos: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}