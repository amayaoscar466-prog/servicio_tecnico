import type { RouterContext } from "../Dependencies/dependencias.ts";
import { SolicitudModel } from "../Model/solicitud.model.ts";
import { ArchivoModel } from "../Model/archivo.model.ts";
import { guardarArchivo } from "../Helpers/upload.helper.ts";

/** POST /api/solicitudes/:id/archivos — el dueño de la solicitud adjunta un archivo */
export async function subirArchivo(ctx: RouterContext<"/api/solicitudes/:id/archivos">) {
  const solicitudId = Number(ctx.params.id);
  const usuario = ctx.state.usuario;

  const solicitud = await SolicitudModel.buscarPorId(solicitudId);
  if (!solicitud) {
    ctx.response.status = 404;
    ctx.response.body = { exito: false, mensaje: "Solicitud no encontrada" };
    return;
  }

  if (solicitud.usuario_id !== usuario.id) {
    ctx.response.status = 403;
    ctx.response.body = {
      exito: false,
      mensaje: "No puedes adjuntar archivos a una solicitud que no es tuya",
    };
    return;
  }

  const formData = await ctx.request.body.formData();
  const archivo = formData.get("archivo");

  if (!(archivo instanceof File)) {
    ctx.response.status = 400;
    ctx.response.body = {
      exito: false,
      mensaje: "Debes enviar un archivo en el campo 'archivo'",
    };
    return;
  }

  const guardado = await guardarArchivo(archivo);

  const nuevoId = await ArchivoModel.crear({
    solicitudId,
    nombre: guardado.nombreOriginal,
    ruta: guardado.rutaGuardada,
    tipo: guardado.tipo,
  });

  ctx.response.status = 201;
  ctx.response.body = {
    exito: true,
    mensaje: "Archivo adjuntado correctamente",
    datos: { id: nuevoId, nombre: guardado.nombreOriginal },
  };
}

/** GET /api/solicitudes/:id/archivos — el dueño o cualquier técnico */
export async function listarArchivos(ctx: RouterContext<"/api/solicitudes/:id/archivos">) {
  const solicitudId = Number(ctx.params.id);
  const usuario = ctx.state.usuario;

  const solicitud = await SolicitudModel.buscarPorId(solicitudId);
  if (!solicitud) {
    ctx.response.status = 404;
    ctx.response.body = { exito: false, mensaje: "Solicitud no encontrada" };
    return;
  }

  const esDueno = solicitud.usuario_id === usuario.id;
  const esTecnico = usuario.id_rol === 1;
  if (!esDueno && !esTecnico) {
    ctx.response.status = 403;
    ctx.response.body = { exito: false, mensaje: "No tienes acceso a esta solicitud" };
    return;
  }

  const archivos = await ArchivoModel.listarPorSolicitud(solicitudId);
  ctx.response.status = 200;
  ctx.response.body = { exito: true, datos: archivos };
}

/** GET /api/archivos/:id/descargar — solo técnicos */
export async function descargarArchivo(ctx: RouterContext<"/api/archivos/:id/descargar">) {
  const id = Number(ctx.params.id);
  const archivo = await ArchivoModel.buscarPorId(id);

  if (!archivo) {
    ctx.response.status = 404;
    ctx.response.body = { exito: false, mensaje: "Archivo no encontrado" };
    return;
  }

  try {
    const contenido = await Deno.readFile(archivo.ruta);
    ctx.response.status = 200;
    ctx.response.headers.set("Content-Type", archivo.tipo);
    ctx.response.headers.set("Content-Disposition", `attachment; filename="${archivo.nombre}"`);
    ctx.response.body = contenido;
  } catch {
    ctx.response.status = 404;
    ctx.response.body = { exito: false, mensaje: "El archivo ya no existe en el servidor" };
  }
}