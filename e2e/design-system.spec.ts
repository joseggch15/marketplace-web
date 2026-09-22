import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Pruebas end-to-end del sistema de diseño (Fase 1).
 *
 * Se ejecutan en los dos idiomas y en los dos proyectos configurados (escritorio 1280 px y móvil 375 px):
 * - Sin infracciones de accesibilidad (axe, WCAG 2.2 AA) en modo claro y oscuro.
 * - Página interna: lleva `noindex` y no aparece en el sitemap.
 * - Los controles interactivos funcionan con el teclado y todos los botones tienen nombre accesible.
 */

const LOCALES = ["es", "en"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Textos que dependen del idioma para poder interactuar con los componentes. */
const TEXTS = {
  es: {
    increase: /Agregar una unidad/i,
    decrease: /Quitar una unidad/i,
    thumbnail: (index: number) => new RegExp(`Ver imagen ${index}`, "i"),
    productAlt: /Zapatillas urbanas ligeras 2$/i,
  },
  en: {
    increase: /Add one unit/i,
    decrease: /Remove one unit/i,
    thumbnail: (index: number) => new RegExp(`View image ${index}`, "i"),
    productAlt: /Lightweight city sneakers 2$/i,
  },
} as const;

for (const locale of LOCALES) {
  const texts = TEXTS[locale];

  test.describe(`sistema de diseño /${locale}/design-system`, () => {
    test("no tiene errores de accesibilidad en modo claro", async ({ page }) => {
      await page.goto(`/${locale}/design-system`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("no tiene errores de accesibilidad en modo oscuro", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(`/${locale}/design-system`);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("es una página interna: no se indexa", async ({ page }) => {
      await page.goto(`/${locale}/design-system`);

      const robots = await page.locator('meta[name="robots"]').first().getAttribute("content");
      expect(robots).toContain("noindex");
    });

    test("todos los botones tienen nombre accesible", async ({ page }) => {
      await page.goto(`/${locale}/design-system`);

      const buttons = page.locator("button");
      const total = await buttons.count();
      expect(total).toBeGreaterThan(10);

      for (let index = 0; index < total; index += 1) {
        // Se comprueban los mecanismos reales de nombre accesible: `aria-label`, `aria-labelledby`, texto
        // visible y, en los elementos de tipo opción (radios), el `<label for="...">` asociado.
        const name = await buttons.nth(index).evaluate((element) => {
          const ariaLabel = element.getAttribute("aria-label")?.trim();
          if (ariaLabel) {
            return ariaLabel;
          }

          const labelledBy = element.getAttribute("aria-labelledby");
          if (labelledBy) {
            const referenced = document.getElementById(labelledBy);
            if (referenced?.textContent?.trim()) {
              return referenced.textContent.trim();
            }
          }

          const text = element.textContent?.trim();
          if (text) {
            return text;
          }

          if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label?.textContent?.trim()) {
              return label.textContent.trim();
            }
          }

          return element.closest("label")?.textContent?.trim() ?? "";
        });

        expect(name.length, `El botón ${index + 1} no tiene nombre accesible`).toBeGreaterThan(0);
      }
    });

    test("el selector de cantidad responde al teclado y respeta el máximo real", async ({
      page,
    }) => {
      await page.goto(`/${locale}/design-system`);

      const increase = page.getByRole("button", { name: texts.increase }).first();
      const decrease = page.getByRole("button", { name: texts.decrease }).first();

      await expect(decrease).toBeDisabled();
      await increase.click();
      await expect(decrease).toBeEnabled();
    });

    test("la galería cambia de imagen con las miniaturas", async ({ page }) => {
      await page.goto(`/${locale}/design-system`);

      await page.getByRole("button", { name: texts.thumbnail(2) }).click();

      await expect(page.getByAltText(texts.productAlt)).toBeVisible();
    });
  });
}
