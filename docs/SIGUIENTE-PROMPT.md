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


## Estado: F0 a F4 cerradas · **siguiente: F5 · Carrito**

Verificado en el último cierre (F4): `lint` 0 · `typecheck` 0 · pruebas unitarias y end-to-end en verde ·
capturas con datos reales en `docs/capturas/f4/`. Repositorios privados y al día:
`joseggch15/marketplace-web` (`master`) y `joseggch15/ecommerceBackend`.

### Lo que dejó hecho la F4 (reutilizar, no rehacer)

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

### Contratos del carrito (F5, ya extraídos del OpenAPI)

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

### Orden sugerido de trabajo

`src/features/cart/api.ts` (servidor) + rutas BFF bajo `src/app/api/cart/` (con la cookie `mv_cart`) →
`features/cart/{client,hooks}.ts` con TanStack Query y **actualizaciones optimistas** → página `/cart` (cantidad,
quitar, vaciar, con sus cuatro estados) → conectar el botón de `PurchasePanel` → contador en la cabecera →
fusión del carrito al entrar → traducciones es/en → pruebas unitarias y e2e → capturas con datos reales →
commit y push.

### Después de la F5

Resolver `docs/PENDIENTES-BACKEND.md` (13 apartados) en el backend → F6 (pagos, en sandbox).
