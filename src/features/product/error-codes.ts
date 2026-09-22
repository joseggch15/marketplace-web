/**
 * Traducción de los errores al publicar una pregunta.
 *
 * La API responde con Problem Details (RFC 9457) y un campo `code` **estable**: se traduce por ese código,
 * nunca por el texto en inglés. Los textos viven en `messages/*.json`, dentro de `Product.errors`.
 *
 * Es el mismo criterio que en `features/auth/error-codes.ts`; se repite la lista (en vez de reutilizar la de
 * autenticación) para que cada pantalla traduzca solo lo que puede ocurrirle y el mensaje sea concreto: aquí
 * el usuario está publicando una pregunta, no iniciando sesión.
 */

/** Códigos que la API puede devolver al publicar una pregunta. */
const KNOWN_CODES = [
  "unauthorized",
  "validation_error",
  "too_many_requests",
  "not_found",
  "internal_error",
] as const;

export type KnownQuestionErrorCode = (typeof KNOWN_CODES)[number];

/** Clave de traducción del error, o `unknown` si el código no está en la lista. */
export function questionErrorMessageKey(code: unknown): KnownQuestionErrorCode | "unknown" {
  if (typeof code !== "string") {
    return "unknown";
  }

  return (KNOWN_CODES as readonly string[]).includes(code)
    ? (code as KnownQuestionErrorCode)
    : "unknown";
}
