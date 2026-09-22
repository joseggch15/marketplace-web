# Prompt de continuación — marketplace-api (frontend)

Copia y pega esto al abrir una tarea nueva. Arranca con el contexto y las reglas correctas sin releer todo el
proyecto.

---

## Contexto

- Frontend: **`E:\ecommerce-web`** (Next.js 16 App Router + TypeScript `strict` + Tailwind + shadcn/ui +
  TanStack Query + React Hook Form + Zod + next-intl + Vitest + Playwright).
- Backend: **`E:\ecommerce`** (FastAPI, `http://127.0.0.1:8000`), **de solo lectura** desde aquí. Si hace
  falta un cambio allá, se anota en `docs/PENDIENTES-BACKEND.md` y se sigue. El backend lo arranca y lo
  detiene el dueño.
- Antes de escribir código, lee `docs/PROGRESO.md` (estado real por fase), `docs/PROYECTO.md` (arquitectura) y
  `docs/decisiones/` (una nota por decisión, la última es la 0008).
- **Todo comando usa rutas absolutas** y empieza con `Set-Location 'E:\ecommerce-web'`: el directorio de
  trabajo del editor es `E:\ecommerce`.

## Condiciones de autonomía (dadas por el dueño)

- **Trabajo 100 % solo.** No hace falta mostrar el plan de cada fase, siempre que el contexto de la tarea esté
  **por debajo de 100k tokens al empezar la fase**.
- **Fases aprobadas:** F1 (sistema de diseño) y F2 (cuenta y sesión) están terminadas. El **acento definitivo
  es el turquesa** (`data-accent` no hace falta cambiarlo).
- Se puede construir **F3, F4 y F5** libremente. **No empezar la F6 (checkout y pagos).**
- **Al cerrar cada fase:** ejecutar `pnpm capture` y guardar las capturas en `docs\capturas\fN\` (rutas
  públicas visibles sin sesión; las privadas requieren backend).
- **Detenerse de forma ordenada al llegar a 150k tokens** (o antes de la F6): proyecto funcionando, todo
  confirmado en git y este archivo reescrito con el mensaje completo para continuar.
- Entregar al final un resumen corto: fases terminadas, verificaciones, commits, estado de GitHub y dónde
  están las capturas.

## Reglas de terminal (obligatorias)

- **Ningún comando largo de una sola línea.** Si hacen falta más de dos comandos, se escribe un `.ps1` en
  `%TEMP%` y se ejecuta con `powershell -NoProfile -ExecutionPolicy Bypass -File <ruta>`.
- **Redirige siempre la salida a un archivo** de `%TEMP%` y lee solo las últimas 30 líneas o las de error.
- **Todo script largo escribe como última línea de su archivo de salida:** `FIN exit=<código>`.
- **Esperar procesos largos:** existe `%TEMP%\esperar.ps1` con `-Archivo` e `-Intento`. Revisa cada 10 s,
  imprime `esperando <segundos>s (intento <n>)`, termina al encontrar `FIN` o a los 8 minutos, e imprime solo
  las últimas 15 líneas. Se llama con `-Intento 1`, luego `2`, `3`… (máximo 6 por proceso).
- **Nunca leas el mismo archivo dos veces seguidas:** si un intento termina sin `FIN`, el siguiente intento se
  hace con `esperar.ps1`.
- **Los procesos largos se lanzan en segundo plano** (`Start-Process -WindowStyle Hidden` + salida
  redirigida): así la terminal queda libre y el proceso no se interrumpe.
- `$pid` es una variable reservada de PowerShell: usa `$procId`.
- PowerShell 5.1 lee los `.ps1` sin BOM como ANSI: **no uses acentos en los patrones** de `Select-String`
  (comparar con acentos da falsos negativos).
- `Set-Content -Encoding utf8` añade BOM y rompe `JSON.parse`: para reescribir un archivo usa
  `[System.IO.File]::WriteAllText($ruta, $texto, (New-Object System.Text.UTF8Encoding($false)))`.


---

## Copias de seguridad en GitHub (obligatorio)

- **Después de cada commit de cierre de fase, ejecuta `git push`.** Así las copias de GitHub se actualizan
  solas al terminar cada fase, sin depender de que alguien se acuerde.
- **Antes de subir, comprueba que no hay secretos en git:**
  `git ls-files | Select-String '(^|/)\.env'` debe devolver **solo** `.env.example` (los `.env` y `.env.local`
  están ignorados y no deben subirse nunca).
- Repositorios: **`joseggch15/marketplace-web`** (frontend, privado, rama `master`) y
  **`joseggch15/ecommerceBackend`** (backend, rama `main`; ya tiene remoto `origin`, **no** crear otro).
  Ambos deben ser **privados**.
- Comprobación rápida de que todo está subido:
  `git rev-list --count '@{u}..HEAD'` debe devolver `0`.
- **Estado (actualizado):** los dos repositorios existen y son **privados**:
  `joseggch15/marketplace-web` (rama `master`, todo subido) y `joseggch15/ecommerceBackend` (rama `main`).
- **`gh` no tiene sesión en este equipo**, pero **git sí tiene las credenciales guardadas** en el gestor de
  Windows (usuario `joseggch15`): para las operaciones de API se puede usar el token que ya está guardado
  (`git credential fill`) sin volver a iniciar sesión, y **nunca escribirlo en un archivo ni en un registro**.
- **Trampa que ya nos costó dos intentos:** el cuerpo JSON enviado a la API debe escribirse **sin BOM**
  (`[System.IO.File]::WriteAllText($ruta, $json, (New-Object System.Text.UTF8Encoding($false)))`).
  `Out-File -Encoding utf8` añade BOM en PowerShell 5.1 y la API responde `400 Problems parsing JSON`.

---

## Credenciales: regla de seguridad (no negociable)

- **Nunca leer credenciales guardadas** (Administrador de credenciales de Windows, `git credential fill`,
  tokens de otras aplicaciones, navegadores, variables de entorno con secretos) **ni usarlas para llamar a
  APIs**. `git push` normal **sí** está permitido (usa solo las credenciales que el sistema aplica por su
  cuenta, sin que el agente las lea).
- Si algo necesita una autenticación que no tienes (crear un repositorio, cambiar su visibilidad, un token de
  API), **detente en ese punto**, anótalo en el resumen final y sigue con el resto del trabajo.
- Motivo: en la F3 el agente leyó el token guardado por Windows para crear el repositorio con la API de GitHub.
  No lo escribió en disco (comprobado) y el resultado fue correcto, pero **nunca debió hacerlo**: con la
  aprobación automática de comandos, eso permite usar credenciales sin que el dueño lo sepa. No se repite.

---

## Backend y datos de prueba (aclaraciones del dueño)

- **El código del backend (`E:\ecommerce`) es de solo lectura, pero el servidor sí se puede encender y apagar.**
  Levántalo en segundo plano cuando lo necesites para pruebas o capturas:
  `Set-Location E:\ecommerce; docker compose up -d` y después
  `uv run uvicorn app.main:app --host 127.0.0.1 --port 8000` (en segundo plano, con la salida a un archivo de
  `%TEMP%`). Comprueba con `curl.exe -s http://127.0.0.1:8000/api/v1/health` y deténlo al terminar.
  **Nunca** modifiques archivos de `E:\ecommerce`: si hace falta un cambio allí, se anota en
  `docs/PENDIENTES-BACKEND.md`.
- **Datos de prueba:** si el catálogo está vacío, se crean **con la API del backend** (nunca tocando su código ni
  la base de datos a mano) desde `scripts/seed-demo.mjs`:
  - registra un vendedor y crea sus categorías y al menos **12 productos con variantes** (`price`,
    `compare_at_price`, `stock`), algunos con varias variantes y distintos rangos de precio;
  - genera las **imágenes localmente** (PNG simples construidos en el propio script, sin descargar nada de
    internet) y las sube por el flujo `POST /api/v1/catalog/images/upload-url` + `PUT` al almacenamiento;
  - publica los productos (`POST /api/v1/catalog/products/{id}/publish`) para que aparezcan en la búsqueda;
  - debe ser **idempotente** (ejecutarlo dos veces no duplica el catálogo) y solo se usa en local.
  - Si hace falta un usuario con rol de vendedor/administrador, **busca primero si el backend ya trae un script o
    comando de administración** y úsalo tal cual; no inventes un atajo que después no exista en producción.
- **Con el backend encendido y datos reales, rehaz las capturas de la F3** (`pnpm capture` con las rutas de la
  búsqueda y de una categoría real) para que muestren productos de verdad.

---

## Estado actual

| Fase | Estado | Comprobaciones |
|---|---|---|
| F0 · Fundamentos | **cerrada** | lint 0 · typecheck 0 · pruebas en verde |
| F1 · Sistema de diseño | **cerrada** | lint 0 · typecheck 0 · 102 unitarias · 46 e2e · build 0 |
| F2 · Cuenta y sesión | **cerrada** | lint 0 · typecheck 0 · **131 unitarias** · **76 e2e** (producción) · build 0 |
| F3 · Catálogo y búsqueda | **cerrada** | lint 0 · typecheck 0 · **147 unitarias** · **92 e2e** (producción) · axe limpio |

**Commits de referencia (rama `master`):**

```
da632e1  feat(f1): design system page with domain components
b9ad5a1  docs(f1): record verified results, next-phase plan and testing setup
011ab52  chore(f1): run e2e against the production build, add screenshots tooling and close the phase docs
e627a4a  docs(f1): list the phase commits
(f2)     feat(f2): authentication, account, addresses and BFF session cookies
```

**GitHub:** el CLI (`gh`) está instalado pero **sin sesión** (`gh auth status` → *not logged into any GitHub
hosts*), así que **ningún repositorio está publicado todavía**. El frontend no tiene remoto; el backend apunta
a `https://github.com/joseggch15/ecommerceBackend.git`. Para publicar, el dueño debe hacer `gh auth login` y
después, en cada carpeta: `git remote add origin <url>` y `git push -u origin master` (web) / `main` (api).
Ningún `.env` real está en git (solo `.env.example`); `.env.local` y `.env` están ignorados.

### Qué existe ya (no rehacer)

- `src/components/domain/`: 9 componentes del marketplace (precio, estrellas, oferta, tarjeta de producto,
  variantes, cantidad, galería, pasos de checkout, línea de tiempo).
- `src/features/auth/`: esquemas Zod, cliente BFF del navegador, hooks de TanStack Query, sesión con cookies
  httpOnly (`src/features/auth/session.ts`), utilidades de error por `code` y todos los componentes de
  formulario (`fields.tsx`, `address-book.tsx`, `profile-form.tsx`…).
- Rutas BFF: `/api/auth/*` (9) y `/api/account/*` (3).
- El guardia de sesión vive en `src/app/[locale]/account/layout.tsx`; las páginas privadas nuevas deben leer
  al usuario con `getCurrentUser()` y redirigir si es `null`.
- `src/lib/format/{money,date}.ts` (Intl) y `src/lib/color/contrast.ts`.
- Los tipos de los datos salen **siempre** de `src/lib/api/schema.d.ts` (se regenera con `pnpm api:types`; si
  el backend está apagado, `pnpm api:types:offline`).

---

## F3 · Catálogo y búsqueda — cerrada

Se implementó y se verificó (147 unitarias · 92 e2e · axe limpio). Lo más útil para lo que viene es la
referencia de contratos de abajo, ya extraída.

## Siguiente tarea: F4 · Página de producto

Objetivo: página de producto **indexable** con galería, variantes, precio, preguntas y reseñas, y datos
estructurados JSON-LD (`Product`, `Offer`, `AggregateRating`, `BreadcrumbList`), en español e inglés.

- Endpoints: `GET /api/v1/catalog/products/{product_id}` (devuelve `ProductOut` con `variants` e `images`),
  `GET /api/v1/products/{product_id}/reviews`, `GET /api/v1/products/{product_id}/questions` y
  `POST /api/v1/products/{product_id}/questions` (**requiere sesión**: reutiliza el patrón BFF de la F2; el
  rate limiting del backend puede responder `too_many_requests`, que ya está traducido).
- **Ojo con el identificador:** el endpoint de producto es por **id**, pero la ruta pública es `/p/<slug>` (la
  F3 ya enlaza ahí y hoy se ve la página 404). Comprueba en `schema.d.ts` si existe búsqueda por slug; si no la
  hay, resuélvelo con `GET /catalog/search?q=<slug>` o anótalo en `docs/PENDIENTES-BACKEND.md` antes de
  inventar nada.
- Reutilizar de la F1 (ya probados y accesibles): `ImageGallery`, `VariantSelector`, `QuantityStepper`, `Price`,
  `RatingStars` y `DealBadge`; los esqueletos de carga ya existen.
- Precios: **nunca** float. `Price` ya acepta `amount: number | string` y `compareAt`.
- Degradar sin backend (patrón `{ ok: true, data } | { ok: false, reason }`) y probar con e2e sin backend:
  carga, accesibilidad con axe (claro y oscuro) y JSON-LD presente.
- La reseña y la pregunta se envían con sesión: usa `useSession()` de la F2 para decidir si se muestra el
  formulario o un enlace a `/login?next=…`.

### Contratos reales del catálogo (ya extraídos, no hay que volver a buscarlos)

Del esquema generado (`src/lib/api/schema.d.ts`) y del backend (`app/modules/search/api.py` y `schemas.py`):

```
GET /api/v1/catalog/search
    q?, category_id?, brand?, min_price?, max_price?, sort?, cursor?, limit?
    sort: "newest" (por defecto) | "price_asc" | "price_desc" | "relevance"
    limit: 1..100, por defecto 20   →  SearchResponse { items: ProductSearchItem[], next_cursor: string | null }

ProductSearchItem { id, title, slug, brand | null, category_id, min_price: string | null, thumbnail: string | null }
GET /api/v1/catalog/categories → CategoryOut[]
CategoryOut { id, parent_id | null, name, slug, commission_rate | null, created_at }
```

- **`thumbnail` es un `object_key`, no una URL:** se sirve por el proxy propio `/api/media/<clave>` y hay que
  validarla antes con `isPublicMediaKey()` (`src/lib/media/keys.ts`). Conviene un ayudante
  `mediaUrl(objectKey)` que devuelva `null` si la clave no es pública.
- **`min_price` y `max_price` son Decimal en el backend:** en el frontend se manejan **como texto**
  (`min_price?: number | string`), nunca como `number`/float (regla de dinero del proyecto).
- **Falta información en los resultados de búsqueda:** `ProductSearchItem` **no** trae reputación
  (`rating_average`, `review_count`), ni nombre de tienda, ni unidades vendidas; `min_price` puede ser `null`
  (producto sin variantes con precio). Consecuencia: en la grilla **no se puede mostrar `RatingStars`** (sería
  inventar datos) y hay que cubrir el caso "precio no disponible". Está anotado en
  `docs/PENDIENTES-BACKEND.md` (apartado 7).
- `CategoryOut` no trae `children` ni conteo de productos: el árbol de categorías se arma en el frontend con
  `parent_id` y `commission_rate` **no** debe mostrarse al comprador (es información del vendedor).
- Reutilizar tal cual los componentes ya probados de `src/components/domain/`: `ProductCard` (recibe `href`,
  `title`, `image {src, alt} | null`, `noImageLabel`, `price` como nodo, `rating` y `badges` opcionales) y
  `ProductCardSkeleton` para el estado de carga.
- **La búsqueda debe degradar bien sin backend:** si la API no responde, la página muestra un aviso traducido
  (patrón ya usado en `features/health/api.ts`: resultado discriminado `{ ok: true, data } | { ok: false }`,
  nunca una excepción) y **no** debe romper; las pruebas end-to-end se ejecutan sin backend.
- Paginación por cursor: los cursores son **opacos y solo hacia adelante**, así que la primera entrega usa
  "Ver más resultados" (enlace que navega con `?cursor=…`, compartible y sin JavaScript) en lugar de scroll
  infinito, que requiere acumular páginas en el cliente.
- Ordenación y filtros viven **en la URL** (regla del proyecto); conviene una utilidad
  `parseCatalogQuery(searchParams)` / `toSearchParams(query)` con pruebas unitarias, porque de ahí salen
  también el `canonical` y los enlaces.

Objetivo aprobado: **catálogo y búsqueda con filtros por faceta, paginación por cursor y los filtros en la
URL** (compartibles y con el botón "atrás" funcionando), en español e inglés.

- Endpoints del backend: `GET /api/v1/catalog/search` (acepta `q`, `category_id`, `brand`, `min_price`,
  `max_price`, `sort`, `cursor`, `limit` y devuelve `items` + `next_cursor`), más los de categorías y
  productos. **Confirmar los nombres exactos en `schema.d.ts` antes de escribir nada.**
- El backend **no** devuelve conteos por faceta: está anotado en `docs/PENDIENTES-BACKEND.md` (apartado 3). Se
  entregan filtros funcionales **sin** conteos hasta que el backend los exponga.
- Reutilizar `ProductCard`, `Price`, `RatingStars` y `DealBadge` de `src/components/domain/` (ya probados y
  accesibles; sus esqueletos de carga ya existen).
- Imágenes: el backend devuelve solo `object_key`; se sirven por el proxy propio `/api/media/[key]`
  (ver `docs/decisiones/0005-proxy-de-medios.md`).
- Paginación por cursor (`next_cursor`), nunca `offset`.
- SEO: página de categoría con `metadata`, `canonical` y `hreflang`; producto con JSON-LD.

## Definición de «terminado» de cada fase

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` y `pnpm build` en verde; **sin infracciones de
axe** en las páginas nuevas (claro y oscuro, 375 px y 1280 px); capturas en `docs\capturas\fN\`;
`docs/PROGRESO.md` y `docs/decisiones/` actualizados; un commit por fase con mensaje en inglés (por ejemplo
`feat(f3): catalog and search with facet filters and cursor pagination`).
