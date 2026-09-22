# Plan de la Fase F0 — Fundamentos del frontend

> Documento generado en el **Paso 1 (planificación)** de la F0, aprobado por el dueño del producto.
> Guardado aquí para no perder el análisis al cambiar de carpeta de trabajo (el backend vive en
> `E:\ecommerce` y el frontend en `E:\ecommerce-web`).

## a) Resumen de lo entendido

**Qué construimos:** el frontend web del marketplace multi-vendedor, en **E:\ecommerce-web**
(proyecto independiente). Consume el backend FastAPI que ya existe en `E:\ecommerce`.
**No se toca el backend**; si se necesita algo de allá, se anota en `docs/PENDIENTES-BACKEND.md`
con el motivo y se continúa.

**Las 3 decisiones clave del encargo:**

1. **Carpeta y reglas separadas** → `E:\ecommerce-web` con su propio `.clinerules`; jamás se mezclan
   las reglas del backend con las del frontend.
2. **El navegador nunca guarda tokens** → patrón **BFF**: el login va al servidor de Next.js, que
   guarda access+refresh en cookies **httpOnly, Secure, SameSite=Lax**, renueva el access token solo,
   y el cliente nunca ve un token. Prohibido `localStorage`/`sessionStorage` para sesión.
3. **Buenas prácticas de Temu/Shein sin sus trampas** → grillas visuales, selector de variantes con
   muestras, cupones visibles… pero **cero patrones oscuros**: ni urgencia falsa, ni contadores que se
   reinician, ni stock inventado, ni cargos ocultos, ni casillas premarcadas. Las ofertas muestran solo
   **tiempo y stock reales** del backend.

**Las 3 experiencias:** tienda de compradores (prioridad máxima), Seller Center y panel de administración.

**Cómo se trabaja:** una fase a la vez (F0→F10), plan corto antes de cada una, permiso antes de
instalar/borrar, preguntar si algo es ambiguo, y al terminar cada pantalla entregar la URL exacta y qué
revisar (375 px y 1280 px, modo claro y oscuro). Se mantienen `docs/PROGRESO.md` y `docs/decisiones/`.

**Stack fijo** (no se cambia sin justificar y pedir permiso): Next.js (App Router) + React +
TypeScript strict, Tailwind + shadcn/ui, TanStack Query, React Hook Form + Zod, next-intl, tipos
generados con **openapi-typescript + openapi-fetch** (nunca tipos escritos a mano), pnpm + Node LTS,
Vitest + Testing Library, Playwright + @axe-core/playwright, ESLint + Prettier, despliegue en Vercel.
**Se verifica cada API de Next.js en la versión realmente instalada**, no se asume.

**Código:** nombres en inglés, comentarios y explicaciones en español, componentes pequeños,
**prohibido `any`**.


## e) Estructura de carpetas y dependencias

```
E:\ecommerce-web\
├─ .clinerules                      # Reglas no negociables, UI/UX, cómo trabajar, ahorro de tokens
├─ .env.example / .env.local        # BACKEND_URL y NEXT_PUBLIC_* (nunca secretos en el navegador)
├─ package.json · pnpm-lock.yaml · tsconfig.json · next.config.ts
├─ eslint.config.mjs · .prettierrc · vitest.config.ts · playwright.config.ts
├─ docs/
│  ├─ PROYECTO.md                   # El documento completo del encargo
│  ├─ PLAN-F0.md                    # Este archivo
│  ├─ PROGRESO.md                   # Qué está hecho, qué falta, commit sugerido por fase
│  ├─ PENDIENTES-BACKEND.md         # Cambios que se necesitan del backend, con motivo
│  └─ decisiones/                   # Un archivo corto por decisión importante (ADR ligero)
├─ messages/                        # es.json · en.json (ningún texto suelto en componentes)
├─ public/
└─ src/
   ├─ app/
   │  ├─ layout.tsx · globals.css · global-error.tsx · not-found.tsx
   │  ├─ [locale]/                  # Home, categorías, búsqueda, producto, carrito, checkout,
   │  │                             # cuenta, seller, admin y, en F1, design-system
   │  ├─ api/                       # BFF (Route Handlers): auth, cart, media, revalidate
   │  └─ sitemap.ts · robots.ts
   ├─ components/
   │  ├─ ui/                        # shadcn/ui (código propio, accesible sobre Radix)
   │  └─ domain/                    # ProductCard, Price, RatingStars, Badge, VariantSelector,
   │                                # QuantityStepper, ImageGallery, CheckoutSteps, OrderTimeline
   ├─ features/                     # auth · catalog · search · cart · checkout · orders · reviews
   │                                # wishlist · account · seller · admin · notifications
   ├─ lib/
   │  ├─ api/                       # schema.d.ts generado + client.ts de servidor
   │  ├─ auth/                      # sesión en cookies, refresco automático, guardas de ruta
   │  ├─ errors/                    # mapa code → mensaje traducido
   │  ├─ format/                    # Intl: monedas, números, fechas, zona horaria
   │  └─ config/                    # brand.ts, env.ts (validado con Zod)
   ├─ i18n/                         # next-intl: routing, navigation, request config
   ├─ styles/                       # tokens.css (colores, tipografía, espaciado, radios, sombras)
   └─ tests/ + e2e/                 # Vitest/TL para componentes · Playwright + axe para flujos
```

**Por qué "por funcionalidad":** todo lo de carrito vive en `features/cart`. Así un cambio de carrito no
obliga a leer medio proyecto, y lo compartido queda separado en `components/ui`.

### Dependencias (una línea cada una)

| Paquete | Para qué |
|---|---|
| `next`, `react`, `react-dom` | El framework y React. App Router: cada carpeta es una URL y las páginas se renderizan en el servidor. |
| `typescript`, `@types/*` | Tipado estricto: errores antes de ejecutar, no en producción. |
| `tailwindcss` | Estilos con clases utilitarias, sin inventar nombres de CSS. |
| `shadcn/ui` (CLI) | Copia componentes accesibles al repo: son código propio, no una caja negra. |
| `radix-ui/*` (los instala shadcn) | Primitivos accesibles (diálogos, menús, tabs) con teclado y ARIA ya resueltos. |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Variantes de componentes y unión segura de clases CSS. |
| `lucide-react` | Iconos ligeros y consistentes. |
| `@tanstack/react-query` | Datos del servidor en componentes cliente: caché, reintentos y actualizaciones optimistas. |
| `react-hook-form`, `zod`, `@hookform/resolvers` | Formularios y validación con un esquema compartido. |
| `next-intl` | Español e inglés con rutas por idioma, listo para añadir más. |
| `openapi-typescript` (dev) + `openapi-fetch` | Generan los tipos desde `/openapi.json` y llaman a la API con esos tipos. |
| `vitest`, `jsdom`, Testing Library | Pruebas de componentes simulando a una persona real. |
| `@playwright/test`, `@axe-core/playwright` | Pruebas end-to-end en navegador real + auditoría de accesibilidad. |
| `eslint`, `eslint-config-next`, `prettier`, `prettier-plugin-tailwindcss`, `eslint-config-prettier` | Calidad y formato automáticos. |
| `@stripe/react-stripe-js`, `@stripe/stripe-js`, `@mercadopago/sdk-react` | Pago con los componentes oficiales (F6; se evalúan cuando se necesiten). |
| **Descartado por ahora** | Librerías de UI pesadas, moment.js, lodash completo, etc. |

**Nota de honestidad:** no se fijan números de versión "a mano" en el plan: se instala la **última
estable** y se **lee la documentación de lo instalado** antes de usar sus APIs. Las versiones reales
quedan registradas en `docs/decisiones/`.

## f) Preguntas del Paso 1 y respuestas del dueño del producto

1. **Backend:** corre en su propia terminal; **no lo iniciamos ni lo detenemos**.
2. **pnpm:** instalación autorizada; se autoriza también `create-next-app` dentro de `E:\ecommerce-web`
   sin borrar `docs/`.
3. **Dirección visual:** «Mercado Vivo» con acento distinto del amarillo; en F1 se proponen 2
   alternativas de acento con validación de contraste AA.
4. **Marca:** placeholder en `src/config/brand.ts`; el nombre se decide después (revisar dominio libre y
   registro de marca ante la SIC).
5. **Alcance de F0:** home mínima, layout, páginas de error y tokens, sin catálogo.
6. **Imágenes:** se acepta el proxy `/api/media/[key]`, pero **solo** con claves de prefijos públicos
   (imágenes de producto y logos de tienda), validando la clave. Nunca archivos privados (documentos de
   verificación de vendedores). Además se anota en `docs/PENDIENTES-BACKEND.md` que el backend debería
   devolver URLs.
7. **Pagos:** F6 en sandbox; Stripe y Mercado Pago reales quedan como pendiente del backend.

## g) Cómo queda la F0 (entregables)

- Proyecto Next.js + TS strict + Tailwind + shadcn, con **cliente de API generado** desde `/openapi.json`.
- i18n es/en con rutas por idioma; tokens de diseño y modo claro/oscuro; layout base (header con buscador
  siempre visible + footer); páginas `error.tsx`, `global-error.tsx` y `not-found.tsx`.
- Proxy BFF `/api/media/[key]` con validación de clave.
- Vitest y Playwright configurados; `.clinerules`; `docs/PROYECTO.md`, `PROGRESO.md`,
  `PENDIENTES-BACKEND.md` y las primeras decisiones.
- **Commit sugerido:** `chore(f0): scaffold Next.js App Router, design tokens, i18n, generated API client and BFF skeleton`.
