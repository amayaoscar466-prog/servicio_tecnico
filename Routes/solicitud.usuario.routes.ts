import { Router } from "../Dependencies/dependencias.ts";
import { crearSolicitud,listarMisSolicitudes,verSolicitud} from "../Controller/solicitud.usuario.controller.ts";
import { verificarAutenticacion } from "../Middlewares/auth.middleware.ts";

const solicitudUsuarioRouter = new Router();

// Cualquier usuario autenticado (usuario o técnico)
solicitudUsuarioRouter.post("/api/solicitudes", verificarAutenticacion, crearSolicitud);
solicitudUsuarioRouter.get(
  "/api/solicitudes/mias",
  verificarAutenticacion,
  listarMisSolicitudes,
);
solicitudUsuarioRouter.get("/api/solicitudes/:id", verificarAutenticacion, verSolicitud);

export default solicitudUsuarioRouter;