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
 * Pruebas end-to-end de la Fase 8 (panel del vendedor).
 *
 * Se ejecutan **contra el backend real y con la cuenta de demostración**, que es una vendedora con tienda
 * aprobada: el panel no se puede probar con datos inventados porque quien decide qué se puede hacer es el
 * backend (estado de la tienda, estado del producto y máquina de estados de la venta).
 *
 * Qué comprueban los dos flujos críticos:
 * 1. **Vender un producto nuevo**: crear un producto con dos variantes (los valores se escriben en los atributos
 *    de una categoría que de verdad los tenga), publicarlo y cambiar el stock de una variante.
 * 2. **Gestionar una venta**: comprar como comprador (pago de prueba aprobado), entrar al panel, preparar la
 *    venta, cargar la transportadora y la guía, marcarla como enviada y entregarla.
 *
 * Los datos no se inventan en ningún punto: la categoría con atributos se busca preguntando a la API y el
 * producto que se compra se busca en el catálogo real.
 */

/** Espera a un `id` de producto en la URL tras crear uno. */
const NEW_PRODUCT_URL = /\/es\/seller\/products\/[0-9a-f-]{36}$/;

/** Categoría del formulario que **sí** tiene atributos: sin ellos no se pueden crear variantes. */
async function findCategoryWithAttributes(page: Page): Promise<{ id: string; label: string }> {
  const options = await page.locator("#product-category option").evaluateAll((elements) =>
    elements.map((element) => ({
      value: (element as HTMLOptionElement).value,
      label: (element as HTMLOptionElement).textContent ?? "",
    })),
  );

  for (const option of options) {
    const response = await page.request.get(
      `/api/seller/categories/${encodeURIComponent(option.value)}/attributes`,
    );

    if (!response.ok()) {
      continue;
    }

    const attributes = (await response.json()) as unknown[];

    if (attributes.length > 0) {
      return { id: option.value, label: option.label };
    }
  }

  throw new Error(
    "Ninguna categoría del catálogo tiene atributos: no se puede crear un producto con variantes.",
  );
}

test.describe("panel del vendedor", () => {
  test("crea un producto con dos variantes, lo publica y cambia el stock", async ({ page }) => {
    await signInWithDemoSession(page);

    // El tablero: estado de la tienda y las tres cifras.
    await page.goto(`/${LOCALE}/seller`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page, "panel del vendedor (resumen)");

    await page.goto(`/${LOCALE}/seller/products/new`);
    await expect(page.getByRole("heading", { level: 2, name: /nuevo producto/i })).toBeVisible();

    const category = await findCategoryWithAttributes(page);
    await page.selectOption("#product-category", category.id);

    // Con la categoría elegida se cargan sus atributos y se escribe un valor por atributo.
    // El SKU se forma con el prefijo + los valores + un número, y es **único en todo el catálogo**: si dos
    // corridas usaran el mismo prefijo, la segunda recibiría 409 `sku_already_exists`. Se marca la hora.
    const stamp = Date.now().toString().slice(-6);
    const title = `E2E Bolso ${stamp}`;
    await page.getByLabel(/^título$/i).fill(title);
    await page.getByLabel(/^precio$/i).fill("45000.00");
    await page.getByLabel(/unidades por variante/i).fill("3");
    await page.getByLabel(/código base/i).fill(`E2E${stamp}`);

    const firstAttribute = page.locator('input[id^="product-attribute-"]').first();
    await expect(firstAttribute).toBeVisible();
    await firstAttribute.fill("Rojo, Azul");

    // La vista previa dice cuántas variantes se van a crear antes de enviar nada.
    await expect(page.getByText(/2 variantes/i)).toBeVisible();

    const created = await clickAndWaitForResponse(
      page,
      page.getByRole("button", { name: /crear producto/i }),
      "/api/seller/products",
    );
    await expectStatus(created, 201, "crear el producto");

    await page.waitForURL(NEW_PRODUCT_URL, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
    await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
    await expectNoA11yViolations(page, "panel del vendedor (producto)");

    // Publicar: el producto nace en borrador y este es el paso que lo hace visible.
    const published = await clickAndWaitForResponse(
      page,
      page.getByRole("button", { name: /^publicar$/i }),
      "/publication",
    );
    await expectStatus(published, 200, "publicar el producto");
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();

    // Cambiar el stock de la primera variante (valor absoluto: lo que hay en el almacén).
    const stockInput = page.locator('input[id^="stock-"]').first();
    await expect(stockInput).toBeVisible();
    await stockInput.fill("9");

    const savedStock = await clickAndWaitForResponse(
      page,
      page.getByRole("button", { name: /guardar stock/i }).first(),
      "/stock",
    );
    await expectStatus(savedStock, 200, "cambiar el stock de la variante");
    await expect(page.getByText(/stock actualizado/i)).toBeVisible();
  });

  test("gestiona una venta: la prepara, la envía con guía y la entrega", async ({
    page,
    request,
  }) => {
    const product = await findDemoProduct(request);

    await signInWithDemoSession(page);
    await clearCart(page);
    await addToCartFromProduct(page, product);

    // Compra con el pago de prueba aprobado (el mismo camino que el webhook del backend).
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

    // La venta más reciente es la primera de la lista del panel.
    await page.goto(`/${LOCALE}/seller/orders`);
    await expectNoA11yViolations(page, "panel del vendedor (ventas)");

    const sale = page.locator("article").first();
    await expect(sale).toBeVisible();

    const prepared = await clickAndWaitForResponse(
      page,
      sale.getByRole("button", { name: /^preparar$/i }),
      "/status",
    );
    await expectStatus(prepared, 200, "preparar la venta");
    await expect(sale.getByText(/en preparación/i)).toBeVisible();

    // Preparar el envío: transportadora y guía son datos del vendedor; el costo puede ser 0.00.
    await sale.getByLabel(/^transportadora$/i).fill("Servientrega");
    await sale.getByLabel(/número de guía/i).fill("E2E-GUIA-123");
    await sale.getByLabel(/costo del envío/i).fill("0.00");

    const shipment = await clickAndWaitForResponse(
      page,
      sale.getByRole("button", { name: /guardar envío/i }),
      "/shipment",
    );
    await expectStatus(shipment, 201, "preparar el envío");
    await expect(sale.getByText(/guardamos el envío/i)).toBeVisible();

    // Enviado: la sub-orden pasa a `shipped` (lo hace el backend al anotar el estado del envío).
    const shipped = await clickAndWaitForResponse(
      page,
      sale.getByRole("button", { name: /marcar como enviado/i }),
      "/shipment/status",
    );
    await expectStatus(shipped, 200, "marcar el envío como enviado");
    await expect(sale.getByText("Enviada", { exact: true })).toBeVisible();

    // Entregado: se cierra la venta y el comprador ya puede reseñar.
    const delivered = await clickAndWaitForResponse(
      page,
      sale.getByRole("button", { name: /marcar como entregado/i }),
      "/shipment/status",
    );
    await expectStatus(delivered, 200, "marcar el envío como entregado");
    await expect(sale.getByText("Entregada", { exact: true })).toBeVisible();
  });
});
