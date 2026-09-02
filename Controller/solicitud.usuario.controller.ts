import type { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { SolicitudModel } from "../Model/solicitud.model.ts";
import { UsuarioModel } from "../Model/usuario.model.ts";
import { correoSolicitudCreada, correoNuevaSolicitudTecnico } from "../Helpers/mailer.helper.ts";

const esquemaCrearSolicitud = z.object({
  asunto: z.string().min(3, "El asunto debe tener al menos 3 caracteres"),
  descripcion: z.string().min(10, "Describe el problema con al menos 10 caracteres"),
  prioridad: z.enum(["baja", "media", "alta"]).optional(),
});

/** POST /api/solicitudes — cualquier usuario autenticado crea una solicitud */
export async function crearSolicitud(ctx: Context) {
  const body = await ctx.request.body.json();
  const resultado = esquemaCrearSolicitud.safeParse(body);

  if (!resultado.success) {
    ctx.response.status = 400;
    ctx.response.body = {
      exito: false,
      mensaje: "Datos inválidos",
      errores: resultado.error.flatten().fieldErrors,
    };
    return;
  }

  const usuario = ctx.state.usuario;
  const { asunto, descripcion, prioridad } = resultado.data;

  const nuevoId = await SolicitudModel.crear({
    usuarioId: usuario.id,
    asunto,
    descripcion,
    prioridad: prioridad ?? "media",
  });

  // El JWT no trae "nombres", así que consultamos el usuario para
  // poder saludarlo por su nombre en el correo.
  const perfilUsuario = await UsuarioModel.buscarPorId(usuario.id);
  if (perfilUsuario) {
    correoSolicitudCreada({
      para: perfilUsuario.email,
      nombres: perfilUsuario.nombres,
      solicitudId: nuevoId,
      asunto,
    }); // sin await: no hacemos esperar la respuesta HTTP por el envío del correo
  }

  // Notificar a todos los técnicos registrados
  const tecnicos = await UsuarioModel.listarTecnicos();
  for (const tecnico of tecnicos) {
    correoNuevaSolicitudTecnico({
      para: tecnico.email,
      nombresTecnico: tecnico.nombres,
      solicitudId: nuevoId,
      asunto,
      prioridad: prioridad ?? "media",
      clienteNombre: perfilUsuario
        ? `${perfilUsuario.nombres} ${perfilUsuario.apellidos}`
        : "Cliente",
    }); // sin await, igual que el resto de correos
  }

  ctx.response.status = 201;
  ctx.response.body = {
    exito: true,
    mensaje: `Su solicitud #${nuevoId} ha sido registrada correctamente.`,
    datos: { id: nuevoId },
  };
}

/** GET /api/solicitudes/mias — el usuario ve solo las suyas */
export async function listarMisSolicitudes(ctx: Context) {
  const usuario = ctx.state.usuario;
  const solicitudes = await SolicitudModel.listarPorUsuario(usuario.id);

  ctx.response.status = 200;
  ctx.response.body = { exito: true, datos: solicitudes };
}

/** GET /api/solicitudes/:id — el dueño o cualquier técnico */
export async function verSolicitud(ctx: RouterContext<"/api/solicitudes/:id">) {
  const id = Number(ctx.params.id);
  const solicitud = await SolicitudModel.buscarPorId(id);

  if (!solicitud) {
    ctx.response.status = 404;
    ctx.response.body = { exito: false, mensaje: "Solicitud no encontrada" };
    return;
  }

  const usuario = ctx.state.usuario;
  const esDueno = solicitud.usuario_id === usuario.id;
  const esTecnico = usuario.id_rol === 1;

  if (!esDueno && !esTecnico) {
    ctx.response.status = 403;
    ctx.response.body = { exito: false, mensaje: "No tienes acceso a esta solicitud" };
    return;
  }

  ctx.response.status = 200;
  ctx.response.body = { exito: true, datos: solicitud };
}