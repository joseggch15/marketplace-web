import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Pruebas end-to-end de la Fase 4 (página de producto).
 *
 * Se ejecutan **sin backend a propósito**, como las de las fases anteriores: comprueban lo que debe funcionar
 * aunque la API esté caída (la página carga, explica el problema, responde 404 cuando la dirección no es un
 * identificador) y que no hay errores de accesibilidad en claro ni en oscuro, a 375 px y a 1280 px.
 *
 * Nota de honestidad: no se comprueba "este producto muestra sus 3 variantes", porque eso depende de datos
 * reales que la prueba no controla. La ficha con datos reales se revisa con las capturas de la fase.
 */

const LOCALES = ["es", "en"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** UUID válido para que pase la validación de la ruta, pero que no corresponde a ningún producto. */
const MISSING_PRODUCT_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

/**
 * Espera a que el documento tenga `lang`.
 *
 * Por qué hace falta: los 404 de una ruta dinámica los sirve Next.js con su **documento de error**
 * (`<html id="__next_error__">`), que en el HTML inicial no lleva `lang`; lo añade React al hidratar, así que
 * el documento final sí cumple WCAG 3.1.1. Auditar antes de la hidratación mediría un estado a medias (y hacía
 * la prueba intermitente). Es una limitación conocida del framework, anotada en
 * `docs/decisiones/0010-pagina-de-producto.md`.
 */
async function waitForDocumentLanguage(page: Page): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("lang", /^(es|en)$/);
}

for (const locale of LOCALES) {
  test.describe(`producto /${locale}`, () => {
    test("una dirección que no es un identificador responde 404 y es accesible", async ({ page }) => {
      const response = await page.goto(`/${locale}/p/no-es-un-identificador`);

      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await waitForDocumentLanguage(page);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("la ficha de un producto inexistente se explica o muestra el 404, nunca se rompe", async ({
      page,
    }) => {
      const response = await page.goto(`/${locale}/p/${MISSING_PRODUCT_ID}`);

      // Con backend: el producto no existe (404). Sin backend: la página cuenta que no pudo cargarlo (200).
      expect([200, 404]).toContain(response?.status());
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await waitForDocumentLanguage(page);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("no tiene errores de accesibilidad en modo oscuro", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(`/${locale}/p/${MISSING_PRODUCT_ID}`);
      await waitForDocumentLanguage(page);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("un cursor de reseñas manipulado en la dirección se ignora", async ({ page }) => {
      const response = await page.goto(
        `/${locale}/p/${MISSING_PRODUCT_ID}?reviews_cursor=%%%<script>alert(1)</script>`,
      );

      expect([200, 404]).toContain(response?.status());
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });
}
