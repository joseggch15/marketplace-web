import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Pruebas end-to-end de la Fase 2 (cuenta y sesión).
 *
 * Se ejecutan **sin backend a propósito**: comprueban lo que debe funcionar aunque la API esté caída (que las
 * páginas carguen, que no haya errores de accesibilidad, que el área privada exija sesión) y, sobre todo, dos
 * reglas de seguridad que no dependen de la API:
 *
 * 1. Sin sesión, `/account` manda a `/login` (el guardia se ejecuta en el servidor).
 * 2. **El navegador nunca guarda tokens**: ni en `localStorage` ni en `sessionStorage`.
 */

const LOCALES = ["es", "en"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const PUBLIC_PAGES = ["login", "register", "forgot-password"] as const;

for (const locale of LOCALES) {
  test.describe(`cuenta /${locale}`, () => {
    test("las páginas públicas de sesión cargan y no tienen errores de accesibilidad", async ({
      page,
    }) => {
      for (const path of PUBLIC_PAGES) {
        await page.goto(`/${locale}/${path}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        expect(results.violations, `errores de accesibilidad en /${locale}/${path}`).toEqual([]);
      }
    });

    test("el formulario de entrar es accesible en modo oscuro", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(`/${locale}/login`);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test("el área privada pide iniciar sesión", async ({ page }) => {
      await page.goto(`/${locale}/account`);

      // Sin sesión, el servidor redirige a /login llevando a dónde quería ir.
      await page.waitForURL(`**/${locale}/login**`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(page.url()).toContain(`/${locale}/login`);
    });

    test("el navegador no guarda ningún token de sesión", async ({ page }) => {
      await page.goto(`/${locale}/login`);
      await page.getByLabel(/correo|email/i).fill("ana@correo.com");
      await page.getByLabel(/^(contraseña|password)$/i).fill("clave-de-prueba");

      const stored = await page.evaluate(() => ({
        local: Object.keys(window.localStorage),
        session: Object.keys(window.sessionStorage),
      }));

      const suspicious = [...stored.local, ...stored.session].filter((key) =>
        /token|access|refresh|jwt|session/i.test(key),
      );
      expect(suspicious).toEqual([]);
    });

    test("el formulario avisa de los datos que faltan", async ({ page }) => {
      await page.goto(`/${locale}/login`);
      await page.getByRole("button", { name: /iniciar sesión|sign in/i }).click();

      await expect(page.getByRole("alert").first()).toBeVisible();
    });

    test("la contraseña se puede mostrar y ocultar", async ({ page }) => {
      await page.goto(`/${locale}/login`);

      const password = page.getByLabel(/^(contraseña|password)$/i);
      await expect(password).toHaveAttribute("type", "password");

      await page.getByRole("button", { name: /mostrar contraseña|show password/i }).click();
      await expect(password).toHaveAttribute("type", "text");
    });

    test("el enlace de verificación sin token lo explica", async ({ page }) => {
      await page.goto(`/${locale}/verify-email`);

      await expect(page.getByRole("alert").first()).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });
}

test("el enlace de recuperación con token inválido se puede resolver", async ({ page }) => {
  await page.goto("/es/reset-password?token=token-que-no-existe");

  // El formulario existe (no se rompe) y pide la contraseña nueva.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel(/nueva contraseña/i)).toBeVisible();
});
