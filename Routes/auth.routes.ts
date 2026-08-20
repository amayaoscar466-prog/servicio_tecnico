import { Router } from "../Dependencies/dependencias.ts";
import { registrar, iniciarSesion, verPerfil } from "../Controller/auth.controller.ts";
import { verificarAutenticacion } from "../Middlewares/auth.middleware.ts";

const authRouter = new Router();

authRouter.post("/api/registro", registrar);
authRouter.post("/api/login", iniciarSesion);
authRouter.get("/api/perfil", verificarAutenticacion, verPerfil);

export default authRouter;