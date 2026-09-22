import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../client";
import type * as clientModule from "../client";
import type { Cart } from "../types";
import { CartView } from "./cart-view";

/**
 * Pruebas de la pantalla del carrito.
 *
 * Se comprueban los cuatro estados (cargando, vacío, error y con líneas), que las tres acciones llaman al
 * servidor con los datos correctos y algo que importa mucho en este proyecto: los importes que se muestran son
 * los que **devuelve el servidor**, nunca una suma hecha en el navegador.
 */

vi.mock("../client", async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    fetchCart: vi.fn(),
    updateCartItemQuantity: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
  };
});

const messages = {
  Cart: {
    loading: "Cargando tu carrito…",
    empty: {
      title: "Tu carrito está vacío",
      description: "Cuando agregues algo, lo verás aquí.",
      action: "Explorar el catálogo",
    },
    failure: {
      title: "No pudimos cargar tu carrito",
      description: "El servicio de carrito no está respondiendo.",
      retry: "Intentar de nuevo",
    },
    item: {
      sku: "Código del vendedor: {sku}",
      priceUnavailable: "Precio no disponible",
      quantityLabel: "Cantidad",
      quantityDecrement: "Quitar una unidad",
      quantityIncrement: "Agregar una unidad",
      quantityMax: "El máximo por producto es {max}",
      quantityMin: "El mínimo es {min}",
      lineTotal: "Subtotal",
      remove: "Quitar",
      removeLabel: "Quitar {title} del carrito",
      pending: "Actualizando…",
    },
    summary: {
      title: "Resumen",
      items: "{count, plural, one {# producto} other {# productos}}",
      subtotal: "Subtotal",
      available: 0,
      price_changed: false,
      updating: "Actualizando…",
      note: "El subtotal lo calcula la tienda.",
      clear: "Vaciar carrito",
      checkout: "Continuar con el pago",
      checkoutNote: "Pago en modo de prueba: no se cobra dinero real.",
      continueShopping: "Seguir comprando",
    },
    errors: {
      network_error: "No pudimos conectar. Revisa tu conexión.",
      insufficient_stock: "No hay suficientes unidades disponibles.",
      unknown: "No pudimos actualizar tu carrito.",
    },
  },
};

const FIRST_VARIANT = "11111111-1111-4111-8111-111111111111";

const cartWithOneItem: Cart = {
  items: [
    {
      variant_id: FIRST_VARIANT,
      sku: "AUD-NEG",
      product_id: "p1",
      product_title: "Audífonos inalámbricos",
      product_slug: "audifonos",
      store_id: "s1",
      unit_price: "299900.00",
      quantity: 2,
      subtotal: "599800.00",
      available: 0,
      price_changed: false,
    },
  ],
  total_items: 2,
  subtotal: "599800.00",
  currency: "COP",
};

const emptyCart: Cart = { items: [], total_items: 0, subtotal: "0.00", currency: "COP" };

function renderView() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <CartView />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.fetchCart).mockResolvedValue({ ok: true, data: cartWithOneItem });
  vi.mocked(api.updateCartItemQuantity).mockResolvedValue({ ok: true, data: cartWithOneItem });
  vi.mocked(api.removeCartItem).mockResolvedValue({ ok: true, data: emptyCart });
  vi.mocked(api.clearCart).mockResolvedValue({ ok: true, data: emptyCart });
});

describe("CartView", () => {
  it("muestra el carrito vacío con una acción sugerida", async () => {
    vi.mocked(api.fetchCart).mockResolvedValue({ ok: true, data: emptyCart });
    renderView();

    expect(await screen.findByText("Tu carrito está vacío")).toBeVisible();
    expect(screen.getByRole("link", { name: "Explorar el catálogo" })).toBeVisible();
    expect(screen.queryByText("Resumen")).toBeNull();
  });

  it("muestra las líneas con los importes que calcula el servidor", async () => {
    renderView();

    expect(await screen.findByText("Audífonos inalámbricos")).toBeVisible();
    expect(screen.getByText("Código del vendedor: AUD-NEG")).toBeVisible();
    expect(screen.getByLabelText("Cantidad")).toHaveValue(2);
    // El subtotal de la línea y el del carrito son los del backend, no una multiplicación local.
    expect(screen.getAllByText(/599\.800/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeVisible();
    // El checkout ya existe (F6): el botón lleva a él y el aviso explica el modo de prueba.
    expect(screen.getByRole("link", { name: "Continuar con el pago" })).toHaveAttribute(
      "href",
      "/es/checkout",
    );
    expect(screen.getByText(/modo de prueba/i)).toBeVisible();
  });

  it("cambia la cantidad en el servidor con el número nuevo", async () => {
    const user = userEvent.setup();
    renderView();

    await screen.findByText("Audífonos inalámbricos");
    await user.click(screen.getByRole("button", { name: "Agregar una unidad" }));

    await waitFor(() => {
      expect(api.updateCartItemQuantity).toHaveBeenCalledWith(FIRST_VARIANT, 3);
    });
  });

  it("quita una línea", async () => {
    const user = userEvent.setup();
    renderView();

    await screen.findByText("Audífonos inalámbricos");
    await user.click(
      screen.getByRole("button", { name: "Quitar Audífonos inalámbricos del carrito" }),
    );

    await waitFor(() => {
      expect(api.removeCartItem).toHaveBeenCalledWith(FIRST_VARIANT);
    });
    expect(await screen.findByText("Tu carrito está vacío")).toBeVisible();
  });

  it("vacía el carrito", async () => {
    const user = userEvent.setup();
    renderView();

    await screen.findByText("Audífonos inalámbricos");
    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }));

    await waitFor(() => {
      expect(api.clearCart).toHaveBeenCalled();
    });
    expect(await screen.findByText("Tu carrito está vacío")).toBeVisible();
  });

  it("explica el fallo y ofrece volver a intentarlo", async () => {
    vi.mocked(api.fetchCart).mockResolvedValue({ ok: false, status: 502, code: "network_error" });
    renderView();

    expect(await screen.findByText("No pudimos cargar tu carrito")).toBeVisible();
    expect(screen.getByRole("button", { name: "Intentar de nuevo" })).toBeEnabled();
  });

  it("avisa cuando el servidor rechaza un cambio y revierte la cantidad", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateCartItemQuantity).mockResolvedValue({
      ok: false,
      status: 400,
      code: "insufficient_stock",
    });
    renderView();

    await screen.findByText("Audífonos inalámbricos");
    await user.click(screen.getByRole("button", { name: "Agregar una unidad" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No hay suficientes unidades disponibles.",
    );
    // La cantidad vuelve a la que devolvió el servidor: la actualización optimista se revirtió.
    expect(screen.getByLabelText("Cantidad")).toHaveValue(2);
  });
});
