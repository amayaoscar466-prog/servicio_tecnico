import type { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { SolicitudModel } from "../Model/solicitud.model.ts";
import { correoSolicitudAsignada, correoSolicitudCerrada } from "../Helpers/mailer.helper.ts";

const esquemaCambiarEstado = z.object({
  estado: z.enum(["pendiente", "en_proceso", "cerrada"]),
});

const esquemaAsignar = z.object({
  diagnostico: z.string().min(10, "El diagnóstico debe tener al menos 10 caracteres"),
  tiempoEstimado: z.string().min(2, "Indica el tiempo estimado, ej: '2 días'"),
});

export async function listarSolicitudes(ctx: Context) {
  const params = ctx.request.url.searchParams;

  const resultado = await SolicitudModel.listar({
    pagina: params.has("pagina") ? Number(params.get("pagina")) : undefined,
    limite: params.has("limite") ? Number(params.get("limite")) : undefined,
    buscar: params.get("buscar") ?? undefined,
    ordenarPor: params.get("ordenarPor") ?? undefined,
    orden:
      params.get("orden") === "ASC" ? "ASC" : params.get("orden") === "DESC" ? "DESC" : undefined,
    estado: params.get("estado") ?? undefined,
    prioridad: params.get("prioridad") ?? undefined,
  });

  ctx.response.status = 200;
  ctx.response.body = { exito: true, datos: resultado };
}

/** PATCH /api/solicitudes/:id/asignar — el técnico toma el ticket y da su diagnóstico */
export async function asignarSolicitud(ctx: RouterContext<"/api/solicitudes/:id/asignar">) {
  const body = await ctx.request.body.json();
  const resultado = esquemaAsignar.safeParse(body);

  if (!resultado.success) {
    ctx.response.status = 400;
    ctx.response.body = {
      exito: false,
      mensaje: "Datos inválidos",
      errores: resultado.error.flatten().fieldErrors,
    };
    return;
  }

  const id = Number(ctx.params.id);
  const usuario = ctx.state.usuario;
  const { diagnostico, tiempoEstimado } = resultado.data;

  const asignada = await SolicitudModel.asignarTecnico(id, usuario.id, {
    diagnostico,
    tiempoEstimado,
  });

  if (!asignada) {
    ctx.response.status = 409;
    ctx.response.body = {
      exito: false,
      mensaje: "La solicitud no existe o ya fue asignada a otro técnico",
    };
    return;
  }

  // Traemos el detalle completo (con datos del usuario y del técnico ya unidos)
  // para poder armar el correo sin hacer otra consulta adicional.
  const solicitud = await SolicitudModel.buscarPorId(id);
  if (solicitud) {
    correoSolicitudAsignada({
      para: solicitud.usuario_email,
      nombres: solicitud.usuario_nombres,
      solicitudId: id,
      diagnostico,
      tiempoEstimado,
      tecnicoNombre: `${solicitud.tecnico_nombres} ${solicitud.tecnico_apellidos}`,
    });
  }

  ctx.response.status = 200;
  ctx.response.body = { exito: true, mensaje: "Solicitud asignada correctamente" };
}

/** PATCH /api/solicitudes/:id/estado — el técnico asignado cambia el estado */
export async function cambiarEstadoSolicitud(ctx: RouterContext<"/api/solicitudes/:id/estado">) {
  const body = await ctx.request.body.json();
  const resultado = esquemaCambiarEstado.safeParse(body);

  if (!resultado.success) {
    ctx.response.status = 400;
    ctx.response.body = {
      exito: false,
      mensaje: "Datos inválidos",
      errores: resultado.error.flatten().fieldErrors,
    };
    return;
  }

  const id = Number(ctx.params.id);
  const { estado } = resultado.data;

  const actualizada = await SolicitudModel.cambiarEstado(id, estado);

  if (!actualizada) {
    ctx.response.status = 404;
    ctx.response.body = { exito: false, mensaje: "Solicitud no encontrada" };
    return;
  }

  // Solo mandamos el correo de "solucionada" cuando el nuevo estado es cerrada
  if (estado === "cerrada") {
    const solicitud = await SolicitudModel.buscarPorId(id);
    if (solicitud) {
      correoSolicitudCerrada({
        para: solicitud.usuario_email,
        nombres: solicitud.usuario_nombres,
        solicitudId: id,
      });
    }
  }

  ctx.response.status = 200;
  ctx.response.body = {
    exito: true,
    mensaje: `Su solicitud #${id} ha cambiado al estado '${estado}'.`,
  };
}