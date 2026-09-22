import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import {
  addToCartFromProduct,
  clearCart,
  clickAndWaitForResponse,
  expectNoA11yViolations,
  expectStatus,
  findDemoProduct,
  LOCALE,
  reachCheckoutPaymentStep,
  signInWithDemoSession,
} from "./support/demo";

/**
 * Pruebas end-to-end de la Fase 7 (mis compras).
 *
 * Comprueban el recorrido real: crear un pedido que se queda **pendiente de pago** (rechazando el pago de prueba),
 * verlo en la lista, abrir su detalle, comprobar que la reseña **no** se ofrece porque todavía no está entregado y
 * cancelarlo para ver «cancelado».
 *
 * El pedido se crea rechazando el pago a propósito: es la única forma honesta de tener un pedido `pending` desde
 * el navegador, y el backend solo permite cancelar en ese estado. Los estados que necesitan al vendedor (preparado,
 * enviado, entregado) se cubren en las pruebas del panel del vendedor (F8), donde sí se pueden provocar.
 */

/** Estado del pedido según la API, leído a través del BFF: es lo que la aplicación usa de verdad. */
type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
};

async function latestOrder(page: Page): Promise<OrderSummary> {
  const response = await page.request.get("/api/orders?limit=1");
  expect(response.ok(), "el BFF tiene que devolver mis compras").toBeTruthy();

  const body = (await response.json()) as { items: OrderSummary[] };
  expect(body.items.length, "tiene que existir al menos un pedido").toBeGreaterThan(0);

  return body.items[0];
}

/** Crea un pedido que se queda pendiente de pago (el pago de prueba se rechaza) y lo devuelve. */
async function createPendingOrder(page: Page, request: APIRequestContext): Promise<OrderSummary> {
  const product = await findDemoProduct(request);

  await clearCart(page);
  await addToCartFromProduct(page, product);
  await reachCheckoutPaymentStep(page);

  const created = await clickAndWaitForResponse(
    page,
    page.getByRole("button", { name: /^pagar/i }),
    "/api/orders",
  );
  await expectStatus(created, 201, "crear el pedido");

  const rejected = await clickAndWaitForResponse(
    page,
    page.getByRole("button", { name: /rechazar pago/i }),
    "/api/payments/",
  );
  await expectStatus(rejected, 200, "rechazar el pago de prueba");
  // El aviso (role="alert"), no la nota del paso de pago: las dos llevan el mismo texto.
  await expect(page.getByRole("alert").filter({ hasText: /no se cobró nada/i })).toBeVisible();

  const order = await latestOrder(page);
  expect(order.status, "un pago rechazado deja el pedido pendiente").toBe("pending");

  return order;
}

test.describe("mis compras", () => {
  test("el pedido pendiente se ve, se puede cancelar y no ofrece reseña antes de entregarse", async ({
    page,
    request,
  }) => {
    await signInWithDemoSession(page);

    const order = await createPendingOrder(page, request);

    // 1. La lista lo muestra con su número y su estado, y se audita la accesibilidad de la página nueva.
    await page.goto(`/${LOCALE}/orders`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(order.order_number)).toBeVisible();
    await expect(page.getByText("Pendiente de pago", { exact: true }).first()).toBeVisible();
    await expectNoA11yViolations(page, "mis compras (lista)");

    // 2. El detalle enseña el estado, el seguimiento todavía vacío y **no** ofrece reseña (no está entregado).
    await page.goto(`/${LOCALE}/orders/${order.id}`);
    await expect(
      page.getByRole("heading", { level: 1, name: new RegExp(order.order_number) }),
    ).toBeVisible();
    await expect(page.getByText(/todavía no ha marcado este pedido como enviado/i)).toBeVisible();
    await expect(
      page.getByText(/podrás reseñar este producto cuando el pedido esté entregado/i).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /escribir reseña/i })).toHaveCount(0);
    await expectNoA11yViolations(page, "mis compras (detalle)");

    // 3. Cancelar pide confirmación dentro de la tarjeta y no se dispara con un solo clic.
    await page.getByRole("button", { name: /^cancelar pedido$/i }).click();
    await expect(page.getByText(/¿cancelar el pedido/i)).toBeVisible();
    await page.getByRole("button", { name: /sí, cancelar el pedido/i }).click();

    await expect(page.getByText("Cancelado", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^cancelar pedido$/i })).toHaveCount(0);

    const cancelled = await latestOrder(page);
    expect(cancelled.id).toBe(order.id);
    expect(cancelled.status).toBe("cancelled");

    // 4. Y en la lista también aparece cancelado.
    await page.goto(`/${LOCALE}/orders`);
    await expect(page.getByText(order.order_number)).toBeVisible();
    await expect(page.getByText("Cancelado", { exact: true }).first()).toBeVisible();
  });

  test("sin sesión, mis compras lleva al formulario de entrar", async ({ page }) => {
    // No se filtra ninguna compra a quien no ha entrado: el servidor redirige y guarda a dónde quería ir.
    await page.goto(`/${LOCALE}/orders`);
    await page.waitForURL(`**/${LOCALE}/login**`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
