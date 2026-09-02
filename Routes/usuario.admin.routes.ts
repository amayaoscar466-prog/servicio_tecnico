import { Router } from "../Dependencies/dependencias.ts";
import { listarUsuarios, actualizarUsuario, eliminarUsuario } from "../Controller/usuario.admin.controller.ts";
import { verificarAutenticacion, verificarAdmin } from "../Middlewares/auth.middleware.ts";

const usuarioAdminRouter = new Router();

usuarioAdminRouter.get(
  "/api/admin/usuarios",
  verificarAutenticacion,
  verificarAdmin,
  listarUsuarios,
);

usuarioAdminRouter.put(
  "/api/admin/usuarios/:id",
  verificarAutenticacion,
  verificarAdmin,
  actualizarUsuario,
);

usuarioAdminRouter.delete(
  "/api/admin/usuarios/:id",
  verificarAutenticacion,
  verificarAdmin,
  eliminarUsuario,
);

export default usuarioAdminRouter;