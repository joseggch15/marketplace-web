import { z } from "zod";

/**
 * Validación de las variables de entorno.
 *
 * Regla del proyecto: solo lo público lleva el prefijo `NEXT_PUBLIC_`.
 * `BACKEND_URL` es una URL interna del servidor de Next.js y **nunca** se expone al navegador.
 */
const envSchema = z.object({
  /** URL base del backend FastAPI (solo servidor). */
  BACKEND_URL: z.url().default("http://127.0.0.1:8000"),
  /** URL pública del sitio, usada para metadata, canonical y hreflang. */
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  /** Entorno: en producción las cookies de sesión se marcan como `Secure`. */
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /**
   * Almacenamiento de objetos (MinIO/S3) que usa el proxy de imágenes `/api/media/[...key]`.
   * Debe coincidir con la configuración del backend; si allá cambia, aquí también.
   */
  S3_ENDPOINT_URL: z.url().default("http://127.0.0.1:9000"),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_BUCKET: z.string().min(1).default("marketplace"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
});

const parsed = envSchema.safeParse({
  BACKEND_URL: process.env.BACKEND_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
  S3_ENDPOINT_URL: process.env.S3_ENDPOINT_URL,
  S3_REGION: process.env.S3_REGION,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
});

if (!parsed.success) {
  // Falla rápido y con un mensaje claro en lugar de romper en tiempo de ejecución.
  throw new Error(
    `Variables de entorno inválidas: ${JSON.stringify(z.treeifyError(parsed.error), null, 2)}`,
  );
}

export const env = parsed.data;
