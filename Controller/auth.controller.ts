import type { Context } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { UsuarioModel } from "../Model/usuario.model.ts";
import { hashPassword, compararPassword } from "../Helpers/password.helper.ts";
import { generarToken } from "../Helpers/jwt.helper.ts";
import { correoBienvenida } from "../Helpers/mailer.helper.ts";

const esquemaRegistro = z.object({
  nombres: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellidos: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  id_rol: z.number().default(2),
});

const esquemaLogin = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function registrar(ctx: Context) {
  const body = await ctx.request.body.json();
  const resultado = esquemaRegistro.safeParse(body);

  if (!resultado.success) {
    ctx.response.status = 400;
    ctx.response.body = {
      exito: false,
      mensaje: "Datos inválidos",
      errores: resultado.error.flatten().fieldErrors,
    };
    return;
  }

  const { nombres, apellidos, email, password, id_rol } = resultado.data;

  const existente = await UsuarioModel.buscarPorEmail(email);
  if (existente) {
    ctx.response.status = 409;
    ctx.response.body = { exito: false, mensaje: "Ese email ya está registrado" };
    return;
  }

  const passwordHash = await hashPassword(password);
  const nuevoId = await UsuarioModel.crear({ nombres, apellidos, email, passwordHash, id_rol });

  correoBienvenida({ para: email, nombres }); // sin await, igual que en el resto del código

  ctx.response.status = 201;
  ctx.response.status = 201;
  ctx.response.body = {
    exito: true,
    mensaje: "Usuario registrado correctamente",
    datos: { id: nuevoId, nombres, apellidos, email },
  };
}

export async function iniciarSesion(ctx: Context) {
  const body = await ctx.request.body.json();
  const resultado = esquemaLogin.safeParse(body);

  if (!resultado.success) {
    ctx.response.status = 400;
    ctx.response.body = {
      exito: false,
      mensaje: "Datos inválidos",
      errores: resultado.error.flatten().fieldErrors,
    };
    return;
  }

  const { email, password } = resultado.data;

  const usuario = await UsuarioModel.buscarPorEmail(email);
  if (!usuario) {
    ctx.response.status = 401;
    ctx.response.body = { exito: false, mensaje: "Credenciales inválidas" };
    return;
  }

  const passwordValido = await compararPassword(password, usuario.password);
  if (!passwordValido) {
    ctx.response.status = 401;
    ctx.response.body = { exito: false, mensaje: "Credenciales inválidas" };
    return;
  }

  const token = await generarToken({ id: usuario.id, email: usuario.email, id_rol: usuario.id_rol });

  ctx.response.status = 200;
  ctx.response.body = {
  exito: true,
  mensaje: "Sesión iniciada correctamente",
  datos: {
    token,
    usuario: {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      id_rol: usuario.id_rol,   // antes: rol: usuario.id_rol
    },
  },
};
}

/**
 * GET /api/perfil
 * Ruta protegida de prueba: requiere Authorization: Bearer <token>
 * Devuelve los datos del usuario autenticado, leídos de la BD
 * (no solo del payload del token, para confirmar que sigue existiendo).
 */
export async function verPerfil(ctx: Context) {
  const usuarioToken = ctx.state.usuario;

  const usuario = await UsuarioModel.buscarPorId(usuarioToken.id);

  if (!usuario) {
    ctx.response.status = 404;
    ctx.response.body = { exito: false, mensaje: "Usuario no encontrado" };
    return;
  }

  ctx.response.status = 200;
  ctx.response.body = { exito: true, datos: usuario };
  
}
