import { create, verify, getNumericDate } from "../Dependencies/dependencias.ts";
import type { JwtPayload } from "../Model/interfaces.ts";

let claveCache: CryptoKey | null = null;

async function obtenerClave(): Promise<CryptoKey> {
  if (claveCache) return claveCache;

  const secreto = Deno.env.get("JWT_SECRET");
  if (!secreto) {
    throw new Error(
      "JWT_SECRET no está definido. Revisa tu archivo .env y que uses --env-file=.env",
    );
  }

  claveCache = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  return claveCache;
}

/** Genera un JWT firmado. Expira en JWT_EXPIRES_HORAS horas (default 8). */
export async function generarToken(payload: JwtPayload): Promise<string> {
  const clave = await obtenerClave();
  const horasExpira = Number(Deno.env.get("JWT_EXPIRES_HORAS") ?? "8");

  return await create(
    { alg: "HS256", typ: "JWT" },
    { ...payload, exp: getNumericDate(60 * 60 * horasExpira) },
    clave,
  );
}

export async function verificarToken(token: string): Promise<JwtPayload> {
  const clave = await obtenerClave();
  const payload = await verify(token, clave);
  return payload as unknown as JwtPayload;
}