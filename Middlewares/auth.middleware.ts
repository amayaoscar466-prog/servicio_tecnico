import type { Context, Next } from "../Dependencies/dependencias.ts";
import { verificarToken } from "../Helpers/jwt.helper.ts";

export async function verificarAutenticacion(ctx: Context, next: Next) {
  const authHeader = ctx.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = {
      exito: false,
      mensaje: "Token no proporcionado. Usa el header Authorization: Bearer <token>",
    };
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verificarToken(token);
    ctx.state.usuario = payload;
    await next();
  } catch {
    ctx.response.status = 401;
    ctx.response.body = { exito: false, mensaje: "Token inválido o expirado" };
  }
}

export async function verificarTecnico(ctx: Context, next: Next) {
  const usuario = ctx.state.usuario;

  if (!usuario || usuario.rol !== "tecnico") {
    ctx.response.status = 403;
    ctx.response.body = {
      exito: false,
      mensaje: "Acceso denegado: se requiere rol de técnico",
    };
    return;
  }

  await next();
}