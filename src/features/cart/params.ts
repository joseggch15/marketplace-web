/**
 * Validación de los parámetros que llegan a las rutas BFF del carrito.
 *
 * Se repite el patrón de UUID de `features/product/params.ts` a propósito (dos líneas) en vez de sacar una
 * utilidad compartida: cada ruta valida **lo suyo** y así un cambio aquí no puede romper la ficha de producto.
 */

const VARIANT_ID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** ¿El valor de la ruta tiene forma de identificador de variante? */
export function isVariantId(value: string): boolean {
  return VARIANT_ID_PATTERN.test(value);
}
