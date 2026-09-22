import { chromium } from "@playwright/test";

/**
 * Preparación previa de las pruebas end-to-end.
 *
 * Por qué existe: en desarrollo, Next.js compila cada página la primera vez que se pide, tanto en el servidor
 * como en el navegador. Si varios trabajadores de Playwright visitan a la vez una página que se está
 * compilando, alguno recibe un fragmento incompleto (se veía como «SyntaxError: Unexpected end of JSON input»)
 * y la prueba falla sin que haya ningún error real en el producto.
 *
 * Por eso se visitan todas las rutas **una vez y en orden, con un navegador real** (así se compilan también los
 * fragmentos de JavaScript), antes de lanzar las pruebas en paralelo. Es una solución al servidor de
 * desarrollo: en la compilación de producción esto no puede ocurrir.
 */
const ROUTES = [
  "/es",
  "/en",
  "/es/design-system",
  "/en/design-system",
  "/es/search?q=zapatos",
  "/es/no-existe",
];

export default async function globalSetup(): Promise<void> {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const route of ROUTES) {
    try {
      await page.goto(`${baseURL}${route}`, { waitUntil: "load", timeout: 120_000 });
      // Espera a que terminen las descargas de fragmentos y las llamadas de datos.
      await page.waitForLoadState("networkidle", { timeout: 30_000 });
    } catch {
      // Si alguna ruta no responde, las propias pruebas lo reportarán con un mensaje más útil.
    }
  }

  await browser.close();
}
