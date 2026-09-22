import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * Pruebas end-to-end (flujos reales en un navegador de verdad).
 *
 * - Se ejecutan en dos tamaños que exige el proyecto: escritorio (1280 px) y móvil (375 px equivalente).
 * - La accesibilidad se audita con `@axe-core/playwright` en cada página nueva.
 * - Si el servidor de desarrollo no está levantado, Playwright lo arranca solo (y lo reutiliza si ya está).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    locale: "es-CO",
  },
  projects: [
    {
      name: "escritorio-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "movil-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
