import type { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { UsuarioModel } from "../Model/usuario.model.ts";

const esquemaActualizarUsuario = z.object({
  nombres: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellidos: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  id_rol: z.number().refine((v) => [1, 2, 3].includes(v), "Rol inválido"),
});

/** GET /api/admin/usuarios — solo admin */
export async function listarUsuarios(ctx: Context) {
  const usuarios = await UsuarioModel.listarTodos();
  ctx.response.status = 200;
  ctx.response.body = { exito: true, datos: usuarios };
}

/** PUT /api/admin/usuarios/:id — solo admin */
export async function actualizarUsuario(ctx: RouterContext<"/api/admin/usuarios/:id">) {
  const id = Number(ctx.params.id);
  const body = await ctx.request.body.json();
  const resultado = esquemaActualizarUsuario.safeParse(body);

  if (!resultado.success) {
    ctx.response.status = 400;
    ctx.response.body = {
      exito: false,
      mensaje: "Datos inválidos",
      errores: resultado.error.flatten().fieldErrors,
    };
    return;
  }

  await UsuarioModel.actualizar(id, resultado.data);

  ctx.response.status = 200;
  ctx.response.body = { exito: true, mensaje: "Usuario actualizado correctamente" };
}

/** DELETE /api/admin/usuarios/:id — solo admin */
export async function eliminarUsuario(ctx: RouterContext<"/api/admin/usuarios/:id">) {
  const id = Number(ctx.params.id);
  const usuarioActual = ctx.state.usuario;

  if (id === usuarioActual.id) {
    ctx.response.status = 400;
    ctx.response.body = { exito: false, mensaje: "No puedes eliminar tu propia cuenta" };
    return;
  }

  await UsuarioModel.eliminar(id);

  ctx.response.status = 200;
  ctx.response.body = { exito: true, mensaje: "Usuario eliminado correctamente" };
}