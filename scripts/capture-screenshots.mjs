/**
 * Capturas de pantalla para la revisión visual del dueño del producto.
 *
 * Toma cada ruta indicada en modo claro y oscuro, a 375 px (celular) y 1280 px (escritorio), y las guarda
 * en la carpeta indicada. Requiere el servidor de producción levantado (`pnpm build && pnpm start`).
 *
 * Uso:
 *   node scripts/capture-screenshots.mjs --out=docs/capturas/f1 --route=/es --route=/es/design-system
 *
 * Para fotografiar el carrito **con líneas reales** (F5) se le pasa una variante del catálogo de demostración:
 *   node scripts/capture-screenshots.mjs --out=docs/capturas/f5 --route=/es/cart \
 *     --cart-variant=<uuid de la variante> --cart-quantity=2
 *
 * Las pantallas que exigen sesión (checkout y «mis compras», F6 y F7) se fotografían con `--session=demo`, que
 * entra con la cuenta de demostración que crea `scripts/seed-demo.mjs` por la ruta BFF del propio frontend: las
 * cookies httpOnly quedan en el contexto del navegador y las capturas salen como las vería un comprador con
 * sesión. No se leen credenciales de ningún sitio: es la cuenta de demostración del repositorio.
 *
 * Notas de implementación:
 * - El tema se fija con `emulateMedia` **y** con `localStorage.theme`, que es la clave que usa `next-themes`.
 *   Así la captura no depende del sistema operativo de la máquina que las tome.
 * - `reducedMotion: "reduce"` evita que una animación se capture a medias.
 * - `--cart-variant` rellena el carrito del invitado con la petición del propio contexto del navegador (comparte
 *   las cookies, así que el servidor guarda el carrito en su cookie httpOnly como haría un comprador). Cada
 *   contexto es nuevo, por eso se rellena antes de cada captura.
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
  const values = {
    routes: [],
    out: null,
    baseUrl: null,
    cartVariant: null,
    cartQuantity: 1,
    session: null,
  };
  for (const arg of argv) {
    const match = /^--([a-zA-Z-]+)=(.*)$/.exec(arg);
    if (!match) continue;
    const [, key, value] = match;
    if (key === "route") values.routes.push(value);
    else if (key === "out") values.out = value;
    else if (key === "base-url") values.baseUrl = value;
    else if (key === "cart-variant") values.cartVariant = value;
    else if (key === "cart-quantity") values.cartQuantity = Number.parseInt(value, 10) || 1;
    else if (key === "session") values.session = value;
  }
  return values;
}

/** Cuenta de demostración que crea `scripts/seed-demo.mjs` (la misma que usan las pruebas e2e). */
const DEMO_EMAIL = process.env.PLAYWRIGHT_DEMO_EMAIL ?? "vendedor@tienda-demo.com";
const DEMO_PASSWORD = process.env.PLAYWRIGHT_DEMO_PASSWORD ?? "demo-marketplace-2026";

/**
 * Cookies de la sesión de demostración, obtenidas **una sola vez** por corrida.
 *
 * El backend limita los intentos de entrada a 5 por minuto y por IP, y cada captura usa un contexto nuevo: si se
 * entrara en cada uno, la quinta captura recibiría 429. Aquí se entra una vez (en un contexto aparte) y las
 * cookies se copian a cada contexto.
 */
let demoCookies = null;

async function demoSessionCookies(browser, baseUrl) {
  const context = await browser.newContext({ baseURL: baseUrl, locale: "es-CO" });

  try {
    const response = await context.request.post("/api/auth/login", {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });

    if (!response.ok()) {
      throw new Error(
        `No se pudo iniciar sesión como ${DEMO_EMAIL} (${response.status()}). ` +
          "¿Está el backend encendido y sembrado con `node scripts/seed-demo.mjs`?",
      );
    }

    return (await context.storageState()).cookies;
  } finally {
    await context.close();
  }
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
        // Carrito de invitado con líneas reales (opcional): la petición la hace el propio contexto, así que el
        // servidor guarda el carrito en la cookie httpOnly igual que si se hubiera agregado desde la página.
        if (args.cartVariant) {
          await context.request.post(`${baseUrl}/api/cart/items`, {
            data: { variant_id: args.cartVariant, quantity: args.cartQuantity },
          });
        }

        // Sesión de demostración (opcional): el checkout y «mis compras» exigen haber entrado.
        if (args.session === "demo") {
          demoCookies ??= await demoSessionCookies(browser, baseUrl);
          await context.addCookies(demoCookies);
        }

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
