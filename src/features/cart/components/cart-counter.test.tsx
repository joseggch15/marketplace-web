import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../client";
import type * as clientModule from "../client";
import type { Cart } from "../types";
import { CartCounter } from "./cart-counter";

/**
 * Pruebas del contador de la cabecera.
 *
 * Dos cosas que se protegen: que el número sea el que calcula el servidor, y que un visitante que no tiene
 * carrito (lo sabe el servidor: ni sesión ni cookie) **no** provoque una petición a la API.
 */

vi.mock("../client", async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return { ...actual, fetchCart: vi.fn() };
});

const messages = {
  Cart: {
    counter: {
      label: "{count, plural, =0 {Carrito, vacío} one {Carrito, # producto} other {Carrito, # productos}}",
      text: "Carrito",
    },
  },
};

const cart: Cart = {
  items: [
    {
      variant_id: "11111111-1111-4111-8111-111111111111",
      sku: "AUD-NEG",
      product_id: "p1",
      product_title: "Audífonos",
      product_slug: "audifonos",
      store_id: "s1",
      unit_price: "299900.00",
      quantity: 3,
      subtotal: "899700.00",
      available: 0,
      price_changed: false,
    },
  ],
  total_items: 3,
  subtotal: "899700.00",
  currency: "COP",
};

function renderCounter(enabled: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <CartCounter enabled={enabled} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.fetchCart).mockResolvedValue({ ok: true, data: cart });
});

describe("CartCounter", () => {
  it("muestra las unidades que devuelve el servidor", async () => {
    renderCounter(true);

    expect(await screen.findByLabelText("Carrito, 3 productos")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
  });

  it("sin carrito conocido no pide nada y no enseña insignia", () => {
    renderCounter(false);

    expect(api.fetchCart).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Carrito, vacío")).toBeVisible();
  });
});
