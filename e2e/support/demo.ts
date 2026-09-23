import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";

/**
 * Ayudas compartidas por las pruebas end-to-end de la compra (`checkout.spec.ts` y `orders.spec.ts`).
 *
 * Tres ideas detrás de este archivo:
 *
 * 1. **Los datos son reales**: el producto, su variante y su stock se preguntan a la API en vez de escribir
 *    identificadores a mano, así que las pruebas funcionan con cualquier catálogo de demostración.
 * 2. **La sesión de demostración se crea una sola vez por corrida y se reutiliza**. El backend limita los intentos
 *    de entrada a 5 por minuto y por IP, así que cada prueba no puede permitirse un inicio de sesión propio: la
 *    primera que necesita sesión entra (a través del BFF, como el navegador) y guarda las cookies httpOnly en
 *    `e2e/.auth/`, que está ignorado por git; las demás las copian a su contexto.
 * 3. **Nada de esperas a ciegas**: se espera a la respuesta del servidor que la prueba necesita
 *    (`waitForResponse`), no a un temporizador.
 */

export const LOCALE = "es";
export const BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://127.0.0.1:8000";
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/** Criterios de accesibilidad que exige el proyecto (WCAG 2.2 AA). */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Comprueba que la página actual no tiene errores de accesibilidad, en modo claro y oscuro.
 *
 * Se ejecuta solo en las páginas nuevas (regla de ahorro del proyecto) y con los criterios que exige WCAG 2.2 AA.
 */
export async function expectNoA11yViolations(page: Page, label: string): Promise<void> {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations, `${label} en modo ${colorScheme}`).toEqual([]);
  }
}

/** Cuenta de demostración que crea `scripts/seed-demo.mjs`. */
export const DEMO_EMAIL = process.env.PLAYWRIGHT_DEMO_EMAIL ?? "vendedor@tienda-demo.com";
export const DEMO_PASSWORD = process.env.PLAYWRIGHT_DEMO_PASSWORD ?? "demo-marketplace-2026";

/**
 * Cuenta de administración de demostración.
 *
 * La crea y la asciende el mismo `scripts/seed-demo.mjs` con el mecanismo del backend
 * (`uv run python -m app.scripts.promote_admin <email>`), porque el rol no se puede cambiar desde la API.
 */
export const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "admin@tienda-demo.com";
export const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "demo-marketplace-2026";

export const MISSING_ADMIN = [
  "Estas pruebas necesitan la cuenta de administración de demostración.",
  "Créala con `node scripts/seed-demo.mjs` (registra la cuenta y la asciende a administrador) y asegúrate de",
  "que el backend está encendido.",
].join(" ");

/**
 * Entra con la cuenta de **administración** y omite la prueba si no existe o no tiene ese rol.
 *
 * Es una decisión del proyecto: las pruebas del panel de administración no pueden inventarse un administrador
 * (el rol no se puede cambiar por la API), así que si la cuenta no está en el entorno la prueba se **omite**
 * diciendo cómo crearla, en lugar de fallar por una condición del entorno.
 */
export async function signInAsAdmin(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/login", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  test.skip(!response.ok(), MISSING_ADMIN);

  const session = await page.request.get("/api/auth/session");
  const body = (await session.json()) as { user?: { role?: string } | null };

  test.skip(body.user?.role !== "admin", MISSING_ADMIN);
}

export const MISSING_ENVIRONMENT = [
  "Estas pruebas necesitan el backend encendido y los datos de demostración.",
  "Levántalo en E:\\ecommerce (docker compose up -d y uv run uvicorn app.main:app) y ejecuta",
  "node scripts/seed-demo.mjs en E:\\ecommerce-web.",
].join(" ");

export type DemoProduct = { productId: string; productTitle: string };

/**
 * Busca un producto del catálogo de demostración que tenga alguna variante con stock suficiente.
 *
 * Se pregunta a la API pública (búsqueda + ficha + inventario), que es exactamente lo que hace el frontend: así
 * el stock que usa la prueba es el real, no uno supuesto.
 */
export async function findDemoProduct(
  request: APIRequestContext,
  minAvailable = 2,
): Promise<DemoProduct> {
  const health = await request.get(`${BACKEND_URL}/api/v1/health`);
  test.skip(!health.ok(), MISSING_ENVIRONMENT);

  const search = await request.get(`${BACKEND_URL}/api/v1/catalog/search?limit=20`);
  const results = (await search.json()) as { items?: { id: string; title: string }[] };

  for (const item of results.items ?? []) {
    const detail = await request.get(`${BACKEND_URL}/api/v1/catalog/products/${item.id}`);
    const product = (await detail.json()) as { variants?: { id: string }[] };

    for (const variant of product.variants ?? []) {
      const inventory = await request.get(`${BACKEND_URL}/api/v1/inventory/items/${variant.id}`);

      if (!inventory.ok()) {
        continue;
      }

      const stock = (await inventory.json()) as { available?: number };

      if ((stock.available ?? 0) >= minAvailable) {
        return { productId: item.id, productTitle: item.title };
      }
    }
  }

  test.skip(
    true,
    `${MISSING_ENVIRONMENT} Ninguna variante del catálogo tiene ${minAvailable} unidades.`,
  );

  throw new Error("test.skip no detuvo la prueba: falta el catálogo de demostración.");
}

/**
 * Pulsa un botón y espera a la **respuesta** del servidor.
 *
 * Dos cosas que resuelve, y las dos hacen que la prueba mida el producto y no el entorno:
 *
 * - Si el clic llega antes de que React hidrate la página, el navegador no ejecuta nada (o hace un envío nativo
 *   del formulario) y no sale ninguna petición: se devuelve `null` para que quien llama decida (reintentar).
 * - Se espera a la **respuesta**, no solo a la petición: la prueba necesita que la sesión o el carrito ya
 *   existan cuando navega a la página siguiente.
 */
export async function clickAndWaitForResponse(
  page: Page,
  button: Locator,
  urlPart: string,
  timeout = 10_000,
): Promise<Response | null> {
  const pending = page
    .waitForResponse((response) => response.url().includes(urlPart), { timeout })
    .catch(() => null);

  await button.click();

  return pending;
}

/** Vacía el carrito del usuario a través del BFF (la petición comparte las cookies del contexto). */
export async function clearCart(page: Page): Promise<void> {
  await page.request.delete("/api/cart");
}

/**
 * Comprueba el estado de una respuesta y, si no es el esperado, **muestra el cuerpo del error**.
 *
 * Se hace así a propósito: un `expect(status).toBe(201)` falla con «Expected: 201, Received: 422» y deja al
 * siguiente que lo lea sin saber qué campo era el problemático. El cuerpo de un `application/problem+json`
 * trae el `code` estable y el detalle de la validación, que es justo lo que hace falta para arreglarlo.
 */
export async function expectStatus(
  response: Response | null,
  expected: number,
  label: string,
): Promise<void> {
  if (response === null) {
    throw new Error(`${label}: no hubo respuesta del servidor (¿el clic llegó antes de hidratar?)`);
  }

  if (response.status() !== expected) {
    const body = await response.text().catch(() => "(cuerpo ilegible)");

    throw new Error(
      `${label}: el servidor respondió ${response.status()} en lugar de ${expected}. ` +
        `Cuerpo: ${body.slice(0, 800)}`,
    );
  }
}

/**
 * Agrega al carrito desde la ficha del producto, como lo haría un comprador.
 *
 * Si la presentación que viene elegida está agotada se elige otra con stock (el backend devuelve el stock real
 * por variante, así que esto es leer datos, no inventarlos).
 */
export async function addToCartFromProduct(page: Page, product: DemoProduct): Promise<void> {
  await page.goto(`/${LOCALE}/p/${product.productId}`);

  const button = page.getByRole("button", { name: /agregar al carrito/i });

  if (!(await button.isEnabled())) {
    const variants = page.getByRole("radio");
    const count = await variants.count();

    for (let index = 0; index < count; index += 1) {
      const option = variants.nth(index);

      if (await option.isEnabled()) {
        await option.click();
        break;
      }
    }
  }

  const response = await clickAndWaitForResponse(page, button, "/api/cart/items");

  await expectStatus(response, 200, "agregar el producto al carrito");
  await expect(page.getByText(/agregado a tu carrito/i)).toBeVisible();
}

/**
 * Deja `page` en el paso de **pago** del checkout, pasando por dirección y envío.
 *
 * La dirección se escribe nueva a propósito (si la cuenta tiene direcciones guardadas, se marca «usar otra
 * dirección»): así la prueba no depende de lo que haya guardado la cuenta de demostración de otras corridas.
 */
export async function reachCheckoutPaymentStep(page: Page): Promise<void> {
  await page.goto(`/${LOCALE}/checkout`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const useNewAddress = page.getByLabel(/usar otra dirección/i);

  if ((await useNewAddress.count()) > 0) {
    await useNewAddress.check();
  }

  await page.getByLabel(/quién recibe/i).fill("Ana Pérez");
  await page.getByLabel(/^teléfono$/i).fill("+57 300 000 0000");
  await page.getByLabel(/^dirección$/i).fill("Calle 1 # 2-34");
  await page.getByLabel(/^ciudad$/i).fill("Bogotá");
  await page.getByLabel(/^departamento$/i).fill("Cundinamarca");
  await page.getByLabel(/^país$/i).fill("CO");

  await page.getByRole("button", { name: /continuar al envío/i }).click();
  await expect(page.getByRole("button", { name: /continuar al pago/i })).toBeVisible();

  await page.getByRole("button", { name: /continuar al pago/i }).click();
  await expect(page.getByRole("button", { name: /^pagar/i })).toBeVisible();
}

/** Cookies que el servidor de Next.js pone en la sesión (httpOnly: el navegador nunca ve tokens). */
type SessionCookie = Awaited<ReturnType<BrowserContext["storageState"]>>["cookies"][number];

/** Copia reutilizable de la sesión de demostración. La carpeta está ignorada por git. */
const SESSION_FILE = path.join(process.cwd(), "e2e", ".auth", "demo-session.json");

/**
 * Cuánto dura la copia guardada. Es corta a propósito: el access token vive minutos y el refresh token rota, así
 * que reutilizar una copia vieja daría una sesión a medias. Al caducar, se vuelve a entrar una vez.
 */
const SESSION_TTL_MS = 5 * 60 * 1000;

/** Ventana del limitador de frecuencia del backend para los intentos de entrada. */
const RATE_LIMIT_WINDOW_MS = 65_000;

async function cachedCookies(): Promise<SessionCookie[] | null> {
  try {
    const info = await stat(SESSION_FILE);

    if (Date.now() - info.mtimeMs > SESSION_TTL_MS) {
      return null;
    }

    const state = JSON.parse(await readFile(SESSION_FILE, "utf8")) as {
      cookies?: SessionCookie[];
    };

    return state.cookies ?? null;
  } catch {
    // Sin copia (primera prueba de la corrida) o copia ilegible: se entra de nuevo.
    return null;
  }
}

/** Entra con la cuenta de demostración en un contexto aparte y guarda sus cookies para las demás pruebas. */
async function createDemoSession(page: Page): Promise<SessionCookie[] | null> {
  const browser = page.context().browser();

  if (browser === null) {
    return null;
  }

  const context = await browser.newContext({ baseURL: BASE_URL, locale: "es-CO" });

  try {
    // La misma ruta que usa el formulario de entrada: el servidor guarda los tokens en cookies httpOnly.
    const response = await context.request.post("/api/auth/login", {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });

    if (!response.ok()) {
      return null;
    }

    await mkdir(path.dirname(SESSION_FILE), { recursive: true });

    const state = await context.storageState({ path: SESSION_FILE });

    return state.cookies;
  } finally {
    await context.close();
  }
}

/**
 * Deja una sesión de demostración en el contexto de la prueba.
 *
 * Se llama **antes** de navegar: las cookies se añaden al contexto, así que la primera página que se pida ya sale
 * con sesión. Si la copia guardada ya no sirve (caducó o no existe) se entra una vez más por el BFF y, si el
 * backend respondió «demasiados intentos» (5 por minuto y por IP), se espera la ventana del limitador y se
 * reintenta: es una condición del entorno, no un fallo del producto.
 */
export async function signInWithDemoSession(page: Page): Promise<void> {
  const cached = await cachedCookies();

  if (cached !== null) {
    await page.context().addCookies(cached);
    return;
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const fresh = await createDemoSession(page);

    if (fresh !== null) {
      await page.context().addCookies(fresh);
      return;
    }

    if (attempt === 1) {
      await page.waitForTimeout(RATE_LIMIT_WINDOW_MS);
    }
  }

  throw new Error(
    `No se pudo iniciar sesión como ${DEMO_EMAIL}: ¿faltan los datos de demostración o el backend está apagado?`,
  );
}
