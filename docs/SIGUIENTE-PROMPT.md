# Prompt de continuación — marketplace-api (frontend)

Pega esto al abrir una tarea nueva. Es corto a propósito: **las reglas están en `.clinerules`** (léelo, no se
repite aquí) y el detalle de las fases cerradas está en `docs/historial/` (**no hace falta leerlo**).

---

## Arranque

1. Lee **`E:\ecommerce-web\.clinerules`** (reglas de trabajo, terminal, seguridad y credenciales) y este
   archivo. Con eso ya tienes todo: `docs/PROGRESO.md` es corto y resume el estado.
2. Trabajo en **`E:\ecommerce-web`** (Next.js 16 + TypeScript estricto + Tailwind + shadcn/ui + TanStack Query +
   React Hook Form + Zod + next-intl + Vitest + Playwright). El backend vive en **`E:\ecommerce`**: su código es
   de **solo lectura**, pero **se puede encender y apagar** (`.clinerules`, regla 9).
3. Si el catálogo estuviera vacío: `node scripts/seed-demo.mjs` (12 productos con variantes e imágenes).
   Capturas de una fase: `pnpm capture --out=docs/capturas/fN --route=/es/...`.

## Autonomía (dada por el dueño)

- Trabajo 100 % solo; no hace falta mostrar el plan de cada fase si el contexto está por debajo de 100k tokens
  al empezarla.
- **F5 (carrito) está aprobada. La F6 (pagos) NO se empieza**: antes hay que resolver los pendientes del
  backend en una tarea dedicada.
- Al cerrar cada fase: `pnpm capture` a `docs/capturas/fN/`, `docs/PROGRESO.md` al día, commit y **`git push`**
  (regla de copias de seguridad).
- Si el contexto se agota, se para en orden con todo confirmado y se deja este archivo actualizado.

## Definición de «terminado» de cada fase

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` y `pnpm build` en verde · sin infracciones de axe
(claro y oscuro, 375 px y 1280 px) · capturas · documentación al día · un commit por fase con mensaje en inglés.

---


## Estado: F0 a F5 cerradas · **siguiente: resolver los pendientes del backend**

Verificado en el último cierre (F5): `lint` 0 · `typecheck` 0 · **253 pruebas unitarias** · **116 e2e** (115 en
verde y 1 omitida a propósito) · `build` 0 · capturas con datos reales en `docs/capturas/f5/`. Repositorios
privados y al día: `joseggch15/marketplace-web` (`master`) y `joseggch15/ecommerceBackend`.

### Lo que dejó hecho la F4 (histórico)

- **Ficha en `/p/<product_id>`** (`src/app/[locale]/p/[productId]/page.tsx`): galería, marca, nota media real,
  descripción, variantes con **stock real**, reseñas con paginación por cursor y preguntas con respuestas del
  vendedor. `canonical` + `hreflang` + JSON-LD (`Product`, `Offer`, `AggregateRating`, `BreadcrumbList`).
- **`src/features/product/`**: `api.ts` (producto, stock por variante, reseñas, preguntas), `selectors.ts`
  (puras y probadas), `json-ld.ts`, `params.ts`, `schemas.ts`, `client.ts` + `hooks.ts` (preguntas por BFF).
- **`src/lib/api/bff-client.ts`**: la llamada del navegador a nuestras rutas BFF (la comparten F2 y F4).
- **`Breadcrumbs`** y **`JsonLd`** en `src/components/domain/`; `RatingStars` acepta `count` opcional para una
  valoración suelta.
- **La caja de compra (`PurchasePanel`) ya está en su sitio**: variantes, cantidad con el máximo **real** de
  stock y el botón «Agregar al carrito» **deshabilitado y explicado** porque el carrito es la F5. En la F5 se
  conecta ese botón: el `variant_id` y la cantidad ya están ahí; falta la mutación y el aviso de éxito.

### Lo que dejó hecho la F5 (reutilizar, no rehacer)

- **`src/features/cart/`**: `api.ts` (servidor: llamadas a la API + lectura de la cabecera `X-Cart-Token`),
  `session.ts` (cookie httpOnly `mv_cart`, operaciones con sesión o como invitado y **fusión del carrito**),
  `bff.ts`, `schemas.ts`, `error-codes.ts`, `selectors.ts` (puros, sin aritmética de dinero), `client.ts` y
  `hooks.ts` (TanStack Query con actualizaciones optimistas y reversión).
- **Rutas BFF nuevas**: `GET|DELETE /api/cart`, `POST /api/cart/items`, `PATCH|DELETE /api/cart/items/{variantId}`.
- **La fusión del carrito de invitado ocurre en el servidor** dentro de `POST /api/auth/login` (y está llamada en
  el registro, donde hoy no hay sesión: apartado 15 de los pendientes). No depende del navegador.
- **Pantalla `/cart`** con sus cuatro estados, contador en la cabecera y el botón «Agregar al carrito» de la
  ficha ya funcionando. El botón «Continuar con el pago» está deshabilitado y explicado: el pago es la F6.
- **Las pruebas e2e del carrito son las primeras que necesitan el backend encendido y los datos de
  demostración** (`node scripts/seed-demo.mjs`); si falta el entorno, se omiten con un mensaje que lo explica. La
  fusión se comprueba **una sola vez por corrida** porque el backend limita los intentos de entrada a 5 por
  minuto y por IP.
- **Capturas del carrito con líneas reales**: `pnpm capture --out=docs/capturas/f5 --route=/es/cart --cart-variant=<uuid>`,
  donde `<uuid>` es una variante con stock del catálogo de demostración.

### Contratos del carrito (implementados en la F5, extraídos del OpenAPI)

```
GET    /api/v1/cart                    → 200 CartOut      (usuario con sesión o invitado con X-Cart-Token)
POST   /api/v1/cart/items              → 200 CartOut      (cuerpo CartItemAdd {variant_id, quantity=1})
PATCH  /api/v1/cart/items/{variant_id} → 200 CartOut      (cuerpo CartItemUpdate {quantity})
DELETE /api/v1/cart/items/{variant_id} → 200 CartOut
DELETE /api/v1/cart                    → 200 CartOut      (vaciar)
POST   /api/v1/cart/merge              → 200 CartOut      (requiere sesión; fusiona el carrito de invitado)

CartOut     { items: CartItemOut[], total_items: number, subtotal: string, currency: string }
CartItemOut { variant_id, sku, product_id, product_title, product_slug, store_id,
              unit_price: string, quantity: number, subtotal: string }
```

- **El carrito de invitado se identifica con la cabecera `X-Cart-Token`.** Si el invitado no la envía, la API
  genera un token y lo **devuelve en la misma cabecera**: en el BFF eso es una cookie **httpOnly** gestionada
  por el servidor (justo lo que pide `.clinerules`), nunca `localStorage`.
- **Todos los endpoints devuelven el carrito completo**: el `subtotal` y el `currency` los calcula el servidor,
  así que el navegador no hace aritmética de dinero.
- **Stock e idempotencia**: añadir puede fallar con un `code` estable (`insufficient_stock`, `not_found`); los
  códigos se traducen por `code` y la actualización optimista se revierte si el servidor falla.
- `POST /cart/merge` se llama **al iniciar sesión** (la respuesta limpia el token del invitado).

### Antes de tocar código

Lee `docs/PROGRESO.md` (es corto) y la nota de decisiones de la fase que toque en `docs/decisiones/`. El detalle
de las fases cerradas vive en `docs/historial/` y no hace falta leerlo para trabajar.

### Siguiente tarea (acordada con el dueño)

**Primero, siempre: regenerar los tipos de la API** (`pnpm api:types` con el backend encendido, o
`pnpm api:types:offline`). El backend ya añadió campos y endpoints nuevos y `src/lib/api/schema.d.ts` está
desactualizado hasta que se regenere.

**Campos y endpoints nuevos que se pueden aprovechar ya** (apartados 8, 10 y 11 de `PENDIENTES-BACKEND.md`
resueltos el 22/09/2026):

- `VariantOut.stock`, `VariantOut.available` y **`VariantOut.attribute_values[]`** (`attribute_id`, `name`,
  `value`): la ficha puede mostrar «Talla: M» y el stock real **sin** pedir `GET /inventory/items/{variant_id}`
  variante por variante (se puede borrar `fetchAvailability`); `available` ya descuenta lo reservado.
- `ProductOut.total_available`: permite deshabilitar «agregar al carrito» sin pedir el inventario.
- **`GET /api/v1/stores/{store_id}`** público (nombre, `logo_url`, `rating_average`, `rating_count`,
  `orders_delivered`): se puede pintar «vendido por» y la reputación de la tienda en la ficha.
- **`GET /api/v1/catalog/products/{product_id}/shipping`**: ventana de entrega estimada en días hábiles y coste
  de envío. La respuesta lo declara en `source="configured_default"`: **no** es una tarifa de transportadora, así
  que hay que presentarla como aproximada.
- Las **claves de imagen nuevas ya llevan el punto** (`products/<32 hex>.png`), así que el proxy de medios las
  acepta sin el apaño del formato viejo (que sigue aceptándose mientras queden imágenes antiguas).

**La F6 (checkout y pagos) sigue bloqueada** hasta que el dueño la desbloquee: el backend ya tiene el adaptador
de Mercado Pago (preferencia + webhook verificado + monto confirmado, decisión 0019 del backend), pero falta que
el dueño configure las credenciales. **La tarea de pendientes del backend sigue en curso** (correos SMTP con
Mailpit, conteos de facetas, producto por slug, paginación de preguntas, listado para el sitemap, avisos de
precio y stock en el carrito): revisa el estado en `PENDIENTES-BACKEND.md` antes de decidir la siguiente fase.
