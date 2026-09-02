import { Application, Router, oakCors } from "./Dependencies/dependencias.ts";
import { verificarConexionDB } from "./Helpers/database.ts";
import { manejadorErrores, rutaNoEncontrada } from "./Middlewares/error.middleware.ts";
import authRouter from "./Routes/auth.routes.ts";
import solicitudUsuarioRouter from "./Routes/solicitud.usuario.routes.ts";
import solicitudTecnicoRouter from "./Routes/solicitud.tecnico.routes.ts";
import archivoUsuarioRouter from "./Routes/archivo.usuario.routes.ts";
import archivoTecnicoRouter from "./Routes/archivo.tecnico.routes.ts";
import usuarioAdminRouter from "./Routes/usuario.admin.routes.ts";

const app = new Application();
const router = new Router();

app.use(manejadorErrores);

app.use(
  oakCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

router.get("/api/health", (ctx) => {
  ctx.response.body = { exito: true, mensaje: "API de soporte técnico activa" };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

app.use(solicitudUsuarioRouter.routes());
app.use(solicitudUsuarioRouter.allowedMethods());

app.use(solicitudTecnicoRouter.routes());
app.use(solicitudTecnicoRouter.allowedMethods());

app.use(archivoUsuarioRouter.routes());
app.use(archivoUsuarioRouter.allowedMethods());

app.use(archivoTecnicoRouter.routes());
app.use(archivoTecnicoRouter.allowedMethods());

app.use(usuarioAdminRouter.routes());
app.use(usuarioAdminRouter.allowedMethods());

// rutaNoEncontrada SIEMPRE va después de TODOS los routers
app.use(rutaNoEncontrada);

const PORT = Number(Deno.env.get("PORT") ?? "8001");

await verificarConexionDB();

app.addEventListener("listen", () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// app.listen() va SIEMPRE al final del archivo — nada después de esto se ejecuta
await app.listen({ port: PORT });