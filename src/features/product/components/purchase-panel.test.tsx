import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as cartApi from "@/features/cart/client";
import type * as cartClient from "@/features/cart/client";

import type { ProductVariant } from "../types";
import { PurchasePanel } from "./purchase-panel";

/**
 * Pruebas de la caja de compra.
 *
 * Lo que se protege: que el precio mostrado sea el de la presentación elegida, que **nunca** se pueda pedir más
 * de lo que hay, que cuando el stock no se pudo comprobar la interfaz lo diga en lugar de inventar un límite o
 * marcar el producto como agotado, y (F5) que «Agregar al carrito» llame al servidor con la variante y la
 * cantidad elegidas y traduzca el error por su `code` estable.
 */

// El botón pasa por las rutas BFF: en la prueba se sustituye la llamada al servidor por una respuesta fija.
vi.mock("@/features/cart/client", async (importOriginal) => {
  const actual = await importOriginal<typeof cartClient>();
  return { ...actual, addCartItem: vi.fn() };
});

const messages = {
  Product: {
    priceUnavailable: "Precio no disponible",
    sku: "Código del vendedor: {sku}",
    stock: {
      available: "{count} unidades disponibles",
      unknown: "No pudimos comprobar el stock.",
      outOfStock: "Agotado",
    },
    variant: {
      group: "Presentación",
      hint: "Cada presentación puede tener un precio distinto.",
      unavailable: "sin stock",
      availabilityError: "Ahora mismo no pudimos comprobar el stock.",
    },
    quantity: {
      label: "Cantidad",
      decrement: "Quitar una unidad",
      increment: "Agregar una unidad",
      max: "Solo hay {max} disponibles",
      min: "El mínimo de compra es {min}",
    },
    buy: {
      addToCart: "Agregar al carrito",
      adding: "Agregando…",
      added: "Agregado a tu carrito.",
      viewCart: "Ver el carrito",
      outOfStockHint: "Esta presentación no tiene unidades disponibles ahora mismo.",
    },
  },
  Cart: {
    errors: {
      insufficient_stock: "No hay suficientes unidades disponibles.",
      unknown: "No pudimos actualizar tu carrito.",
    },
  },
};

const CHEAP_VARIANT = "variante-b";

const cheap: ProductVariant = {
  id: "variante-b",
  sku: "AUD-NEG",
  price: "299900.00",
  compare_at_price: "399900.00",
  stock: 0,
  available: 0,
};
const expensive: ProductVariant = {
  id: "variante-a",
  sku: "AUD-BLA",
  price: "319900.00",
  compare_at_price: null,
  stock: 0,
  available: 0,
};

function renderPanel(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(cartApi.addCartItem).mockResolvedValue({
    ok: true,
    data: {
      items: [
        {
          variant_id: CHEAP_VARIANT,
          sku: "AUD-NEG",
          product_id: "p1",
          product_title: "Audífonos",
          product_slug: "audifonos",
          store_id: "s1",
          unit_price: "299900.00",
          quantity: 1,
          subtotal: "299900.00",
          available: 0,
          price_changed: false,
        },
      ],
      total_items: 1,
      subtotal: "299900.00",
      currency: "COP",
    },
  });
});

describe("PurchasePanel", () => {
  it("parte de la presentación más barata y muestra las unidades reales", () => {
    renderPanel(
      <PurchasePanel
        variants={[expensive, cheap]}
        availability={{ "variante-b": 3, "variante-a": 5 }}
        currency="COP"
        locale="es-CO"
      />,
    );

    expect(screen.getByText(/299/)).toBeVisible();
    expect(screen.getByText("3 unidades disponibles")).toBeVisible();
    expect(screen.getByRole("radio", { name: /AUD-NEG/ })).toBeChecked();
  });

  it("no deja pedir más unidades de las que hay", async () => {
    const user = userEvent.setup();

    renderPanel(
      <PurchasePanel
        variants={[cheap]}
        availability={{ "variante-b": 2 }}
        currency="COP"
        locale="es-CO"
      />,
    );

    const quantity = screen.getByLabelText("Cantidad");
    expect(quantity).toHaveValue(2 - 1);

    await user.click(screen.getByRole("button", { name: "Agregar una unidad" }));

    expect(quantity).toHaveValue(2);
    expect(screen.getByRole("button", { name: "Agregar una unidad" })).toBeDisabled();
  });

  it("al cambiar de presentación cambia el precio y la cantidad vuelve a 1", async () => {
    const user = userEvent.setup();

    renderPanel(
      <PurchasePanel
        variants={[cheap, expensive]}
        availability={{ "variante-b": 4, "variante-a": 9 }}
        currency="COP"
        locale="es-CO"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Agregar una unidad" }));
    expect(screen.getByLabelText("Cantidad")).toHaveValue(2);

    await user.click(screen.getByRole("radio", { name: /AUD-BLA/ }));

    expect(screen.getByText(/319/)).toBeVisible();
    expect(screen.getByLabelText("Cantidad")).toHaveValue(1);
    expect(screen.getByText("9 unidades disponibles")).toBeVisible();
  });

  it("avisa cuando el stock no se pudo comprobar y no inventa un límite", () => {
    renderPanel(
      <PurchasePanel
        variants={[cheap, expensive]}
        availability={null}
        currency="COP"
        locale="es-CO"
      />,
    );

    expect(screen.getByText("No pudimos comprobar el stock.")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ahora mismo no pudimos comprobar el stock.",
    );
    // Sin datos de stock no se pinta el selector de cantidad, pero tampoco se marca nada como agotado.
    expect(screen.queryByLabelText("Cantidad")).toBeNull();
    expect(screen.queryByText("Agotado")).toBeNull();
    expect(screen.getByRole("radio", { name: /AUD-NEG/ })).toBeEnabled();
  });

  it("deshabilita la presentación sin stock y avisa con texto", () => {
    renderPanel(
      <PurchasePanel
        variants={[cheap, expensive]}
        availability={{ "variante-b": 0, "variante-a": 5 }}
        currency="COP"
        locale="es-CO"
      />,
    );

    expect(screen.getByRole("radio", { name: /AUD-NEG/ })).toBeDisabled();
    expect(screen.getByText("(sin stock)")).toBeVisible();
    expect(screen.getByText("Agotado")).toBeVisible();
  });

  it("agrega al carrito por el servidor y ofrece verlo", async () => {
    const user = userEvent.setup();

    renderPanel(
      <PurchasePanel
        variants={[cheap]}
        availability={{ "variante-b": 1 }}
        currency="COP"
        locale="es-CO"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Agregar al carrito/ }));

    expect(cartApi.addCartItem).toHaveBeenCalledWith(CHEAP_VARIANT, 1);
    expect(await screen.findByText("Agregado a tu carrito.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver el carrito" })).toBeVisible();
  });

  it("traduce el error del servidor cuando no se puede agregar", async () => {
    const user = userEvent.setup();
    vi.mocked(cartApi.addCartItem).mockResolvedValue({
      ok: false,
      status: 400,
      code: "insufficient_stock",
    });

    renderPanel(
      <PurchasePanel
        variants={[cheap]}
        availability={{ "variante-b": 1 }}
        currency="COP"
        locale="es-CO"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Agregar al carrito/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No hay suficientes unidades disponibles.",
    );
  });

  it("deshabilita el botón cuando la presentación elegida está agotada", () => {
    renderPanel(
      <PurchasePanel
        variants={[cheap]}
        availability={{ "variante-b": 0 }}
        currency="COP"
        locale="es-CO"
      />,
    );

    expect(screen.getByRole("button", { name: /Agregar al carrito/ })).toBeDisabled();
    expect(
      screen.getByText("Esta presentación no tiene unidades disponibles ahora mismo."),
    ).toBeVisible();
  });

  it("no pinta nada si el producto no tiene variantes", () => {
    const { container } = renderPanel(
      <PurchasePanel variants={[]} availability={{}} currency="COP" locale="es-CO" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
