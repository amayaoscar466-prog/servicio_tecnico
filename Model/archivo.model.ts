import client from "../Helpers/database.ts";
import type { Archivo } from "./interfaces.ts";

export class ArchivoModel {
  static async crear(datos: {
    solicitudId: number;
    nombre: string;
    ruta: string;
    tipo: string;
  }): Promise<number> {
    const resultado = await client.execute(
      `INSERT INTO archivos (solicitud_id, nombre, ruta, tipo)
       VALUES (?, ?, ?, ?)`,
      [datos.solicitudId, datos.nombre, datos.ruta, datos.tipo],
    );
    return resultado.lastInsertId!;
  }

  /** Una solicitud puede tener varios adjuntos. */
  static async listarPorSolicitud(solicitudId: number): Promise<Archivo[]> {
    return await client.query(
      "SELECT * FROM archivos WHERE solicitud_id = ? ORDER BY fecha DESC",
      [solicitudId],
    );
  }

  static async buscarPorId(id: number): Promise<Archivo | null> {
    const filas = await client.query("SELECT * FROM archivos WHERE id = ? LIMIT 1", [id]);
    return filas[0] ?? null;
  }
}