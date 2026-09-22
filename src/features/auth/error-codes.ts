/**
 * Traducción de los errores del backend.
 *
 * La API responde con Problem Details (RFC 9457) e incluye un campo `code` **estable**
 * (ver `app/core/errors.py` y `app/modules/identity/service.py` del backend). El frontend traduce siempre
 * por ese código, nunca por el texto en inglés. Los textos viven en `messages/*.json`, dentro de
 * `Auth.errors`.
 */

/** Códigos que la API puede devolver en las operaciones de esta fase. */
const KNOWN_CODES = [
  "email_already_registered",
  "invalid_credentials",
  "invalid_refresh_token",
  "invalid_token",
  "too_many_requests",
  "unauthorized",
  "validation_error",
  "not_found",
  "forbidden",
  "internal_error",
] as const;

export type KnownAuthErrorCode = (typeof KNOWN_CODES)[number];

/**
 * Devuelve la clave de traducción del error.
 *
 * Si el código viene vacío, no es una cadena o es desconocido, se usa `unknown` para no mostrar nunca un
 * texto en inglés ni un código crudo al usuario.
 */
export function authErrorMessageKey(code: unknown): KnownAuthErrorCode | "unknown" {
  if (typeof code !== "string") {
    return "unknown";
  }

  return (KNOWN_CODES as readonly string[]).includes(code)
    ? (code as KnownAuthErrorCode)
    : "unknown";
}

/** Forma mínima del Problem Details que devuelve el backend. */
type ProblemDetails = {
  code?: unknown;
  detail?: unknown;
  status?: unknown;
};

/** Extrae el `code` de una respuesta de error del backend, sin confiar en su forma. */
export function problemCode(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const { code } = payload as ProblemDetails;
  return typeof code === "string" ? code : null;
}
