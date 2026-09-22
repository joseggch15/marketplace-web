import type { Cart, CartItem } from "./types";

/**
 * Funciones **puras** del carrito (sin React y sin red), para poder probarlas sin montar nada.
 *
 * Regla de dinero del proyecto que se respeta aquí: el navegador **no calcula dinero**. Los subtotales, el
 * precio unitario y el total los calcula el backend, y estas funciones solo tocan **cantidades** (enteros) y
 * la lista de líneas. Por eso, en una actualización optimista los importes se quedan como los devolvió el
 * servidor por última vez y la pantalla los marca como «pendientes de confirmar» hasta que llega la
 * respuesta real: nunca se enseña una cifra recalculada en el navegador.
 */

/** Mínimo y máximo de unidades por línea. Es **espejo del backend** (`CartItemAdd`/`CartItemUpdate`: 1..100). */
export const MIN_CART_QUANTITY = 1;
export const MAX_CART_QUANTITY = 100;

/** Cuántas unidades hay en total (`0` si todavía no hay carrito cargado). */
export function cartItemCount(cart: Cart | null): number {
  return cart === null ? 0 : Math.max(0, cart.total_items);
}

/** ¿El carrito no tiene líneas? */
export function cartIsEmpty(cart: Cart | null): boolean {
  return cart === null || cart.items.length === 0;
}

/** Línea del carrito de una variante, o `null` si no está. */
export function findCartItem(cart: Cart | null, variantId: string): CartItem | null {
  if (cart === null) {
    return null;
  }

  return cart.items.find((item) => item.variant_id === variantId) ?? null;
}

/** Ajusta una cantidad a los límites reales del backend (1..100). */
export function clampQuantity(quantity: number, max: number = MAX_CART_QUANTITY): number {
  if (!Number.isFinite(quantity)) {
    return MIN_CART_QUANTITY;
  }

  return Math.min(Math.max(Math.trunc(quantity), MIN_CART_QUANTITY), max);
}

/**
 * Copia del carrito con la cantidad de una línea cambiada (actualización optimista).
 *
 * Solo se toca la cantidad y el recuento de unidades (`total_items`, que es un entero): los importes siguen
 * siendo los del servidor. Si la variante no está en el carrito, se devuelve el carrito tal cual.
 */
export function withItemQuantity(cart: Cart, variantId: string, quantity: number): Cart {
  const next = clampQuantity(quantity);
  const items = cart.items.map((item) =>
    item.variant_id === variantId ? { ...item, quantity: next } : item,
  );

  if (items.every((item, index) => item === cart.items[index])) {
    return cart;
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return { ...cart, items, total_items: totalItems };
}

/** Copia del carrito sin una línea (actualización optimista de «quitar»). */
export function withoutItem(cart: Cart, variantId: string): Cart {
  const items = cart.items.filter((item) => item.variant_id !== variantId);

  if (items.length === cart.items.length) {
    return cart;
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return { ...cart, items, total_items: totalItems };
}

/** Copia del carrito sin ninguna línea (actualización optimista de «vaciar»). */
export function clearedCart(cart: Cart): Cart {
  return { ...cart, items: [], total_items: 0 };
}
