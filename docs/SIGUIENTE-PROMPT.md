# Prompt de continuación — marketplace-api (frontend)

Pega esto al abrir una tarea nueva. Es corto a propósito: **las reglas están en `.clinerules`** (léelo, no se
repite aquí) y el detalle de las fases cerradas está en `docs/historial/` (**no hace falta leerlo**).

---

## CONDICIONES NUEVAS DEL DUEÑO (aplican a TODAS las tareas siguientes hasta terminar el proyecto)

### ALCANCE DE PROTOTIPO

Construye solo lo esencial de cada fase, bien hecho y funcionando con datos reales:

- **Portada**: buscador destacado, categorías, productos destacados y más vendidos. Quita de la vista del
  comprador el estado de la plataforma, la lista de fases y la etiqueta «Fase 0».
- **F6 Checkout**: dirección, envío, cupón, resumen, pago de prueba (aprobar o rechazar) y confirmación.
- **F7 Mis compras**: lista y detalle de pedidos con su estado, cancelar cuando se pueda y dejar reseña de lo
  comprado.
- **F8 Panel del vendedor**: crear tienda; crear y editar productos con variantes, imágenes y stock; y gestionar
  pedidos (preparar y marcar como enviado). Métricas: solo **tres cifras simples** (ventas, pedidos y
  productos), **sin gráficos**.
- **F9 Panel de administración**: aprobar tiendas, moderar reseñas y preguntas, y ver usuarios. **Sin gráficos.**
- **F10 Preparación para publicar**: auditoría final de accesibilidad, rendimiento y SEO; una prueba e2e del
  recorrido completo (registrarse, comprar, vender y administrar); y un documento `docs\PUBLICAR.md` con
  opciones de hosting para el frontend y el backend, costos mensuales aproximados, qué cuentas debe crear el
  dueño y los pasos exactos. **No crear cuentas, no publicar nada y no gastar dinero**: eso lo hace el dueño.

Si una funcionalidad **no** está en esta lista, se anota en `docs/IDEAS.md` y **no se construye**.

### AHORRO

- Pruebas e2e solo de los **flujos críticos** de cada fase; `axe` solo en las páginas nuevas.
- Capturas solo de las páginas nuevas, a **375 px y 1280 px, solo en modo claro**.
- **Reutiliza** los componentes existentes antes de crear otros nuevos.
- Continúa con la siguiente fase **en la misma tarea** mientras el contexto esté por debajo de 250k tokens.
- Al terminar la F10: detenerse y entregar el resumen final del proyecto.

---

## Arranque

1. Lee **`E:\ecommerce-web\.clinerules`** (reglas de trabajo, terminal, seguridad y credenciales) y este
   archivo. Con eso ya tienes todo: `docs/PROGRESO.md` es corto y resume el estado.
2. Trabajo en **`E:\ecommerce-web`** (Next.js 16 + TypeScript estricto + Tailwind + shadcn/ui + TanStack Query +
   React Hook Form + Zod + next-intl + Vitest + Playwright). El backend vive en **`E:\ecommerce`**: su código es
   de **solo lectura**, pero **se puede encender y apagar**.
3. Si el catálogo estuviera vacío: `node scripts/seed-demo.mjs` (12 productos con variantes e imágenes).
   Capturas de una fase: `pnpm capture --out=docs/capturas/fN --route=/es/...`.

## Estado: F0 a F5 cerradas · **la lista de pendientes del backend está CERRADA**

`docs/PENDIENTES-BACKEND.md` ya no tiene nada abierto: **12 apartados resueltos**, los apartados **1** (URLs de
imágenes) y **4** (catálogo público de códigos de error) **descartados** por decisión del dueño, y el **2** (pagos
reales) fuera de la lista porque el prototipo no cobra dinero real. La última tanda del backend (22/09/2026) está
en la decisión **`0023`** de `E:\ecommerce\docs\decisiones\` y se resume más abajo.

Último cierre verificado (F5): `lint` 0 · `typecheck` 0 · **253 pruebas unitarias** · **116 e2e** (115 en verde y
1 omitida a propósito) · `build` 0 · capturas en `docs/capturas/f5/`. Repositorios **privados**:
`joseggch15/marketplace-web` (rama `master`) y `joseggch15/ecommerceBackend`.

> `docs/PROGRESO.md` todavía dice «antes de la F6 hay que resolver los pendientes del backend»: al empezar la
> tarea, actualízalo (la lista está cerrada) y deja constancia de la portada real y de la F6.

## Autonomía (dada por el dueño)

- Trabajo 100 % solo; no hace falta mostrar el plan de cada fase si el contexto está por debajo de 100k tokens
  al empezarla.
- **La F6 (checkout y pagos) está desbloqueada**: se hace con la **pasarela de prueba** del backend (sin dinero
  real). El frontend **no integra ningún SDK de pasarela**; la pantalla de pago va **marcada como «modo de
  prueba»** con botones para aprobar o rechazar el pago, y se prueban los dos caminos.
- Se avanza de la **F6 a la F10 en la misma tarea**, mientras el contexto esté por debajo de 250k tokens. La
  **F10 es solo preparación**: auditoría, una prueba e2e del recorrido completo y `docs/PUBLICAR.md`. **No se
  crea ninguna cuenta, no se publica nada y no se gasta dinero**: eso lo decide y lo hace el dueño.
- **Al terminar la F10**: detenerse y entregar el resumen final del proyecto (máximo 25 líneas).
- Al cerrar cada fase: `pnpm capture` a `docs/capturas/fN/`, `docs/PROGRESO.md` al día, commit y **`git push`**
  (regla de copias de seguridad).
- Si el contexto se agota, se para en orden con todo confirmado y se deja este archivo actualizado.

## Definición de «terminado» de cada fase

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` y `pnpm build` en verde · sin infracciones de axe
(claro y oscuro, 375 px y 1280 px) · capturas · documentación al día · un commit por fase con mensaje en inglés.

---

## Tareas siguientes, en este orden

### 1. Primero, siempre: regenerar los tipos de la API

`pnpm api:types` con el backend encendido (o `pnpm api:types:offline`). `src/lib/api/schema.d.ts` está
desactualizado hasta que se regenere, y esta tanda añadió campos y endpoints (ver «Lo que cambió en el backend»).

### 2. La portada real (antes de la F6)

`src/app/[locale]/page.tsx` sigue siendo la portada de la F0: hero + estado del sistema + plan de fases. **El plan
de fases no es una portada de tienda**: hay que sustituirlo por una portada de verdad, con datos reales y sin
inventar nada (si el catálogo está vacío, un estado vacío explícito):

- **Hero** con el mensaje del marketplace y un buscador que lleve a `/es/search`.
- **Destacados / novedades** con `/api/v1/catalog/search` (`sort=newest`, `limit` razonable) reutilizando
  `ProductGrid`; cada tarjeta con imagen (proxy), título, precio, `rating_average`/`review_count` y `store_name`.
- **Insignia «más vendido»** con el nuevo `sold_count` y `DealBadge`. Decide (y documenta en `docs/decisiones/`)
  a partir de qué cifra se muestra: el dato es real, pero mostrar la insignia en **todos** los productos no
  informa de nada.
- **Categorías** con conteos reales: las `facets.categories` de `/catalog/search` (nunca una lista inventada).
- **Estado del sistema** (`PlatformStatusCard`) pasa a un bloque secundario o al pie, no al contenido principal.
- **SEO**: `alternates`/`canonical`, JSON-LD de la portada y el **`sitemap.ts` real** con el listado público del
  backend (punto 4 de abajo), con `lastmod` y varios archivos si el catálogo crece.

### 3. La F6 (checkout y pagos, con la pasarela de prueba)

El backend expone `POST /api/v1/orders` (dirección, envío y cupones), `POST /api/v1/orders/{order_id}/payments`
(crea el intento de pago y devuelve `checkout_url`) y
`POST /api/v1/payments/{payment_id}/simulate?outcome=succeeded|failed` (aprueba o rechaza). El checkout debe verse
y comportarse como uno real —direcciones, envío, cupones, resumen y confirmación— y la pantalla de pago tiene que
estar **claramente marcada como «modo de prueba»**, con botones para aprobar o rechazar el pago, para poder probar
los dos caminos. Decisión del dueño: `0020-prototipo-sin-pagos-reales.md` del backend.

## Lo que cambió en el backend (22/09/2026, decisión 0023) y hay que reflejar

1. **El registro ya deja la sesión iniciada.** `POST /api/v1/auth/register` responde
   `{ user, access_token, refresh_token, token_type }` (`RegisterOut`). En el BFF de registro
   (`src/app/api/auth/register/route.ts`) hay que **guardar las cookies de sesión** con esos tokens, devolver
   `{ user }` al formulario como hasta ahora y llamar a `mergeGuestCartIfSignedIn()` —que ya está puesta—: ahora
   sí fusiona el carrito del invitado en el mismo paso. La interfaz pasa a «registrarse y estar dentro» (con un
   «ir a la tienda»), sin pedir el login después.
2. **`REQUIRE_VERIFIED_EMAIL` (interruptor del backend, apagado por defecto).** Apagado **no bloquea nada**: el
   correo de verificación se sigue enviando y el usuario puede verificar si quiere. Si algún día se enciende,
   vender y publicar responden **403 con `code` `email_not_verified`**: traduce ese `code` ofreciendo «reenviar el
   correo» (ya existe `resendVerification`) y **no** bloquees pantallas por `email_verified`, ni dejes escrito que
   hay que verificar para comprar (hoy no se exige: el backend no bloquea ni el login ni la compra).
3. **`sold_count`** (unidades vendidas en órdenes **pagadas**; baja si hay reembolso) en `ProductSearchItem` y en
   `ProductOut`: es el dato de la insignia «más vendido» de la portada y de la ficha. **No hay orden
   `best_selling`** en la API: si se quiere una sección «lo más vendido», se ordena con el dato que ya viene en la
   página (y se documenta la decisión).
4. **Listado público del catálogo para el sitemap**: `GET /api/v1/catalog/products/public?q=&cursor=&limit=`
   devuelve `id`, `slug`, `title` y `updated_at` de los **productos activos**, del más reciente al más antiguo
   (`updated_at` es el `lastmod`), con `limit` de hasta 500 (100 por defecto) y `next_cursor` para recorrer todo
   el catálogo. Úsalo en `sitemap.ts` (URL de producto: la ruta bonita por slug) y en `robots.txt`.
5. **Descartado para el prototipo**: no habrá campo `url` de imagen (sigue el proxy `/api/media/[key]`) ni
   catálogo público de códigos de error (sigue el mensaje genérico para `code` desconocidos).
