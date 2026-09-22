import { describe, expect, it } from "vitest";

import type { Order, OrderItem, SellerOrder } from "./types";
import {
  buildTimeline,
  canCancelOrder,
  canReviewItem,
  orderStatusKey,
  orderStatusTone,
  paymentStatusKey,
  sellerStatusKey,
  totalUnits,
} from "./status";

/**
 * Pruebas de las reglas de estado del pedido.
 *
 * Son funciones puras y aquí se protege lo importante: que la interfaz **no invente** nada. Un estado desconocido
 * se marca como desconocido (no se pinta como «pagado»), cancelar solo se permite en `pending` (lo mismo que
 * acepta el backend) y la línea de tiempo no pone fechas que la API no ha confirmado.
 */

function item(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "item-1",
    variant_id: "variant-1",
    product_id: "product-1",
    product_title: "Audífonos",
    variant_label: "negro",
    sku: "AUD-NEG",
    currency: "COP",
    unit_price: "299900.00",
    quantity: 2,
    line_total: "599800.00",
    commission_rate: "10.00",
    commission_amount: "59980.00",
    ...overrides,
  };
}

function sellerOrder(overrides: Partial<SellerOrder> = {}): SellerOrder {
  return {
    id: "seller-order-1",
    store_id: "store-1",
    status: "paid",
    currency: "COP",
    subtotal: "599800.00",
    shipping_cost: "0.00",
    discount_amount: "0.00",
    commission_amount: "59980.00",
    payout_amount: "539820.00",
    items: [item()],
    ...overrides,
  };
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    order_number: "MV-2026-0001",
    status: "pending",
    payment_status: "pending",
    currency: "COP",
    subtotal: "599800.00",
    shipping_total: "0.00",
    discount_total: "0.00",
    total: "599800.00",
    shipping_address: {},
    notes: null,
    created_at: "2026-09-22T10:00:00Z",
    seller_orders: [sellerOrder()],
    ...overrides,
  } as unknown as Order;
}

describe("claves de estado", () => {
  it("reconoce los estados reales del backend", () => {
    expect(orderStatusKey("paid")).toBe("paid");
    expect(paymentStatusKey("failed")).toBe("failed");
    expect(sellerStatusKey("shipped")).toBe("shipped");
  });

  it("marca como desconocido lo que no reconoce (nunca lo disfraza de otro estado)", () => {
    expect(orderStatusKey("draft")).toBe("unknown");
    expect(paymentStatusKey("chargeback")).toBe("unknown");
    expect(sellerStatusKey("")).toBe("unknown");
    expect(orderStatusTone(orderStatusKey("draft"))).toBe("neutral");
  });
});

describe("canCancelOrder", () => {
  it("solo deja cancelar lo que sigue pendiente de pago", () => {
    expect(canCancelOrder({ status: "pending" })).toBe(true);
    expect(canCancelOrder({ status: "paid" })).toBe(false);
    expect(canCancelOrder({ status: "completed" })).toBe(false);
    expect(canCancelOrder({ status: "cancelled" })).toBe(false);
  });
});

describe("canReviewItem", () => {
  it("exige que la sub-orden esté entregada y que el producto no se haya reseñado", () => {
    const line = { product_id: "product-1" };

    expect(canReviewItem({ status: "delivered" }, line, new Set())).toBe(true);
    expect(canReviewItem({ status: "delivered" }, line, new Set(["product-1"]))).toBe(false);
    expect(canReviewItem({ status: "shipped" }, line, new Set())).toBe(false);
    expect(canReviewItem({ status: "delivered" }, { product_id: null }, new Set())).toBe(false);
  });
});

describe("buildTimeline", () => {
  it("con un pedido pendiente marca el pago como paso actual y lo demás como próximo", () => {
    const timeline = buildTimeline(order(), { paidAt: null, shipments: [] });

    expect(timeline.map((entry) => entry.state)).toEqual([
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
    expect(timeline[1]?.date).toBeNull();
  });

  it("con el pago confirmado y sin envío marca el pago como hecho y el envío como actual si está en preparación", () => {
    const timeline = buildTimeline(
      order({
        status: "paid",
        payment_status: "paid",
        seller_orders: [sellerOrder({ status: "processing" })],
      }),
      { paidAt: "2026-09-22T11:00:00Z", shipments: [] },
    );

    expect(timeline.map((entry) => entry.state)).toEqual(["done", "done", "current", "upcoming"]);
    expect(timeline[1]?.date).toBe("2026-09-22T11:00:00Z");
  });

  it("usa las fechas reales del envío cuando existen", () => {
    const timeline = buildTimeline(
      order({
        status: "paid",
        payment_status: "paid",
        seller_orders: [sellerOrder({ status: "shipped" })],
      }),
      {
        paidAt: "2026-09-22T11:00:00Z",
        shipments: [
          { status: "in_transit", shipped_at: "2026-09-23T08:00:00Z", delivered_at: null },
        ],
      },
    );

    expect(timeline[2]?.state).toBe("done");
    expect(timeline[2]?.date).toBe("2026-09-23T08:00:00Z");
  });

  it("en un pedido cancelado no promete pasos que no van a ocurrir", () => {
    const timeline = buildTimeline(order({ status: "cancelled" }), { paidAt: null, shipments: [] });

    expect(timeline.map((entry) => entry.labelKey)).toEqual(["created", "cancelled"]);
    expect(timeline[1]?.state).toBe("failed");
  });
});

describe("totalUnits", () => {
  it("suma las unidades de todas las sub-órdenes", () => {
    expect(
      totalUnits({
        seller_orders: [
          sellerOrder({ items: [item({ id: "a", quantity: 2 }), item({ id: "b", quantity: 1 })] }),
          sellerOrder({ id: "otro", items: [item({ id: "c", quantity: 3 })] }),
        ],
      }),
    ).toBe(6);
  });
});
