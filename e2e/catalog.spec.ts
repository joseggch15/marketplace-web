import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Pruebas end-to-end de la Fase 3 (catálogo y búsqueda).
 *
 * Se ejecutan **sin backend a propósito**, igual que las de la F2: comprueban lo que debe funcionar aunque la
 * API esté caída (que la página cargue, que los filtros escriban en la URL, que no haya errores de
 * accesibilidad) y las reglas de SEO que no dependen de datos.
 *
 * Nota de honestidad: no se comprueba "hay 12 resultados", porque eso depende de datos reales que la prueba
 * no controla. Lo que sí se comprueba es que los filtros se aplican en la dirección, que es la parte del
 * comportamiento que nos pertenece.
 */

const LOCALES = ["es", "en"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const locale of LOCALES) {
  test.describe(`catálogo /${locale}`, () => {
    test("la búsqueda carga, tiene filtros y no tiene errores de accesibilidad", async ({
      page,
    }) => {
      await page.goto(`/${locale}/search`);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const filters = page.getByRole("form", { name: /filtros|catalog filters/i });
      await expect(filters).toBeVisible();
      await expect(filters.getByLabel(/qué buscas|what are you looking/i)).toBeVisible();
      await expect(filters.getByLabel(/ordenar por|sort by/i)).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("los filtros se aplican en la dirección", async ({ page }) => {
      await page.goto(`/${locale}/search`);

      const filters = page.getByRole("form", { name: /filtros|catalog filters/i });

      await filters.getByLabel(/qué buscas|what are you looking/i).fill("zapatos");
      await filters.getByRole("button", { name: /^(buscar|search)$/i }).click();
      await page.waitForURL(`**/${locale}/search?**`);
      expect(page.url()).toContain("q=zapatos");

      // Cambiar el orden vuelve a navegar y conserva la búsqueda (los filtros viven en la URL).
      await filters.getByLabel(/ordenar por|sort by/i).selectOption("price_asc");
      await filters.getByRole("button", { name: /^(buscar|search)$/i }).click();
      await page.waitForURL("**sort=price_asc**");
      expect(page.url()).toContain("q=zapatos");
    });

    test("la página de resultados no se indexa", async ({ page }) => {
      await page.goto(`/${locale}/search`);

      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });

    test("una categoría que no existe muestra la página 404 traducida", async ({ page }) => {
      const response = await page.goto(`/${locale}/c/esta-categoria-no-existe`);

      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });
}
