import { Router } from "../Dependencies/dependencias.ts";
import {listarSolicitudes,asignarSolicitud,cambiarEstadoSolicitud,} from "../Controller/solicitud.tecnico.controller.ts";
import { verificarAutenticacion, verificarTecnico } from "../Middlewares/auth.middleware.ts";

const solicitudTecnicoRouter = new Router();

// Solo técnicos
solicitudTecnicoRouter.get(
  "/api/solicitudes",
  verificarAutenticacion,
  verificarTecnico,
  listarSolicitudes,
);
solicitudTecnicoRouter.patch(
  "/api/solicitudes/:id/asignar",
  verificarAutenticacion,
  verificarTecnico,
  asignarSolicitud,
);
solicitudTecnicoRouter.patch(
  "/api/solicitudes/:id/estado",
  verificarAutenticacion,
  verificarTecnico,
  cambiarEstadoSolicitud,
);

export default solicitudTecnicoRouter;