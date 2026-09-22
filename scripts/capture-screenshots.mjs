/**
 * Capturas de pantalla para la revisión visual del dueño del producto.
 *
 * Toma cada ruta indicada en modo claro y oscuro, a 375 px (celular) y 1280 px (escritorio), y las guarda
 * en la carpeta indicada. Requiere el servidor de producción levantado (`pnpm build && pnpm start`).
 *
 * Uso:
 *   node scripts/capture-screenshots.mjs --out=docs/capturas/f1 --route=/es --route=/es/design-system
 *
 * Notas de implementación:
 * - El tema se fija con `emulateMedia` **y** con `localStorage.theme`, que es la clave que usa `next-themes`.
 *   Así la captura no depende del sistema operativo de la máquina que las tome.
 * - `reducedMotion: "reduce"` evita que una animación se capture a medias.
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const THEMES = ["claro", "oscuro"];
const VIEWPORTS = [
  { label: "375", width: 375, height: 812, deviceScaleFactor: 1 },
  { label: "1280", width: 1280, height: 800, deviceScaleFactor: 1 },
];

/** Lee `--clave=valor` repetible de la línea de comandos. */
function parseArgs(argv) {
  const values = { routes: [], out: null, baseUrl: null };
  for (const arg of argv) {
    const match = /^--([a-zA-Z-]+)=(.*)$/.exec(arg);
    if (!match) continue;
    const [, key, value] = match;
    if (key === "route") values.routes.push(value);
    else if (key === "out") values.out = value;
    else if (key === "base-url") values.baseUrl = value;
  }
  return values;
}

/** Nombre de archivo legible: `/es/p/abc` -> `es-p-abc`, `/es` -> `es-inicio`. */
function slugFor(route) {
  const match = /^\/(es|en)(?=\/|$)/.exec(route);
  // El idioma **se queda** en el nombre: sin él, `/es/p/<id>` y `/en/p/<id>` producían el mismo archivo y la
  // segunda captura pisaba a la primera en silencio.
  const locale = match ? `${match[1]}-` : "";
  const withoutLocale = route.replace(/^\/(es|en)(?=\/|$)/, "");
  const cleaned = withoutLocale.replace(/^\//, "").replace(/[/?=&]+/g, "-");
  return `${locale}${cleaned.length > 0 ? cleaned : "inicio"}`;
}

const args = parseArgs(process.argv.slice(2));
const routes = args.routes.length > 0 ? args.routes : ["/es", "/es/design-system"];
const outputDir = path.resolve(args.out ?? "docs/capturas");
const baseUrl = args.baseUrl ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const created = [];
const failed = [];

for (const route of routes) {
  for (const theme of THEMES) {
    const colorScheme = theme === "oscuro" ? "dark" : "light";

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        baseURL: baseUrl,
        locale: "es-CO",
        timezoneId: "America/Bogota",
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
        colorScheme,
        reducedMotion: "reduce",
      });

      // `next-themes` guarda la preferencia en `localStorage.theme`; se fija antes de que cargue la página.
      await context.addInitScript((value) => {
        window.localStorage.setItem("theme", value);
      }, colorScheme);

      const page = await context.newPage();
      const file = path.join(outputDir, `${slugFor(route)}-${theme}-${viewport.label}.png`);

      try {
        await page.goto(route, { waitUntil: "load" });
        await page.waitForLoadState("networkidle");
        // Espera a las tipografías propias: sin esto la captura puede salir con la fuente de reserva.
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: file, fullPage: true });
        const info = await stat(file);
        created.push(`${path.basename(file)} (${Math.round(info.size / 1024)} KB)`);
      } catch (error) {
        failed.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        await context.close();
      }
    }
  }
}

await browser.close();

// Salida para la terminal (este script es una herramienta de línea de comandos, no código de la app:
// por eso escribe directamente en `stdout` en lugar de usar `console.log`, que está prohibido por ESLint).
const lines = [`Capturas en ${outputDir}`];
for (const entry of created) lines.push(`ok  ${entry}`);
for (const entry of failed) lines.push(`ERROR ${entry}`);
lines.push(failed.length > 0 ? "FIN exit=1" : "FIN exit=0");
process.stdout.write(`${lines.join("\n")}\n`);
process.exit(failed.length > 0 ? 1 : 0);
