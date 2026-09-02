import { SMTPClient } from "../Dependencies/dependencias.ts";

function crearCliente() {
  return new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com",
      port: Number(Deno.env.get("SMTP_PORT") ?? "465"),
      tls: true,
      auth: {
        username: Deno.env.get("SMTP_USER") ?? "",
        password: Deno.env.get("SMTP_PASSWORD") ?? "",
      },
    },
  });
}

interface DatosCorreo {
  para: string;
  asunto: string;
  contenidoHtml: string;
}

async function enviarCorreo(datos: DatosCorreo): Promise<void> {
  const client = crearCliente();
  try {
    await client.send({
      from: Deno.env.get("SMTP_FROM") ?? Deno.env.get("SMTP_USER") ?? "",
      to: datos.para,
      subject: datos.asunto,
      html: datos.contenidoHtml,
    });
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
  } finally {
    await client.close();
  }
}

/** Se envía justo al registrarse. */
export async function correoBienvenida(datos: {
  para: string;
  nombres: string;
}): Promise<void> {
  await enviarCorreo({
    para: datos.para,
    asunto: "¡Bienvenido a Soporte Técnico!",
    contenidoHtml: `
      <p>Hola ${datos.nombres},</p>
      <p>Tu cuenta ha sido registrada correctamente en nuestro sistema de Soporte Técnico.</p>
      <p>Ya puedes iniciar sesión y crear tu primera solicitud cuando lo necesites.</p>
    `,
  });
}

/** Se envía justo al crear la solicitud. */
export async function correoSolicitudCreada(datos: {
  para: string;
  nombres: string;
  solicitudId: number;
  asunto: string;
}): Promise<void> {
  await enviarCorreo({
    para: datos.para,
    asunto: `Solicitud #${datos.solicitudId} registrada`,
    contenidoHtml: `
      <p>Hola ${datos.nombres},</p>
      <p>Su solicitud <strong>#${datos.solicitudId}</strong> ha sido registrada correctamente.</p>
      <p><strong>Asunto:</strong> ${datos.asunto}</p>
      <p>Un técnico la revisará según la prioridad asignada. Te avisaremos por este mismo correo cuando alguien la tome.</p>
    `,
  });
}

/** Se envía cuando un técnico se asigna la solicitud y da su diagnóstico. */
export async function correoSolicitudAsignada(datos: {
  para: string;
  nombres: string;
  solicitudId: number;
  diagnostico: string;
  tiempoEstimado: string;
  tecnicoNombre: string;
}): Promise<void> {
  await enviarCorreo({
    para: datos.para,
    asunto: `Solicitud #${datos.solicitudId} en proceso`,
    contenidoHtml: `
      <p>Hola ${datos.nombres},</p>
      <p>Su solicitud <strong>#${datos.solicitudId}</strong> ha cambiado al estado <strong>'en_proceso'</strong>.</p>
      <p><strong>Técnico asignado:</strong> ${datos.tecnicoNombre}</p>
      <p><strong>Diagnóstico:</strong> ${datos.diagnostico}</p>
      <p><strong>Tiempo estimado de reparación:</strong> ${datos.tiempoEstimado}</p>
      <p>Te avisaremos en cuanto quede resuelto.</p>
    `,
  });
}

/** Se envía cuando el técnico marca la solicitud como cerrada. */
export async function correoSolicitudCerrada(datos: {
  para: string;
  nombres: string;
  solicitudId: number;
}): Promise<void> {
  await enviarCorreo({
    para: datos.para,
    asunto: `Solicitud #${datos.solicitudId} solucionada`,
    contenidoHtml: `
      <p>Hola ${datos.nombres},</p>
      <p>Su solicitud <strong>#${datos.solicitudId}</strong> ha sido solucionada.</p>
      <p>Ya puede pasar a recoger su equipo (o lo solicitado) cuando le sea posible.</p>
    `,
  });
}

/** Se envía a todos los técnicos cuando llega una solicitud nueva. */
export async function correoNuevaSolicitudTecnico(datos: {
  para: string;
  nombresTecnico: string;
  solicitudId: number;
  asunto: string;
  prioridad: string;
  clienteNombre: string;
}): Promise<void> {
  await enviarCorreo({
    para: datos.para,
    asunto: `Nueva solicitud #${datos.solicitudId} — ${datos.asunto}`,
    contenidoHtml: `
      <p>Hola ${datos.nombresTecnico},</p>
      <p>Ha llegado una nueva solicitud de soporte técnico.</p>
      <p><strong>Solicitud:</strong> #${datos.solicitudId} — ${datos.asunto}</p>
      <p><strong>Cliente:</strong> ${datos.clienteNombre}</p>
      <p><strong>Prioridad:</strong> ${datos.prioridad}</p>
      <p>Ingresa al panel de técnico para revisarla y asignártela.</p>
    `,
  });
}