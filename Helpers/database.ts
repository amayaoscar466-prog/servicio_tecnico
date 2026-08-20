import { Client } from "../Dependencies/dependencias.ts";

const client = new Client();

export async function verificarConexionDB(): Promise<void> {
  try {
    await client.connect({
      hostname: Deno.env.get("DB_HOST") ?? "localhost",
      port: Number(Deno.env.get("DB_PORT") ?? "3306"),
      username: Deno.env.get("DB_USER") ?? "root",
      password: Deno.env.get("DB_PASSWORD") ?? "",
      db: Deno.env.get("DB_NAME") ?? "soporte_tecnico",
      poolSize: 10,
    });
    console.log("✅ Conexión a MySQL establecida correctamente");
  } catch (error) {
    console.error("❌ Error al conectar con MySQL:", error);
    throw error;
  }
}

export default client;