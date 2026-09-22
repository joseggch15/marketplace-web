import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Pruebas de la Fase 0: la portada funciona, los idiomas cambian, el 404 se ve bien y **no hay errores
 * de accesibilidad** (axe) ni en modo claro ni en modo oscuro.
 */

const LOCALES = ["es", "en"] as const;

/** Reglas de WCAG 2.2 AA, el nivel que exige el proyecto. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const locale of LOCALES) {
  test.describe(`portada /${locale}`, () => {
    test("carga, muestra el estado real del backend y no tiene errores de accesibilidad", async ({
      page,
    }) => {
      await page.goto(`/${locale}`);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // El estado del backend es contenido real (puede estar disponible o no, pero siempre se informa).
      await expect(page.getByRole("heading", { name: /estado|status/i })).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("no tiene errores de accesibilidad en modo oscuro", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(`/${locale}`);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("el foco es visible al navegar con el teclado", async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.keyboard.press("Tab");

      const focused = page.locator(":focus");
      await expect(focused).toBeVisible();
      // El primer elemento enfocable es el enlace de "saltar al contenido".
      await expect(focused).toHaveAttribute("href", "#main-content");
    });

    test("la búsqueda se envía por la URL y conserva el idioma", async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.getByLabel(/buscar|search/i).first().fill("zapatos");
      await page.getByRole("button", { name: /buscar|search/i }).first().click();

      await page.waitForURL(`**/${locale}/search?q=zapatos`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/search\\?q=zapatos`));
    });

    test("una ruta inexistente muestra la página 404 traducida", async ({ page }) => {
      const response = await page.goto(`/${locale}/esta-ruta-no-existe`);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test("el cambio de idioma conserva la página", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: /idioma|language/i }).click();
  await page.getByRole("menuitemradio", { name: /english/i }).click();

  await page.waitForURL("**/en");
  await expect(page).toHaveURL(/\/en$/);
});
