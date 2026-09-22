import { expect, test, type Page } from "@playwright/test";

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
 * Pruebas end-to-end de la Fase 6 (checkout y pago de prueba).
 *
 * Se ejecutan **contra el backend real y con los datos de demostración**, porque lo que hay que comprobar es el
 * recorrido completo: carrito → checkout (dirección, envío y cupón, pago) → pedido creado en el backend → pago
 * simulado → confirmación.
 *
 * Dos decisiones de cómo están escritas:
 *
 * - **La sesión de demostración se reutiliza** (`support/demo.ts`): el backend limita los intentos de entrada a 5
 *   por minuto y por IP, así que cada prueba no puede permitirse un inicio de sesión propio.
 * - **El caso de rechazo se comprueba una sola vez por corrida**: cada caso crea pedidos de verdad en la base de
 *   datos de demostración, y el rechazo no depende del tamaño de la pantalla.
 */

const ORDER_URL = /\/es\/orders\/[0-9a-f-]{36}\?paid=1$/;

/** El pedido más reciente de la cuenta, con su estado: se lee a través del BFF, igual que lo hace la aplicación. */
async function latestOrder(page: Page): Promise<{
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
}> {
  const response = await page.request.get("/api/orders?limit=1");
  expect(response.ok(), "el BFF tiene que devolver mis compras").toBeTruthy();

  const body = (await response.json()) as {
    items: { id: string; order_number: string; status: string; payment_status: string }[];
  };

  expect(body.items.length, "tiene que existir al menos un pedido").toBeGreaterThan(0);

  return body.items[0];
}

test.describe("checkout", () => {
  test("el comprador paga en modo de prueba y termina en la confirmación", async ({
    page,
    request,
  }) => {
    const product = await findDemoProduct(request);

    await signInWithDemoSession(page);
    await clearCart(page);
    await addToCartFromProduct(page, product);

    // El checkout abre en el paso de dirección: se audita la accesibilidad de esa pantalla antes de rellenarla.
    await page.goto(`/${LOCALE}/checkout`);
    await expect(page.getByRole("heading", { name: /finalizar compra/i })).toBeVisible();
    await expectNoA11yViolations(page, "checkout (pantalla inicial)");

    await reachCheckoutPaymentStep(page);
    await expectNoA11yViolations(page, "checkout (paso de pago)");

    // Crear el pedido: el servidor calcula los importes y responde 201 con la orden.
    const created = await clickAndWaitForResponse(
      page,
      page.getByRole("button", { name: /^pagar/i }),
      "/api/orders",
    );
    await expectStatus(created, 201, "crear el pedido");

    // Aprobar el pago de prueba: es el mismo camino del webhook firmado del backend.
    const paid = await clickAndWaitForResponse(
      page,
      page.getByRole("button", { name: /aprobar pago/i }),
      "/api/payments/",
    );
    await expectStatus(paid, 200, "aprobar el pago de prueba");

    await page.waitForURL(ORDER_URL, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /¡compra confirmada!/i })).toBeVisible();

    const order = await latestOrder(page);
    expect(order.status).toBe("paid");
    expect(order.payment_status).toBe("paid");
    await expect(
      page.getByRole("heading", { level: 1, name: new RegExp(order.order_number) }),
    ).toBeVisible();

    // Y en «mis compras» aparece como pagado.
    await page.goto(`/${LOCALE}/orders`);
    await expect(page.getByText(order.order_number)).toBeVisible();
    await expect(page.getByText("Pagado", { exact: true }).first()).toBeVisible();
  });

  test("un pago rechazado no cobra, deja el pedido pendiente y se puede reintentar", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "escritorio-chromium",
      "El rechazo se comprueba una sola vez por corrida: cada caso crea pedidos reales.",
    );

    const product = await findDemoProduct(request);

    await signInWithDemoSession(page);
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

    // El comprador sigue en el checkout, con el aviso de que no se cobró nada.
    // El aviso de error es un `role="alert"`: el mismo texto aparece además como nota del paso de pago, así que
    // se apunta al aviso y no a cualquier párrafo que contenga esa frase.
    await expect(page.getByRole("alert").filter({ hasText: /no se cobró nada/i })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`/${LOCALE}/checkout`);

    // Y el pedido existe de verdad, en estado pendiente.
    const pending = await latestOrder(page);
    expect(pending.status).toBe("pending");
    expect(pending.payment_status).not.toBe("paid");

    // Se puede reintentar: el mismo intento de pago se aprueba y el pedido pasa a pagado.
    const retried = await clickAndWaitForResponse(
      page,
      page.getByRole("button", { name: /aprobar pago/i }),
      "/api/payments/",
    );
    await expectStatus(retried, 200, "reintentar el pago de prueba");

    await page.waitForURL(ORDER_URL, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /¡compra confirmada!/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: new RegExp(pending.order_number) }),
    ).toBeVisible();
  });
});
