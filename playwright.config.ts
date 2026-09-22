import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * Pruebas end-to-end (flujos reales en un navegador de verdad).
 *
 * - Se ejecutan en dos tamaños que exige el proyecto: escritorio (1280 px) y móvil (375 px equivalente).
 * - La accesibilidad se audita con `@axe-core/playwright` en cada página nueva.
 * - **Se ejecutan contra la compilación de producción** (`pnpm build` + `pnpm start`). Antes se usaba el
 *   servidor de desarrollo, pero allí Next.js compila cada página y cada fragmento la primera vez que se
 *   piden: con varios trabajadores en paralelo alguno recibía un fragmento incompleto
 *   («Unexpected end of JSON input») y la prueba fallaba por un problema del servidor de desarrollo, no del
 *   producto. En producción el HTML y el JavaScript ya están compilados, así que esto no puede ocurrir y
 *   además medimos los tiempos reales.
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
        // Se prueban contra la compilación de producción: sin compilación por demanda no hay fragmentos
        // incompletos ni esperas artificiales. `reuseExistingServer` evita recompilar si ya hay un servidor
        // de producción levantado en el puerto (útil mientras se trabaja en una fase).
        command: "pnpm build && pnpm start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
