/**
 * Códigos de error estables del backend que puede encontrarse el panel del vendedor.
 *
 * La API responde siempre con RFC 9457 y un `code` estable; aquí se traduce a una clave de mensaje para que el
 * panel diga **qué ha pasado** en el idioma del usuario en lugar de mostrar un error genérico. La lista está
 * tomada de los `AppError` del backend (`app/modules/sellers`, `catalog`, `inventory`, `orders`, `shipping`) y cada
 * clave existe en los mensajes (`Seller.errors.*`).
 *
 * Lo que **no** está en la lista se muestra como `unknown` (con su texto traducido) en vez de inventar una
 * explicación: si el backend añade un código nuevo, la interfaz no miente.
 */
export const SELLER_ERROR_CODES = [
  // Tienda
  "seller_required",
  "store_required",
  "store_not_approved",
  "store_already_exists",
  "store_not_found",
  "invalid_store_status",
  // Productos, variantes, imágenes y categorías
  "product_not_found",
  "invalid_product_status",
  "variant_not_found",
  "image_not_found",
  "sku_already_exists",
  "category_not_found",
  "attribute_not_found",
  "attribute_not_assigned",
  "insufficient_stock",
  "inventory_not_found",
  // Pedidos y envíos
  "seller_order_not_found",
  "invalid_status_transition",
  "shipment_exists",
  "shipment_not_found",
  "sale_cancelled",
  // Genéricos de la API
  "unauthorized",
  "forbidden",
  "not_found",
  "validation_error",
  "too_many_requests",
  "internal_error",
] as const;

export type KnownSellerErrorCode = (typeof SELLER_ERROR_CODES)[number];

/** Clave de mensaje para un código: el propio código si se conoce, `unknown` si no. */
export type SellerErrorKey = KnownSellerErrorCode | "unknown" | "network_error";

const KNOWN = new Set<string>(SELLER_ERROR_CODES);

/**
 * Traduce el `code` de la API a una clave de mensaje.
 *
 * Un código ausente (`null`) significa que la petición no llegó a contestar —red caída, backend apagado—, y eso se
 * cuenta como `network_error`, no como un error del dato.
 */
export function sellerErrorKey(code: string | null | undefined): SellerErrorKey {
  if (code === null || code === undefined) {
    return "network_error";
  }

  return KNOWN.has(code) ? (code as KnownSellerErrorCode) : "unknown";
}
