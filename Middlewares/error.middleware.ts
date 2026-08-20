import type { Context, Next } from "../Dependencies/dependencias.ts";

export async function manejadorErrores(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error("❌ Error no controlado:", error);

    const err = error as { status?: number; message?: string; code?: string };

    if (err.code === "ER_DUP_ENTRY") {
      ctx.response.status = 409;
      ctx.response.body = {
        exito: false,
        mensaje: "El registro ya existe (dato duplicado)",
      };
      return;
    }

    ctx.response.status = err.status ?? 500;
    ctx.response.body = {
      exito: false,
      mensaje: err.message ?? "Error interno del servidor",
    };
  }
}

export function rutaNoEncontrada(ctx: Context) {
  ctx.response.status = 404;
  ctx.response.body = {
    exito: false,
    mensaje: `Ruta no encontrada: ${ctx.request.method} ${ctx.request.url.pathname}`,
  };
}