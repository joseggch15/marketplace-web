/**
 * Parámetros de la página de producto.
 *
 * Igual que en el catálogo (F3), lo que el usuario cambia vive en la **URL**: así la página es compartible, el
 * botón "atrás" funciona y el servidor puede renderizarla.
 */

/**
 * Los identificadores son UUID. Se validan **antes** de llamar al backend: una dirección como `/p/hola` no
 * tiene por qué llegar a la API (y así la página responde 404 sin gastar una petición).
 */
const PRODUCT_ID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** ¿El valor de la ruta tiene forma de identificador de producto? */
export function isProductId(value: string): boolean {
  return PRODUCT_ID_PATTERN.test(value);
}

/** Nombre del parámetro de URL que lleva el cursor de las reseñas. */
export const REVIEWS_CURSOR_PARAM = "reviews_cursor";

/** Los cursores son cadenas opacas: se limitan tamaño y caracteres (misma regla que en el catálogo). */
const CURSOR_PATTERN = /^[A-Za-z0-9_=:+-]{1,512}$/;

type RawParam = string | string[] | undefined;

/** Lee el cursor de reseñas de los `searchParams`, descartando cualquier valor que no sea válido. */
export function parseReviewsCursor(raw: Record<string, RawParam>): string | null {
  const value = raw[REVIEWS_CURSOR_PARAM];
  const cursor = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

  return CURSOR_PATTERN.test(cursor) ? cursor : null;
}

/**
 * Enlace a la página de producto (con el cursor de reseñas si lo hay).
 *
 * El `canonical` de la página apunta siempre a la dirección **sin** cursor: `?reviews_cursor=…` es la misma
 * página con otra página de reseñas, y no interesa que Google la indexe por separado.
 */
export function reviewsHref(productPath: string, cursor: string | null): string {
  return cursor === null ? productPath : `${productPath}?${REVIEWS_CURSOR_PARAM}=${encodeURIComponent(cursor)}`;
}
