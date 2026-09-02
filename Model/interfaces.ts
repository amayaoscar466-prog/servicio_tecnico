export type Rol = 1 | 2 | 3 // 1 = técnico, 2 = usuario , 3 = admin

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  id_rol: Rol;
  created_at?: string;
  updated_at?: string;
}

export type UsuarioPublico = Omit<Usuario, "password">;

// ... (Solicitud, SolicitudDetallada, Archivo sin cambios)

export interface JwtPayload {
  id: number;
  email: string;
  id_rol: Rol;
}