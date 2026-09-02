import { Router } from "../Dependencies/dependencias.ts";
import { descargarArchivo } from "../Controller/archivo.controller.ts";
import { verificarAutenticacion, verificarTecnico } from "../Middlewares/auth.middleware.ts";

const archivoTecnicoRouter = new Router();

archivoTecnicoRouter.get(
  "/api/archivos/:id/descargar",
  verificarAutenticacion,
  verificarTecnico,
  descargarArchivo,
);

export default archivoTecnicoRouter;