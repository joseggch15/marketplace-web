import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CheckoutSteps } from "@/components/domain/checkout-steps";
import { OrderTimeline } from "@/components/domain/order-timeline";

/** Pruebas de los componentes de progreso: pasos del checkout y línea de tiempo del pedido. */

const LOCALE = "es-CO";

describe("CheckoutSteps", () => {
  it("marca el paso actual con aria-current y describe los estados con texto", () => {
    render(
      <CheckoutSteps
        steps={[
          { id: "cart", label: "Carrito" },
          { id: "data", label: "Datos" },
          { id: "payment", label: "Pago" },
        ]}
        currentIndex={1}
        completedLabel="(completado)"
        currentLabel="(paso actual)"
      />,
    );

    const current = screen.getByText("Datos").closest("li");

    expect(current).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("(completado)")).toBeVisible();
    expect(screen.getAllByText("(paso actual)").length).toBeGreaterThan(0);
  });
});

describe("OrderTimeline", () => {
  const items = [
    { id: "created", label: "Pedido creado", date: "2026-03-10T15:04:00Z" },
    { id: "paid", label: "Pago confirmado", date: null },
  ];

  it("muestra cada evento con su fecha o el aviso de pendiente", () => {
    render(
      <OrderTimeline
        items={items}
        states={["done", "current"]}
        locale={LOCALE}
        pendingDateLabel="Pendiente de confirmar"
      />,
    );

    expect(screen.getByText("Pedido creado")).toBeVisible();
    expect(screen.getByText("Pago confirmado")).toBeVisible();
    expect(screen.getByText("Pendiente de confirmar")).toBeVisible();
    expect(screen.getByText(/2026/)).toBeVisible();
  });

  it("muestra el error con role=alert cuando no se pudo cargar", () => {
    render(
      <OrderTimeline
        items={items}
        states={["done", "current"]}
        locale={LOCALE}
        pendingDateLabel="Pendiente de confirmar"
        errorMessage="No pudimos cargar el seguimiento"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el seguimiento");
  });

  it("representa el estado fallido/cancelado", () => {
    render(
      <OrderTimeline
        items={[{ id: "cancelled", label: "Cancelado", date: "2026-03-12T10:00:00Z" }]}
        states={["failed"]}
        locale={LOCALE}
        pendingDateLabel="Pendiente de confirmar"
      />,
    );

    expect(screen.getByText("Cancelado")).toBeVisible();
  });
});
