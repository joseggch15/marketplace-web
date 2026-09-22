import { callBff, type ClientResult } from "@/lib/api/bff-client";

import type { Cart } from "./types";

/**
 * Cliente del navegador para las rutas BFF del carrito.
 *
 * El navegador solo habla con `/api/cart...` de nuestro propio dominio: el token del invitado y la sesión
 * viajan en cookies httpOnly que gestiona el servidor. La llamada en sí (y el formato de los errores) vive en
 * `src/lib/api/bff-client.ts`, compartida con las features de autenticación (F2) y producto (F4).
 */

/**
 * Clave de la caché de TanStack Query del carrito.
 *
 * Las tres piezas que muestran el carrito (la página `/cart`, el contador de la cabecera y el botón «Agregar
 * al carrito») comparten esta clave: así todas se actualizan a la vez y hay **una sola** petición en vuelo.
 */
export const cartKey = ["cart"] as const;

/** Carrito actual (del usuario con sesión o del invitado). */
export function fetchCart(): Promise<ClientResult<Cart>> {
  return callBff({ method: "GET", path: "/api/cart" });
}

/** Añade (o incrementa) una variante. */
export function addCartItem(variantId: string, quantity: number): Promise<ClientResult<Cart>> {
  return callBff({
    method: "POST",
    path: "/api/cart/items",
    body: { variant_id: variantId, quantity },
  });
}

/** Cambia la cantidad de una línea. */
export function updateCartItemQuantity(
  variantId: string,
  quantity: number,
): Promise<ClientResult<Cart>> {
  return callBff({
    method: "PATCH",
    path: `/api/cart/items/${encodeURIComponent(variantId)}`,
    body: { quantity },
  });
}

/** Quita una línea del carrito. */
export function removeCartItem(variantId: string): Promise<ClientResult<Cart>> {
  return callBff({
    method: "DELETE",
    path: `/api/cart/items/${encodeURIComponent(variantId)}`,
  });
}

/** Vacía el carrito. */
export function clearCart(): Promise<ClientResult<Cart>> {
  return callBff({ method: "DELETE", path: "/api/cart" });
}
