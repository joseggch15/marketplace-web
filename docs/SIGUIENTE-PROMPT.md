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

## Estado: F0 a F3 cerradas · **siguiente: F4 · Página de producto**

Verificado en el último cierre: `lint` 0 · `typecheck` 0 · 155 pruebas · 92 e2e · capturas reales. Repositorios
privados y al día: `joseggch15/marketplace-web` (`master`) y `joseggch15/ecommerceBackend`.

### Contratos ya extraídos (no hace falta volver a investigarlos)

```
GET  /api/v1/catalog/products/{id}      → ProductOut {id, store_id, category_id, title, slug, description,
                                          brand, status, created_at, variants?, images?}
GET  /api/v1/products/{id}/reviews      → ReviewListOut   {items: ReviewOut[], next_cursor}
GET  /api/v1/products/{id}/questions    → QuestionListOut {items: QuestionOut[], next_cursor}
POST /api/v1/products/{id}/questions    → 201 QuestionOut   (requiere sesión; cuerpo QuestionCreate {body})
ProductImageOut {id, object_key, position, alt}   → se sirve con mediaUrl() (src/lib/media/url.ts)
```

- **Identificador (ya comprobado):** **no existe** endpoint por slug; `slug` solo aparece como campo, y buscar
  por `q=<slug>` no sirve (el buscador indexa título y marca). **Decisión:** la página se monta en
  **`/p/<product_id>`** con `canonical`/`hreflang` a sí misma, y el enlace del catálogo (`product-grid.tsx`)
  pasa al id. Cuando el backend añada `GET /catalog/products/by-slug/{slug}` (pendiente 9), el cambio son dos
  líneas.
- **Reutilizar de la F1** (`src/components/domain/`, ya probados y accesibles): `ImageGallery`,
  `VariantSelector`, `QuantityStepper`, `Price`, `RatingStars` y `DealBadge`; los esqueletos ya existen.
- **Precios nunca en float:** `Price` acepta `amount: number | string` y `compareAt`.
- **Degradar sin backend:** patrón `{ ok: true, data } | { ok: false, reason }` (como `features/health/api.ts`),
  así las pruebas e2e pueden correr sin backend.
- **SEO obligatorio:** `metadata` con `canonical` y `hreflang`, más JSON-LD `Product`, `Offer`,
  `AggregateRating` y `BreadcrumbList`.
- **Preguntas y reseñas:** la pregunta se envía con sesión; reutiliza `useSession()` de la F2 para mostrar el
  formulario o un enlace a `/login?next=…`. El backend puede responder `too_many_requests` (ya traducido).
- **Proxy de medios:** tiene reglas de seguridad propias que **no se relajan** (lista exacta de tipos de imagen,
  SVG prohibido y dos cabeceras). Están en `.clinerules` y probadas en `src/lib/media/keys.test.ts`.

### Orden sugerido de trabajo

`src/features/catalog/api.ts` (`fetchProduct`, `listReviews`, `listQuestions`) → `product-grid.tsx` enlazando al
id → ruta `/p/[productId]` con `generateMetadata`, JSON-LD y estados → galería y variantes → reseñas y preguntas
→ traducciones es/en → pruebas unitarias y e2e → capturas con datos reales → commit y push.

### Después de la F4

F5 (carrito) → resolver `docs/PENDIENTES-BACKEND.md` en el backend → F6 (pagos, en sandbox).
