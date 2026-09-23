/**
 * Validación de identificadores y filtros del panel de administración.
 *
 * La API usa UUID en todas sus entidades, así que la comprobación es la misma para tiendas, reseñas, preguntas y
 * usuarios. Se valida **antes** de llamar al backend: una dirección con basura no gasta una petición y responde
 * 404 con el mismo `code` que usaría la API.
 */

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Máximo de caracteres que se aceptan en un cursor de paginación (el mismo tope que en el resto del proyecto). */
const MAX_CURSOR_LENGTH = 512;

const CURSOR_PATTERN = /^[A-Za-z0-9_=:+-]{1,512}$/;

/** Cursor de paginación recibido por la URL, o `null` si no es válido. */
export function parseCursor(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === undefined || raw.length > MAX_CURSOR_LENGTH) {
    return null;
  }

  return CURSOR_PATTERN.test(raw) ? raw : null;
}

/** Primer valor de un parámetro de búsqueda que puede venir repetido. */
export function firstValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === undefined || raw.trim().length === 0 ? null : raw;
}

/** Término de búsqueda saneado: sin espacios sobrantes y con un tope de longitud. */
export function parseQuery(value: string | string[] | undefined): string | null {
  const raw = firstValue(value);
  return raw === null ? null : raw.trim().slice(0, 120);
}
