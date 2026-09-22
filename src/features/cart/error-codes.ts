/**
 * Traducción de los errores del carrito.
 *
 * La API responde con Problem Details (RFC 9457) y un campo `code` **estable** (ver
 * `app/core/errors.py` y `app/modules/cart/service.py` del backend). El frontend traduce siempre por ese
 * código, nunca por el texto en inglés. Los textos viven en `messages/*.json`, dentro de `Cart.errors`.
 *
 * Es el mismo criterio que en `features/auth/error-codes.ts` y `features/product/error-codes.ts`: cada
 * pantalla declara solo los códigos que puede recibir, para que el mensaje sea concreto.
 *
 * `network_error` no lo devuelve el backend: lo produce nuestro propio cliente cuando el navegador no puede
 * llegar a la ruta BFF (o ésta no puede llegar a la API). Se incluye aquí porque el usuario merece un texto
 * traducido también en ese caso.
 */

/** Códigos que pueden aparecer en una operación del carrito. */
const KNOWN_CODES = [
  "cart_token_required",
  "cart_item_not_found",
  "variant_not_found",
  "quantity_limit_exceeded",
  "insufficient_stock",
  "unauthorized",
  "validation_error",
  "too_many_requests",
  "not_found",
  "forbidden",
  "internal_error",
  "network_error",
] as const;

export type KnownCartErrorCode = (typeof KNOWN_CODES)[number];

/** Clave de traducción (`Cart.errors.<clave>`) o `unknown` si el código no está en la lista. */
export function cartErrorMessageKey(code: unknown): KnownCartErrorCode | "unknown" {
  if (typeof code !== "string") {
    return "unknown";
  }

  return (KNOWN_CODES as readonly string[]).includes(code)
    ? (code as KnownCartErrorCode)
    : "unknown";
}
