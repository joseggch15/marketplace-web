import { describe, expect, it } from "vitest";

import { SALES_PAGE_LIMIT, summarizeSales, sumAmounts } from "./metrics";
import type { SellerOrderPage } from "./types";

/**
 * Pruebas de las tres cifras del panel.
 *
 * Lo importante aquí es el dinero (se suma en céntimos, no con `number`) y la **honestidad** del número: cuando
 * no se ha leído todo el histórico, el resumen tiene que decirlo.
 */

function page(
  subtotals: string[],
  payouts: string[],
  nextCursor: string | null = null,
): SellerOrderPage {
  return {
    items: subtotals.map((subtotal, index) => ({
      id: `sale-${index}`,
      order_id: `order-${index}`,
      status: "pending",
      currency: "COP",
      subtotal,
      commission_amount: "0.00",
      payout_amount: payouts[index],
      created_at: "2026-09-22T12:00:00Z",
    })),
    next_cursor: nextCursor,
  };
}

describe("sumAmounts", () => {
  it("suma decimales sin el error de la coma flotante", () => {
    // 0.1 + 0.2 en coma flotante da 0.30000000000000004.
    expect(sumAmounts(["0.10", "0.20"])).toBe("0.30");
  });

  it("suma importes grandes con céntimos", () => {
    expect(sumAmounts(["999999999.99", "0.01"])).toBe("1000000000.00");
  });

  it("trata un importe ilegible como cero en lugar de romper la pantalla", () => {
    expect(sumAmounts(["100.00", "", "no-es-un-numero", "50.50"])).toBe("150.50");
  });

  it("devuelve 0.00 sin importes", () => {
    expect(sumAmounts([])).toBe("0.00");
  });
});

describe("summarizeSales", () => {
  it("suma ventas, liquidación y pedidos de todas las páginas", () => {
    const metrics = summarizeSales(
      [page(["100.00"], ["90.00"], "cursor-2"), page(["50.50", "20.00"], ["45.00", "18.00"])],
      7,
    );

    expect(metrics.sales).toBe("170.50");
    expect(metrics.payout).toBe("153.00");
    expect(metrics.orders).toBe(3);
    expect(metrics.products).toBe(7);
    expect(metrics.complete).toBe(true);
    expect(metrics.pagesRead).toBe(2);
  });

  it("marca el resumen como incompleto si quedaban más ventas (se alcanzó el tope)", () => {
    const metrics = summarizeSales([page(["10.00"], ["9.00"], "cursor-mas")], 1);

    expect(metrics.complete).toBe(false);
    expect(metrics.pageLimit).toBe(SALES_PAGE_LIMIT);
  });

  it("marca el resumen como incompleto si una página no llegó", () => {
    const metrics = summarizeSales([page(["10.00"], ["9.00"]), null], 1);

    expect(metrics.complete).toBe(false);
    expect(metrics.pagesRead).toBe(1);
    expect(metrics.sales).toBe("10.00");
  });
});
