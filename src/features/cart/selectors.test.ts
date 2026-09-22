import { describe, expect, it } from "vitest";

import {
  MAX_CART_QUANTITY,
  MIN_CART_QUANTITY,
  cartIsEmpty,
  cartItemCount,
  clampQuantity,
  clearedCart,
  findCartItem,
  withItemQuantity,
  withoutItem,
} from "./selectors";
import type { Cart } from "./types";

/**
 * Pruebas de las funciones puras del carrito.
 *
 * Lo más importante que se protege aquí: las actualizaciones optimistas **no recalculan dinero**. Cambian
 * cantidades (enteros) y dejan el subtotal tal como lo devolvió el servidor: la cifra que se enseña mientras
 * el servidor responde es siempre la suya, nunca una inventada en el navegador.
 */

const cart: Cart = {
  items: [
    {
      variant_id: "11111111-1111-4111-8111-111111111111",
      sku: "AUD-NEG",
      product_id: "p1",
      product_title: "Audífonos inalámbricos",
      product_slug: "audifonos-inalambricos",
      store_id: "s1",
      unit_price: "299900.00",
      quantity: 2,
      subtotal: "599800.00",
    },
    {
      variant_id: "22222222-2222-4222-8222-222222222222",
      sku: "AUD-BLA",
      product_id: "p1",
      product_title: "Audífonos inalámbricos",
      product_slug: "audifonos-inalambricos",
      store_id: "s1",
      unit_price: "319900.00",
      quantity: 1,
      subtotal: "319900.00",
    },
  ],
  total_items: 3,
  subtotal: "919700.00",
  currency: "COP",
};

const FIRST = "11111111-1111-4111-8111-111111111111";

describe("carrito: funciones puras", () => {
  it("cuenta las unidades totales y sabe cuándo está vacío", () => {
    expect(cartItemCount(cart)).toBe(3);
    expect(cartItemCount(null)).toBe(0);
    expect(cartIsEmpty(cart)).toBe(false);
    expect(cartIsEmpty(clearedCart(cart))).toBe(true);
    expect(cartIsEmpty(null)).toBe(true);
  });

  it("encuentra una línea por variante", () => {
    expect(findCartItem(cart, FIRST)?.sku).toBe("AUD-NEG");
    expect(findCartItem(cart, "33333333-3333-4333-8333-333333333333")).toBeNull();
    expect(findCartItem(null, FIRST)).toBeNull();
  });

  it("ajusta la cantidad a los límites reales del backend", () => {
    expect(clampQuantity(0)).toBe(MIN_CART_QUANTITY);
    expect(clampQuantity(-5)).toBe(MIN_CART_QUANTITY);
    expect(clampQuantity(7)).toBe(7);
    expect(clampQuantity(500)).toBe(MAX_CART_QUANTITY);
    expect(clampQuantity(2.7)).toBe(2);
    expect(clampQuantity(Number.NaN)).toBe(MIN_CART_QUANTITY);
  });

  it("cambia la cantidad sin tocar el dinero (lo calcula el servidor)", () => {
    const next = withItemQuantity(cart, FIRST, 4);
    const line = findCartItem(next, FIRST);

    expect(line?.quantity).toBe(4);
    // 2 + 1 pasa a 4 + 1 unidades.
    expect(next.total_items).toBe(5);
    // Los importes son los del servidor: el navegador no recalcula el subtotal de la línea ni el del carrito.
    expect(line?.subtotal).toBe("599800.00");
    expect(next.subtotal).toBe("919700.00");
    // El carrito original no se modifica (las funciones son puras).
    expect(findCartItem(cart, FIRST)?.quantity).toBe(2);
  });

  it("respeta el máximo del backend al cambiar la cantidad", () => {
    const next = withItemQuantity(cart, FIRST, MAX_CART_QUANTITY + 20);

    expect(findCartItem(next, FIRST)?.quantity).toBe(MAX_CART_QUANTITY);
  });

  it("no cambia nada si la variante no está en el carrito", () => {
    const other = "33333333-3333-4333-8333-333333333333";

    expect(withItemQuantity(cart, other, 3)).toBe(cart);
    expect(withoutItem(cart, other)).toBe(cart);
  });

  it("quita una línea y ajusta el recuento de unidades", () => {
    const next = withoutItem(cart, FIRST);

    expect(next.items).toHaveLength(1);
    expect(next.items[0]?.sku).toBe("AUD-BLA");
    expect(next.total_items).toBe(1);
    expect(next.subtotal).toBe("919700.00");
  });

  it("vacía el carrito dejando la moneda del servidor", () => {
    const next = clearedCart(cart);

    expect(next.items).toEqual([]);
    expect(next.total_items).toBe(0);
    expect(next.currency).toBe("COP");
  });
});
