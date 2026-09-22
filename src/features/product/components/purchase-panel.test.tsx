import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import type { ProductVariant } from "../types";
import { PurchasePanel } from "./purchase-panel";

/**
 * Pruebas de la caja de compra.
 *
 * Lo que se protege: que el precio mostrado sea el de la presentación elegida, que **nunca** se pueda pedir más
 * de lo que hay, y que cuando el stock no se pudo comprobar la interfaz lo diga en lugar de inventar un límite
 * o marcar el producto como agotado.
 */

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
    buy: { addToCart: "Agregar al carrito", comingSoon: "El carrito llega después." },
  },
};

const cheap: ProductVariant = {
  id: "variante-b",
  sku: "AUD-NEG",
  price: "299900.00",
  compare_at_price: "399900.00",
};
const expensive: ProductVariant = {
  id: "variante-a",
  sku: "AUD-BLA",
  price: "319900.00",
  compare_at_price: null,
};

function renderPanel(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

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
      <PurchasePanel variants={[cheap, expensive]} availability={null} currency="COP" locale="es-CO" />,
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

  it("deja claro que agregar al carrito llega en la siguiente entrega", () => {
    renderPanel(
      <PurchasePanel
        variants={[cheap]}
        availability={{ "variante-b": 1 }}
        currency="COP"
        locale="es-CO"
      />,
    );

    expect(screen.getByRole("button", { name: /Agregar al carrito/ })).toBeDisabled();
    expect(screen.getByText("El carrito llega después.")).toBeVisible();
  });

  it("no pinta nada si el producto no tiene variantes", () => {
    const { container } = renderPanel(
      <PurchasePanel variants={[]} availability={{}} currency="COP" locale="es-CO" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
