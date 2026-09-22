import { backend } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

/**
 * Nota: este archivo solo puede usarse desde el servidor. No se importa `server-only` porque el
 * proyecto no incluye ese paquete; el guardia de `src/lib/api/client.ts` cumple la misma función
 * (lanza un error si el código llega al navegador).
 */

/** Respuesta del endpoint `/api/v1/health` (tipo generado desde el OpenAPI del backend). */
export type HealthResponse = components["schemas"]["HealthResponse"];

/**
 * Resultado de comprobar la plataforma.
 *
 * - `ok`: la API responde y sus dependencias están bien.
 * - `unhealthy`: la API responde, pero alguna dependencia (PostgreSQL o Redis) falla (HTTP 503).
 * - `unreachable`: no hubo respuesta (el backend está apagado o la URL es incorrecta).
 */
export type PlatformHealth =
  | { kind: "ok"; payload: HealthResponse }
  | { kind: "unhealthy"; payload: HealthResponse }
  | { kind: "unreachable"; detail: string };

/** Comprueba que un valor desconocido tenga la forma de `HealthResponse`. */
function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { status?: unknown; checks?: unknown };
  return typeof candidate.status === "string" && typeof candidate.checks === "object";
}

/**
 * Consulta el estado del backend.
 *
 * Nunca lanza una excepción: la portada debe poder mostrar el problema en vez de romperse.
 * Se usa `cache: "no-store"` para que el estado mostrado sea el del momento.
 */
export async function fetchPlatformHealth(): Promise<PlatformHealth> {
  try {
    const result = await backend.GET("/api/v1/health", { cache: "no-store" });

    const payload: unknown = result.response.ok ? result.data : result.error;

    if (isHealthResponse(payload)) {
      return result.response.ok
        ? { kind: "ok", payload }
        : { kind: "unhealthy", payload };
    }

    return {
      kind: "unreachable",
      detail: `HTTP ${result.response.status} (${result.response.statusText || "sin detalle"})`,
    };
  } catch (error) {
    return {
      kind: "unreachable",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
