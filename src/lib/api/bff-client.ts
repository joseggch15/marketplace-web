/**
 * Cliente del navegador para las rutas BFF (`/api/...` de nuestro propio dominio).
 *
 * El navegador **nunca** habla con el backend FastAPI ni ve tokens: pide a nuestras propias rutas, que son
 * las que llevan la sesión (cookies httpOnly) al backend. Este archivo es el único sitio donde se hace esa
 * llamada, para que todas las pantallas se comporten igual:
 *
 * - Nunca lanza excepciones: un fallo de red se convierte en `{ ok: false, code: "network_error" }`.
 * - Los errores se leen por el campo `code` estable del formato Problem Details (RFC 9457), **nunca** por el
 *   texto en inglés: así cada idioma traduce lo suyo.
 *
 * Lo usan las features `auth` (F2) y `product` (F4).
 */

/** Fallo con el `code` estable de la API, listo para traducir. */
export type ClientFailure = { ok: false; status: number; code: string };

export type ClientResult<T> = { ok: true; data: T } | ClientFailure;

export type BffRequestOptions = {
  method: "POST" | "PATCH" | "DELETE" | "GET";
  /** Ruta del BFF, siempre relativa al propio dominio (p. ej. `/api/auth/login`). */
  path: string;
  body?: unknown;
};

/** Hace una petición a una ruta BFF y normaliza el resultado (nunca lanza excepciones). */
export async function callBff<T>({
  method,
  path,
  body,
}: BffRequestOptions): Promise<ClientResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.ok) {
      const data: unknown = response.status === 204 ? {} : await response.json();
      return { ok: true, data: data as T };
    }

    let code = "unknown";

    try {
      const problem: unknown = await response.json();
      const candidate = (problem as { code?: unknown }).code;
      if (typeof candidate === "string") {
        code = candidate;
      }
    } catch {
      // Sin cuerpo JSON: se queda el código genérico.
    }

    return { ok: false, status: response.status, code };
  } catch {
    return { ok: false, status: 0, code: "network_error" };
  }
}
