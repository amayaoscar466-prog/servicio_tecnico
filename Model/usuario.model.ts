import client from "../Helpers/database.ts";
import type { Usuario, UsuarioPublico } from "./interfaces.ts";

export class UsuarioModel {
  static async crear(datos: {
    nombres: string;
    apellidos: string;
    email: string;
    passwordHash: string;
    rol?: "usuario" | "tecnico";
  }): Promise<number> {
    const resultado = await client.execute(
      `INSERT INTO usuarios (nombres, apellidos, email, password, rol)
       VALUES (?, ?, ?, ?, ?)`,
      [
        datos.nombres,
        datos.apellidos,
        datos.email,
        datos.passwordHash,
        datos.rol ?? "usuario",
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

  static async buscarPorId(id: number): Promise<UsuarioPublico | null> {
    const filas = await client.query(
      `SELECT id, nombres, apellidos, email, rol, created_at, updated_at
       FROM usuarios WHERE id = ? LIMIT 1`,
      [id],
    );
    return filas[0] ?? null;
  }
}