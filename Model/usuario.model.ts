import client from "../Helpers/database.ts";
import type { Usuario, UsuarioPublico } from "./interfaces.ts";

export class UsuarioModel {
  static async crear(datos: {
    nombres: string;
    apellidos: string;
    email: string;
    passwordHash: string;
    id_rol?: number;
  }): Promise<number> {
    const resultado = await client.execute(
      `INSERT INTO usuarios (nombres, apellidos, email, password, id_rol)
       VALUES (?, ?, ?, ?, ?)`,
      [
        datos.nombres,
        datos.apellidos,
        datos.email,
        datos.passwordHash,
        datos.id_rol,
      ],
    );
    return resultado.lastInsertId!;
  }

  static async buscarPorEmail(email: string): Promise<Usuario | null> {
    const filas = await client.query("SELECT * FROM usuarios WHERE email = ? LIMIT 1", [
      email,
    ]);
    return filas[0] ?? null;
  }
  
  static async listarTecnicos(): Promise<{ nombres: string; email: string }[]> {
  const filas = await client.query(
    "SELECT nombres, email FROM usuarios WHERE id_rol = 1",
  );
  return filas;
}

  static async buscarPorId(id: number): Promise<UsuarioPublico | null> {
    const filas = await client.query(
      `SELECT id, nombres, apellidos, email, id_rol, created_at, updated_at
       FROM usuarios WHERE id = ? LIMIT 1`,
      [id],
    );
    return filas[0] ?? null;
  }
  static async listarTodos(): Promise<UsuarioPublico[]> {
  const filas = await client.query(
    `SELECT id, nombres, apellidos, email, id_rol, created_at, updated_at
     FROM usuarios ORDER BY id DESC`,
  );
  return filas;
}

static async actualizar(
  id: number,
  datos: { nombres: string; apellidos: string; email: string; id_rol: number },
): Promise<void> {
  await client.execute(
    `UPDATE usuarios SET nombres = ?, apellidos = ?, email = ?, id_rol = ?
     WHERE id = ?`,
    [datos.nombres, datos.apellidos, datos.email, datos.id_rol, id],
  );
}

static async eliminar(id: number): Promise<void> {
  await client.execute("DELETE FROM usuarios WHERE id = ?", [id]);
}

}