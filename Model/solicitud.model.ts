import client from "../Helpers/database.ts";
import type { SolicitudDetallada,EstadoSolicitud,ParametrosConsulta,RespuestaPaginada,} from "./interfaces.ts";
// Columnas permitidas para ordenar, para evitar inyección SQL vía ordenarPor
const COLUMNAS_ORDENABLES = new Set([
  "asunto",
  "prioridad",
  "estado",
  "fecha_creacion",
  "fecha_actualizacion",
]);

// Para ordenar por severidad real (baja < media < alta) y no alfabética
const ORDEN_PRIORIDAD_SQL = `FIELD(prioridad, 'baja', 'media', 'alta')`;

export class SolicitudModel {
  static async crear(datos: {
    usuarioId: number;
    asunto: string;
    descripcion: string;
    prioridad: "baja" | "media" | "alta";
  }): Promise<number> {
    const resultado = await client.execute(
      `INSERT INTO solicitudes (usuario_id, asunto, descripcion, prioridad)
       VALUES (?, ?, ?, ?)`,
      [datos.usuarioId, datos.asunto, datos.descripcion, datos.prioridad],
    );
    return resultado.lastInsertId!;
  }

  static async buscarPorId(id: number): Promise<SolicitudDetallada | null> {
    const filas = await client.query(
      `SELECT s.*,
              u.nombres AS usuario_nombres, u.apellidos AS usuario_apellidos, u.email AS usuario_email,
              t.nombres AS tecnico_nombres, t.apellidos AS tecnico_apellidos
       FROM solicitudes s
       JOIN usuarios u ON u.id = s.usuario_id
       LEFT JOIN usuarios t ON t.id = s.tecnico_id
       WHERE s.id = ?
       LIMIT 1`,
      [id],
    );
    return filas[0] ?? null;
  }

  /** Solicitudes creadas por un usuario específico. */
  static async listarPorUsuario(usuarioId: number): Promise<SolicitudDetallada[]> {
    return await client.query(
      `SELECT s.*,
              u.nombres AS usuario_nombres, u.apellidos AS usuario_apellidos, u.email AS usuario_email,
              t.nombres AS tecnico_nombres, t.apellidos AS tecnico_apellidos
       FROM solicitudes s
       JOIN usuarios u ON u.id = s.usuario_id
       LEFT JOIN usuarios t ON t.id = s.tecnico_id
       WHERE s.usuario_id = ?
       ORDER BY s.fecha_creacion DESC`,
      [usuarioId],
    );
  }

  /**
   * Listado general para el panel de técnico: búsqueda, filtro por estado
   * Y por prioridad (combinables), orden y paginación.
   */
  static async listar(
    params: ParametrosConsulta,
  ): Promise<RespuestaPaginada<SolicitudDetallada>> {
    const pagina = Math.max(1, params.pagina ?? 1);
    const limite = Math.min(100, Math.max(1, params.limite ?? 10));
    const offset = (pagina - 1) * limite;

    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (params.buscar) {
      condiciones.push("(s.asunto LIKE ? OR u.nombres LIKE ? OR u.apellidos LIKE ?)");
      valores.push(`%${params.buscar}%`, `%${params.buscar}%`, `%${params.buscar}%`);
    }
    if (params.estado) {
      condiciones.push("s.estado = ?");
      valores.push(params.estado);
    }
    if (params.prioridad) {
      condiciones.push("s.prioridad = ?");
      valores.push(params.prioridad);
    }

    const whereSQL = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

    let ordenSQL: string;
    if (params.ordenarPor === "prioridad") {
      ordenSQL = `${ORDEN_PRIORIDAD_SQL} ${params.orden === "DESC" ? "DESC" : "ASC"}`;
    } else {
      const columna = COLUMNAS_ORDENABLES.has(params.ordenarPor ?? "")
        ? params.ordenarPor
        : "fecha_creacion";
      ordenSQL = `s.${columna} ${params.orden === "ASC" ? "ASC" : "DESC"}`;
    }

    const filas: SolicitudDetallada[] = await client.query(
      `SELECT s.*,
              u.nombres AS usuario_nombres, u.apellidos AS usuario_apellidos, u.email AS usuario_email,
              t.nombres AS tecnico_nombres, t.apellidos AS tecnico_apellidos
       FROM solicitudes s
       JOIN usuarios u ON u.id = s.usuario_id
       LEFT JOIN usuarios t ON t.id = s.tecnico_id
       ${whereSQL}
       ORDER BY ${ordenSQL}
       LIMIT ? OFFSET ?`,
      [...valores, limite, offset],
    );

    const totalFilas = await client.query(
      `SELECT COUNT(*) AS total
       FROM solicitudes s JOIN usuarios u ON u.id = s.usuario_id
       ${whereSQL}`,
      valores,
    );
    const total = totalFilas[0].total;

    return {
      datos: filas,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite) || 1,
    };
  }

 /**
 * Un técnico se auto-asigna una solicitud sin dueño, dando su diagnóstico
 * y tiempo estimado en el mismo paso. WHERE tecnico_id IS NULL sigue
 * garantizando que solo el primer técnico que llega se queda con ella.
 */
static async asignarTecnico(
  solicitudId: number,
  tecnicoId: number,
  datos: { diagnostico: string; tiempoEstimado: string },
): Promise<boolean> {
  const resultado = await client.execute(
    `UPDATE solicitudes
     SET tecnico_id = ?, diagnostico = ?, tiempo_estimado = ?,
         estado = IF(estado = 'pendiente', 'en_proceso', estado)
     WHERE id = ? AND tecnico_id IS NULL`,
    [tecnicoId, datos.diagnostico, datos.tiempoEstimado, solicitudId],
  );
  return (resultado.affectedRows ?? 0) > 0;
}
  static async cambiarEstado(id: number, nuevoEstado: EstadoSolicitud): Promise<boolean> {
    const resultado = await client.execute(
      "UPDATE solicitudes SET estado = ? WHERE id = ?",
      [nuevoEstado, id],
    );
    return (resultado.affectedRows ?? 0) > 0;
  }
}