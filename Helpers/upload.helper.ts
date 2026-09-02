const TIPOS_PERMITIDOS = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "video/mp4",
]);

export interface ArchivoGuardado {
  nombreOriginal: string;
  rutaGuardada: string;
  tipo: string;
}

/**
 * Valida y guarda un archivo (File nativo del navegador/multipart) en disco.
 * Genera un nombre único con crypto.randomUUID() para evitar colisiones
 * y ataques de path traversal usando el nombre original del usuario.
 */
export async function guardarArchivo(archivo: File): Promise<ArchivoGuardado> {
  if (!TIPOS_PERMITIDOS.has(archivo.type)) {
    const error = new Error(
      `Tipo de archivo no permitido: ${archivo.type}. Solo se aceptan PDF, JPG, PNG o MP4.`,
    ) as Error & { status: number };
    error.status = 400;
    throw error;
  }

  const maxMB = Number(Deno.env.get("MAX_FILE_SIZE_MB") ?? "10");
  const maxBytes = maxMB * 1024 * 1024;

  if (archivo.size > maxBytes) {
    const error = new Error(
      `El archivo supera el tamaño máximo permitido (${maxMB} MB)`,
    ) as Error & { status: number };
    error.status = 400;
    throw error;
  }

  const dirUploads = Deno.env.get("UPLOADS_DIR") ?? "./uploads";
  await Deno.mkdir(dirUploads, { recursive: true });

  const extension = archivo.name.includes(".") ? archivo.name.split(".").pop() : "";
  const nombreSeguro = `${crypto.randomUUID()}${extension ? "." + extension : ""}`;
  const rutaCompleta = `${dirUploads}/${nombreSeguro}`;

  const bytes = new Uint8Array(await archivo.arrayBuffer());
  await Deno.writeFile(rutaCompleta, bytes);

  return {
    nombreOriginal: archivo.name,
    rutaGuardada: rutaCompleta,
    tipo: archivo.type,
  };
}