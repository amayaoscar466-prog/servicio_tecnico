import { Router } from "../Dependencies/dependencias.ts";
import { subirArchivo, listarArchivos } from "../Controller/archivo.controller.ts";
import { verificarAutenticacion } from "../Middlewares/auth.middleware.ts";

const archivoUsuarioRouter = new Router();

archivoUsuarioRouter.post(
  "/api/solicitudes/:id/archivos",
  verificarAutenticacion,
  subirArchivo,
);
archivoUsuarioRouter.get(
  "/api/solicitudes/:id/archivos",
  verificarAutenticacion,
  listarArchivos,
);

export default archivoUsuarioRouter;