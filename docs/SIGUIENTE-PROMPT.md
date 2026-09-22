# Prompt de continuación — marketplace-api (frontend)

Pega esto al abrir una tarea nueva. Es corto a propósito: **las reglas están en `.clinerules`** (léelo, no se
repite aquí) y el detalle de las fases cerradas está en `docs/historial/` y en `docs/decisiones/`.

---

## CONDICIONES DEL DUEÑO (aplican a TODAS las tareas hasta terminar el proyecto)

### ALCANCE DE PROTOTIPO

Construye solo lo esencial de cada fase, bien hecho y funcionando con datos reales:

- **Portada**: buscador destacado, categorías, destacados y más vendidos; fuera el estado de la plataforma, la
  lista de fases y la etiqueta «Fase 0». → **hecha** (`docs/decisiones/0012-portada.md`).
- **F6 Checkout**: dirección, envío, cupón, resumen, pago de prueba (aprobar o rechazar) y confirmación.
  → **código hecho** (`docs/decisiones/0013-checkout.md`); falta e2e y capturas.
- **F7 Mis compras**: lista y detalle con su estado, cancelar cuando se pueda y dejar reseña de lo comprado.
  → **código hecho**; falta e2e, capturas y los enlaces de entrada.
- **F8 Panel del vendedor**: crear tienda; crear y editar productos con variantes, imágenes y stock; gestionar
  pedidos (preparar y marcar como enviado). Métricas: **tres cifras simples** (ventas, pedidos y productos),
  **sin gráficos**. → **pendiente**.
- **F9 Panel de administración**: aprobar tiendas, moderar reseñas y preguntas, y ver usuarios. **Sin gráficos.**
  → **pendiente** (la API no tiene listado de usuarios ni moderación de preguntas: ver lagunas).
- **F10 Preparación para publicar**: auditoría de accesibilidad, rendimiento y SEO; una e2e del recorrido
  completo (registrarse, comprar, vender y administrar); y `docs/PUBLICAR.md` con hosting del frontend y del
  backend, costos mensuales aproximados, qué cuentas crear y los pasos exactos. **No crear cuentas, no publicar
  y no gastar dinero**: eso lo hace el dueño.

Si una funcionalidad **no** está en esta lista, se anota en `docs/IDEAS.md` y **no se construye**.

### AHORRO

- e2e solo de los **flujos críticos**; `axe` solo en las páginas nuevas.
- Capturas solo de páginas nuevas, a **375 px y 1280 px, solo en modo claro**.
- **Reutiliza** los componentes existentes antes de crear otros.
- Continúa con la fase siguiente **en la misma tarea** mientras el contexto esté por debajo de 250k tokens.
- Al terminar la F10: detenerse y entregar el resumen final del proyecto.

---

## Arranque

1. Lee **`E:\ecommerce-web\.clinerules`** y este archivo. `docs/PROGRESO.md` resume el estado.
2. Trabajo en **`E:\ecommerce-web`** (Next.js 16 + TypeScript estricto + Tailwind + shadcn/ui + TanStack Query +
   React Hook Form + Zod + next-intl + Vitest + Playwright). El backend vive en **`E:\ecommerce`**: su código es
   de **solo lectura**, pero **se puede encender y apagar**.
3. Si el catálogo estuviera vacío: `node scripts/seed-demo.mjs`. Capturas: `pnpm capture --out=docs/capturas/fN
   --route=/es/...`.
4. Cuenta de demostración que crea la semilla: `vendedor@tienda-demo.com` / `demo-marketplace-2026`.

## Estado: F0–F5 cerradas · portada hecha · F6 y F7 con el código hecho

Verificado: `lint` 0 · `typecheck` 0 · **283 pruebas unitarias** (264 de la portada + 19 de pedidos). Falta el
`build`, las e2e y las capturas de F6/F7 (es lo primero de la próxima tanda).

El camino de compra se probó **a mano contra el backend real**, a través del BFF y con la cuenta de demostración:
iniciar sesión → agregar al carrito → `POST /api/orders` (201, `ORD-…`) → `POST /api/orders/{id}/payments`
(intento `sandbox`) → `POST /api/payments/{id}/simulate` (aprobado) → `/es/orders/{id}` (200 con seguimiento y
totales) → `/es/orders` (200, el pedido aparece). Guion de aquella sesión: `%TEMP%\checkout-smoke.ps1`.

## Lo que falta, en orden

### 1. Cerrar F6 y F7 (verificación, casi sin código nuevo)

- **e2e del checkout** (`e2e/checkout.spec.ts`): carrito → checkout → aprobar → confirmación; y un caso que
  **rechaza** el pago y comprueba que el pedido sigue pendiente y se puede reintentar. `axe` en `/es/checkout`.
- **e2e de mis compras** (`e2e/orders.spec.ts`): lista y detalle reales, cancelar un pedido pendiente y ver
  «cancelado»; la reseña solo aparece en sub-órdenes `delivered`.
- **Capturas** en `docs/capturas/f6/` y `docs/capturas/f7/` (375 px y 1280 px, solo claro).
- **Enlaces de entrada**: «Mis compras» en `/[locale]/account` (hoy solo se llega por URL) y, en la F8, «Panel
  del vendedor».

### 2. F8 · Panel del vendedor (código nuevo)

| Acción | Endpoint | Nota |
|---|---|---|
| Mi tienda | `GET/POST/PATCH /api/v1/sellers/me` | `POST` crea la solicitud (`name`, `description`); queda `pending` hasta que un admin la apruebe |
| Mis productos | `GET /api/v1/catalog/products` | Devuelve **los de mi tienda** (exige tienda aprobada) |
| Crear producto | `POST /api/v1/catalog/products` | `title`, `description`, `brand`, `category_id`, `variants[]` (`sku`, `price`, `compare_at_price`, `stock`, `attribute_values[]`) |
| Editar producto | `PATCH /api/v1/catalog/products/{id}` | **Solo** `title`, `description`, `brand` |
| Estado | `POST /api/v1/catalog/products/{id}/publish` · `/pause` · `/close` | |
| Imágenes | `POST /api/v1/catalog/images/upload-url` → `PUT` a MinIO → `POST /api/v1/catalog/products/{id}/images` (`object_key`, `alt`, `position`) · `DELETE …/images/{image_id}` | Subir **desde el servidor** (ruta BFF) para no depender del CORS de MinIO; validar el tipo contra la lista blanca (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`) y **rechazar SVG** |
| Ventas | `GET /api/v1/seller/orders` (`limit`, `cursor`) | `SellerOrderListOut`: `subtotal`, `commission_amount`, `payout_amount`, `status`; **sin líneas** |
| Estado de la venta | `PATCH /api/v1/seller/orders/{id}/status?status=…` | `pending→processing/cancelled`, `processing→shipped/cancelled`, `shipped→delivered` |
| Envío | `POST/PATCH/GET /api/v1/seller/orders/{id}/shipment`, `POST …/shipment/status?status=&description=` | `carrier`, `tracking_number`, `tracking_url`, `cost`, `notes` |

**Tres cifras, sin gráficos**: ventas (suma de `payout_amount` o `subtotal` de las sub-órdenes, calculada en el
servidor), pedidos (número de sub-órdenes) y productos. La API **no da totales**: se pagina por cursor con un tope
(p. ej. 3 páginas de 100) y la interfaz **dice sobre cuántos pedidos** está calculando.

**Laguna real (anotar en `docs/PENDIENTES-BACKEND.md`)**: el vendedor **no puede cambiar el stock** después de
crear la variante (`/inventory/items/{id}/adjust` es solo admin y `ProductUpdate` no acepta variantes): el stock
se fija al crear el producto y la pantalla lo muestra **en solo lectura**, explicando por qué.

### 3. F9 · Panel de administración

| Acción | Endpoint |
|---|---|
| Tiendas por estado | `GET /api/v1/sellers?status_filter=pending|approved|rejected|suspended` |
| Aprobar / rechazar | `POST /api/v1/sellers/{id}/approve` · `/reject` |
| Suspender / reactivar | `POST /api/v1/admin/stores/{id}/suspend` · `/restore` |
| Ocultar / publicar reseña | `POST /api/v1/admin/reviews/{id}/hide` · `/publish` |
| Métricas | `GET /api/v1/admin/metrics` (GMV, comisión, órdenes por estado, top vendedores y contadores) |
| Auditoría | `GET /api/v1/admin/actions?limit=` |
| Reseñas de un producto | `GET /api/v1/products/{id}/reviews` (público): para moderar hay que **buscar el producto** antes |

**Lagunas reales (anotarlas en `docs/PENDIENTES-BACKEND.md`)**: no existe un listado de usuarios (solo contadores
en las métricas) y **no hay moderación de preguntas** (solo el vendedor puede responder). Se construye lo que sí se
puede —aprobar tiendas, moderar reseñas, métricas y auditoría— y se deja constancia.

### 4. F10 · Preparación para publicar (documentación y auditoría)

- `docs/PUBLICAR.md`: hosting del frontend (Vercel) y del backend (Fly.io / Render / Railway), PostgreSQL y Redis
  gestionados, almacenamiento S3 compatible, **costos mensuales aproximados (USD y COP)**, cuentas que debe crear
  el dueño, variables de entorno y **pasos exactos** (dominios, DNS, migraciones, semilla, comprobaciones).
- Auditoría: axe en las páginas nuevas, `pnpm build` con los tamaños reales y revisión de SEO (`sitemap.xml` con
  slugs, `robots.txt`, JSON-LD, `canonical`/`hreflang`).
- e2e del recorrido completo (`e2e/journey.spec.ts`): registrarse → comprar → vender → administrar. Para
  administrar hace falta una cuenta admin: se promueve con el script del backend
  (`uv run python -m app.scripts.promote_admin <email>`); si no hay credenciales en el entorno, esa parte se
  **omite** con un mensaje claro (el patrón que ya usan las e2e del carrito).

