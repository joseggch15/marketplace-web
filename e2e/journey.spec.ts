import { expect, test } from "@playwright/test";

import {
  addToCartFromProduct,
  clearCart,
  clickAndWaitForResponse,
  expectNoA11yViolations,
  expectStatus,
  findDemoProduct,
  LOCALE,
  reachCheckoutPaymentStep,
  signInAsAdmin,
  signInWithDemoSession,
} from "./support/demo";

/**
 * Recorrido completo del marketplace (F10): registrarse, comprar, vender y administrar.
 *
 * Es **una sola prueba** a propósito: lo que se quiere comprobar es que las cuatro fases encajan entre sí con
 * datos reales (la cuenta que se registra aparece en el panel de administración; la venta que se paga en el
 * checkout es la que el vendedor prepara). Cada fase por separado ya está probada en su propia suite; aquí lo que
 * se prueba es el hilo.
 *
 * Solo se ejecuta en **escritorio**: son los mismos pasos que ya se comprueban en móvil en las otras suites, y
 * repetirlos aquí solo alargaría la corrida sin aportar información nueva.
 */
test.describe("recorrido completo", () => {
  test("registrarse, comprar, vender y administrar", async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== "escritorio-chromium", "El recorrido se comprueba una vez.");

    // 1. Registro: una cuenta nueva de verdad, con la sesión ya iniciada al terminar.
    const email = `comprador-${Date.now()}@tienda-demo.com`;
    const password = "demo-marketplace-2026";

    await page.goto(`/${LOCALE}/register`);
    await page.getByLabel(/nombre y apellidos/i).fill("Comprador de prueba");
    await page.getByLabel(/correo electrónico/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByLabel(/repite la contraseña/i).fill(password);
    await page.getByRole("button", { name: /crear cuenta/i }).click();

    await expect(page.getByText(/tu cuenta está creada/i)).toBeVisible({ timeout: 15_000 });

    // La cuenta nueva tiene sesión: sus datos están en «Mi cuenta».
    await page.goto(`/${LOCALE}/account`);
    await expect(page.getByText(email)).toBeVisible();

    // 2. Comprar: carrito, checkout y pago de prueba aprobado (la sesión de demostración ya tiene direcciones).
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

    const paid = await clickAndWaitForResponse(
      page,
      page.getByRole("button", { name: /aprobar pago/i }),
      "/api/payments/",
    );
    await expectStatus(paid, 200, "aprobar el pago de prueba");

    await page.waitForURL(/\/es\/orders\/[0-9a-f-]{36}\?paid=1$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /¡compra confirmada!/i })).toBeVisible();

    // 3. Vender: la venta recién pagada es la primera de la lista y el vendedor la prepara y la entrega.
    await page.goto(`/${LOCALE}/seller/orders`);
    const sale = page.locator("article").first();
    await expect(sale).toBeVisible();

    const prepared = await clickAndWaitForResponse(
      page,
      sale.getByRole("button", { name: /^preparar$/i }),
      "/status",
    );
    await expectStatus(prepared, 200, "preparar la venta");

    await sale.getByLabel(/^transportadora$/i).fill("Servientrega");
    await sale.getByLabel(/número de guía/i).fill("RECORRIDO-1");
    await sale.getByLabel(/costo del envío/i).fill("0.00");

    const shipment = await clickAndWaitForResponse(
      page,
      sale.getByRole("button", { name: /guardar envío/i }),
      "/shipment",
    );
    await expectStatus(shipment, 201, "preparar el envío");
    await expectNoA11yViolations(page, "recorrido (ventas del vendedor)");

    // 4. Administrar: la cuenta recién registrada aparece en el directorio de usuarios.
    //    `signInAsAdmin` omite la prueba si no hay cuenta de administración en el entorno.
    await signInAsAdmin(page);

    await page.goto(`/${LOCALE}/admin/users?q=${encodeURIComponent(email)}`);
    await expect(page.getByText(email)).toBeVisible();
  });
});
