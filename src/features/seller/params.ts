/**
 * Validación de identificadores del panel del vendedor.
 *
 * Igual que en las demás features: se valida **antes** de llamar al backend, para no gastar una petición con
 * basura. La API usa UUID en todas sus entidades, así que la comprobación es la misma para todas.
 */

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** ¿El valor tiene forma de identificador de producto? */
export function isProductId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** ¿El valor tiene forma de identificador de variante? */
export function isVariantId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** ¿El valor tiene forma de identificador de imagen? */
export function isImageId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** ¿El valor tiene forma de identificador de venta (sub-orden)? */
export function isSellerOrderId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Máximo de caracteres que se aceptan en un cursor de paginación (el mismo tope que en «Mis compras»). */
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
