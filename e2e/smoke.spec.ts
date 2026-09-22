import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Pruebas de la portada: la tienda se ve, el buscador funciona, **no aparece nada de andamiaje** (el estado del
 * backend, el plan de fases ni la etiqueta «Fase 0») y no hay errores de accesibilidad (axe) ni en modo claro ni
 * en modo oscuro.
 */

const LOCALES = ["es", "en"] as const;

/** Reglas de WCAG 2.2 AA, el nivel que exige el proyecto. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const locale of LOCALES) {
  test.describe(`portada /${locale}`, () => {
    test("muestra el buscador protagonista y no tiene errores de accesibilidad", async ({
      page,
    }) => {
      await page.goto(`/${locale}`);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // El buscador de la portada (además del de la cabecera) es lo primero que se puede usar.
      await expect(page.locator("#home-search")).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("no muestra el andamiaje del proyecto (estado del backend, fases ni «Fase 0»)", async ({
      page,
    }) => {
      await page.goto(`/${locale}`);

      const body = await page.locator("body").innerText();

      expect(body).not.toMatch(/fase\s*0/i);
      expect(body).not.toMatch(/roadmap|plan de fases/i);
      // El estado técnico del backend vive en /design-system, no en la tienda.
      await expect(page.getByRole("heading", { name: /estado|status/i })).toHaveCount(0);
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

    test("la búsqueda de la portada se envía por la URL y conserva el idioma", async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.locator("#home-search").fill("zapatos");
      await page.locator("#home-search").press("Enter");

      await page.waitForURL(`**/${locale}/search?q=zapatos`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/search\\?q=zapatos`));
    });

    test("una ruta inexistente muestra la página 404 traducida", async ({ page }) => {
      const response = await page.goto(`/${locale}/esta-ruta-no-existe`);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Los 404 los sirve Next.js con su documento de error (sin `lang`) y React lo añade al hidratar: se
      // espera a ese momento para no auditar un estado a medias (ver `e2e/product.spec.ts`).
      await expect(page.locator("html")).toHaveAttribute("lang", /^(es|en)$/);

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
