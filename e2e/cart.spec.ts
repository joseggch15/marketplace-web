import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";

/**
 * Pruebas end-to-end de la Fase 5 (carrito).
 *
 * **Se ejecutan con el backend encendido y con los datos de demostración** (`node scripts/seed-demo.mjs`),
 * porque lo que hay que comprobar es el flujo real completo: agregar una variante que existe de verdad, cambiar
 * la cantidad, quitar la línea, vaciar el carrito y ver cómo el carrito de invitado **se fusiona en el servidor**
 * al iniciar sesión.
 *
 * Si el backend no responde o el catálogo no tiene stock, las pruebas se **omiten** con un mensaje que dice qué
 * falta, en lugar de fallar por el entorno. El estado «el servicio no responde» de la pantalla del carrito se
 * cubre con pruebas unitarias (`cart-view.test.tsx`): aquí el backend tiene que estar arriba para el resto.
 *
 * Dos condiciones del entorno que explican cómo está escrito este archivo:
 * - El backend limita los intentos de entrada a **5 por minuto y por IP**, así que la prueba de fusión hace un
 *   solo inicio de sesión y se ejecuta en **un único proyecto** (escritorio).
 * - Los productos se descubren preguntando a la API en vez de escribir identificadores a mano: la prueba
 *   funciona con cualquier catálogo de demostración y no depende de datos inventados por la prueba.
 */

const LOCALE = "es";
const BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://127.0.0.1:8000";
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Cuenta de demostración que crea `scripts/seed-demo.mjs`. */
const DEMO_EMAIL = process.env.PLAYWRIGHT_DEMO_EMAIL ?? "vendedor@tienda-demo.com";
const DEMO_PASSWORD = process.env.PLAYWRIGHT_DEMO_PASSWORD ?? "demo-marketplace-2026";

const MISSING_ENVIRONMENT = [
  "Las pruebas del carrito necesitan el backend encendido y los datos de demostración.",
  "Levántalo en E:\\ecommerce (docker compose up -d y uv run uvicorn app.main:app) y ejecuta",
  "node scripts/seed-demo.mjs en E:\\ecommerce-web.",
].join(" ");

type DemoProduct = { productId: string; productTitle: string };

/**
 * Busca un producto del catálogo de demostración que tenga alguna variante con stock suficiente.
 *
 * Se pregunta a la API pública (búsqueda + ficha + inventario), que es exactamente lo que hace el frontend: así
 * el stock que usa la prueba es el real, no uno supuesto.
 */
async function findDemoProduct(request: APIRequestContext, minAvailable = 2): Promise<DemoProduct> {
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
 * Agrega al carrito desde la ficha del producto, como lo haría un comprador.
 *
 * Si la presentación que viene elegida está agotada se elige otra con stock (el backend devuelve el stock real
 * por variante, así que esto es leer datos, no inventarlos).
 */
async function addToCartFromProduct(page: Page, product: DemoProduct): Promise<void> {
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

  expect(response?.status(), "el servidor tiene que aceptar el producto en el carrito").toBe(200);
  await expect(page.getByText(/agregado a tu carrito/i)).toBeVisible();
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
async function clickAndWaitForResponse(
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

/**
 * Envía el formulario de entrar y devuelve el estado de la respuesta (o `null` si no salió ninguna petición).
 *
 * El envío se repite una vez porque, si el primer clic se perdió, el segundo ya encuentra la página hidratada;
 * en cada intento se vuelven a rellenar los campos, porque un envío nativo recarga la página y los vacía.
 */
async function submitLoginForm(
  page: Page,
  email: string,
  password: string,
): Promise<number | null> {
  const button = page.getByRole("button", { name: /iniciar sesión/i });

  for (let intento = 1; intento <= 2; intento += 1) {
    await page.getByLabel(/correo|email/i).fill(email);
    await page.getByLabel(/^(contraseña|password)$/i).fill(password);

    const response = await clickAndWaitForResponse(page, button, "/api/auth/login");

    if (response !== null) {
      return response.status();
    }
  }

  return null;
}

/**
 * Inicia sesión con la cuenta de demostración y comprueba que la sesión existe de verdad.
 *
 * El backend limita los intentos por IP (5 por minuto), así que si la corrida agotó el cupo se espera a que
 * pase la ventana y se reintenta **una vez**: es una condición del entorno, no un fallo del producto.
 */
async function signIn(page: Page, email: string, password: string): Promise<void> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto(`/${LOCALE}/login`);
    const status = await submitLoginForm(page, email, password);

    if (status !== null && status < 400) {
      // El formulario navega a /account al entrar, y esa página exige sesión: si la sesión no existiera, el
      // servidor mandaría a /login. Esperar a esa navegación es la comprobación más fiable y no compite con el
      // `router.push` del formulario.
      await page
        .waitForURL(new RegExp(`/${LOCALE}/account$`), { timeout: 10_000 })
        .catch(() => undefined);

      if (new URL(page.url()).pathname.endsWith("/account")) {
        return;
      }
    }

    if (attempt === 2) {
      throw new Error(
        `No se pudo iniciar sesión como ${email}: estado ${status ?? "sin petición"}. ¿Faltan los datos de demostración?`,
      );
    }

    // Ventana del limitador de frecuencia del backend: 60 segundos.
    await page.waitForTimeout(65_000);
  }
}

test.describe("carrito", () => {
  test("un invitado agrega, cambia la cantidad y quita la línea", async ({ page, request }) => {
    const product = await findDemoProduct(request);

    await addToCartFromProduct(page, product);

    // El contador de la cabecera y la página del carrito leen el mismo carrito del servidor.
    await page.getByRole("link", { name: /^carrito,/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/cart$`));
    await expect(page.getByText(product.productTitle)).toBeVisible();

    // Cambiar la cantidad: se ve al instante y el subtotal lo confirma el servidor.
    await page.getByRole("button", { name: /agregar una unidad/i }).click();
    await expect(page.getByLabel(/cantidad/i)).toHaveValue("2");
    await expect(page.getByText(/subtotal/i).first()).toBeVisible();

    // Quitar la línea deja el carrito vacío, con su estado vacío.
    await page.getByRole("button", { name: /quitar .* del carrito/i }).click();
    await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible();
  });

  test("un invitado vacía el carrito entero", async ({ page, request }) => {
    const product = await findDemoProduct(request);

    await addToCartFromProduct(page, product);
    await page.goto(`/${LOCALE}/cart`);
    await expect(page.getByText(product.productTitle)).toBeVisible();

    await page.getByRole("button", { name: /vaciar carrito/i }).click();
    await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible();
  });

  test("el carrito del invitado se fusiona en el servidor al iniciar sesión", async ({
    page,
    request,
  }, testInfo) => {
    // Un solo inicio de sesión por corrida: el backend limita 5 intentos por minuto y por IP.
    test.skip(
      testInfo.project.name !== "escritorio-chromium",
      "La fusión se comprueba una sola vez por corrida (límite de intentos de entrada del backend).",
    );

    // Si la corrida agotó el cupo de intentos de entrada, la prueba espera a que pase la ventana del limitador
    // (60 s) y reintenta: necesita más tiempo que el resto de las pruebas.
    test.setTimeout(150_000);

    const product = await findDemoProduct(request);

    // 1. Carrito de invitado, sin sesión.
    await addToCartFromProduct(page, product);
    await page.goto(`/${LOCALE}/cart`);
    await expect(page.getByText(product.productTitle)).toBeVisible();

    // 2. Inicio de sesión: la fusión ocurre en la propia petición de entrar (ruta BFF), sin JavaScript nuestro de
    //    por medio y sin depender de ningún efecto del navegador.
    await signIn(page, DEMO_EMAIL, DEMO_PASSWORD);

    // 3. El backend confirmó la fusión y por eso el servidor borró la cookie del invitado.
    const cookies = await page.context().cookies();
    expect(cookies.find((cookie) => cookie.name === "mv_cart")).toBeUndefined();

    // 4. Las líneas del invitado están ahora en el carrito del usuario.
    await page.goto(`/${LOCALE}/cart`);
    await expect(page.getByText(product.productTitle)).toBeVisible();

    // 5. Se deja limpia la cuenta de demostración para la próxima ejecución.
    await page.getByRole("button", { name: /vaciar carrito/i }).click();
    await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible();
  });

  test("el carrito no tiene errores de accesibilidad (vacío y con líneas, claro y oscuro)", async ({
    page,
    request,
  }) => {
    const product = await findDemoProduct(request);

    // Vacío (visitante recién llegado, sin cookie de carrito).
    await page.goto(`/${LOCALE}/cart`);
    await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible();

    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });

      const empty = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(empty.violations, `carrito vacío en modo ${colorScheme}`).toEqual([]);
    }

    await addToCartFromProduct(page, product);
    await page.goto(`/${LOCALE}/cart`);
    await expect(page.getByText(product.productTitle)).toBeVisible();

    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });

      const filled = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(filled.violations, `carrito con líneas en modo ${colorScheme}`).toEqual([]);
    }
  });
});
