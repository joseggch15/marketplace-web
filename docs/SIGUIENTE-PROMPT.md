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

---

## Estado actual

| Fase | Estado | Comprobaciones |
|---|---|---|
| F0 · Fundamentos | **cerrada** | lint 0 · typecheck 0 · pruebas en verde |
| F1 · Sistema de diseño | **cerrada** | lint 0 · typecheck 0 · 102 unitarias · 46 e2e · build 0 |
| F2 · Cuenta y sesión | **cerrada** | lint 0 · typecheck 0 · **131 unitarias** · **76 e2e** (producción) · build 0 |

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

## Siguiente tarea: F3 · Catálogo y búsqueda

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
