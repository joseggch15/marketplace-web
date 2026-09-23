import { expect, test, type Page } from "@playwright/test";

import { expectNoA11yViolations, findDemoProduct, LOCALE, signInAsAdmin } from "./support/demo";

/**
 * Pruebas end-to-end de la Fase 9 (panel de administración).
 *
 * Se ejecutan con la cuenta de **administración de demostración** que crea `scripts/seed-demo.mjs`; si no está en
 * el entorno, las pruebas se omiten con un mensaje que dice cómo crearla (`signInAsAdmin`).
 *
 * Qué se comprueba:
 * 1. Las tres pantallas de lectura (cola de tiendas, todas las tiendas y usuarios) cargan con datos reales, sin
 *    errores de accesibilidad y sin revelar el panel a quien no es administrador.
 * 2. La **moderación de verdad**: se publica una pregunta como comprador, se oculta desde el panel y se vuelve a
 *    publicar.
 *
 * Las tiendas **no** se suspenden en las pruebas a propósito: suspender la tienda de demostración dejaría el
 * catálogo sin productos y rompería el resto de la suite. La pantalla se comprueba leyendo, que es donde está el
 * riesgo de esta fase (autorización, listados y acciones).
 */

/** Espera a que el aviso de que la lista se ha refrescado esté visible. */
async function expectRefresh(page: Page, done: string | RegExp): Promise<void> {
  await expect(page.getByText(done)).toBeVisible();
}

test.describe("panel de administración", () => {
  test("un comprador no puede entrar y el administrador sí", async ({ page }) => {
    // Sin sesión, /admin lleva al formulario de entrar.
    await page.goto(`/${LOCALE}/admin`);
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/login`));

    await signInAsAdmin(page);

    await page.goto(`/${LOCALE}/admin`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page, "panel de administración (cola de tiendas)");

    // Todas las tiendas y el directorio de usuarios: lectura con datos reales.
    await page.goto(`/${LOCALE}/admin/stores`);
    await expect(page.getByText("Tienda Demo").first()).toBeVisible();

    await page.goto(`/${LOCALE}/admin/users`);
    await expect(page.getByText(/@tienda-demo\.com/i).first()).toBeVisible();
    await expectNoA11yViolations(page, "panel de administración (usuarios)");
  });

  test("modera una pregunta: la oculta y la vuelve a publicar", async ({ page, request }) => {
    const product = await findDemoProduct(request);

    await signInAsAdmin(page);

    // Una pregunta real, publicada como cualquier comprador (por el BFF, como el formulario de la ficha).
    const body = `Pregunta E2E ${Date.now()}`;
    const created = await page.request.post(`/api/products/${product.productId}/questions`, {
      data: { body },
    });
    expect(created.ok(), "la pregunta tiene que crearse").toBeTruthy();

    await page.goto(`/${LOCALE}/admin/questions`);
    await expect(page.getByRole("heading", { level: 2, name: /preguntas/i })).toBeVisible();
    await expect(page.getByText(body)).toBeVisible();

    // Ocultar: la acción destructiva pide confirmación y el motivo es opcional.
    await page
      .getByRole("button", { name: /^ocultar$/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /sí, ocultar/i })
      .first()
      .click();
    await expectRefresh(page, /hecho\. la lista se ha actualizado/i);

    // Con el filtro de ocultas aparece, y desde ahí se vuelve a publicar.
    await page.goto(`/${LOCALE}/admin/questions?published=false`);
    await expect(page.getByText(body)).toBeVisible();
    await page
      .getByRole("button", { name: /^publicar$/i })
      .first()
      .click();
    await expectRefresh(page, /hecho\. la lista se ha actualizado/i);

    // Publicada otra vez: deja de estar en el filtro de ocultas.
    await expect(page.getByText(body)).toHaveCount(0);
  });
});
