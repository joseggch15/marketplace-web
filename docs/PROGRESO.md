# Progreso del frontend

Documento vivo: qué está hecho, qué falta y qué revisar en cada fase.
El detalle de cada decisión técnica está en `docs/decisiones/`.

---

## Fase 0 · Fundamentos — **completada** (pendiente de tu revisión)

### Qué se entregó

| Área | Estado | Detalle |
|---|---|---|
| Proyecto | Hecho | Next.js **16.3.5** (App Router) + React **19.2.8** + TypeScript estricto + Tailwind **4.3.3** + shadcn/ui (base Radix) en `E:\ecommerce-web` |
| Tipos de la API | Hecho | `src/lib/api/schema.d.ts` **generado** desde el OpenAPI del backend (78 rutas) con `openapi-typescript`; cliente `openapi-fetch` en `src/lib/api/client.ts` |
| Idiomas | Hecho | `es` (por defecto) y `en`, con rutas `/es/...` y `/en/...`, detección por navegador y cookie `NEXT_LOCALE` |
| Tema | Hecho | Modo claro y oscuro (`next-themes`), preferencia del sistema por defecto |
| Tokens | Hecho | `src/styles/tokens.css` (colores, sombras, radios, movimiento). Ningún color suelto en componentes |
| Layout | Hecho | Encabezado con buscador siempre visible, selector de tema e idioma, pie con enlaces honestos (sin enlaces rotos) |
| Estados | Hecho | Cargando (esqueletos), error, vacío (404) y éxito diseñados en las páginas nuevas |
| Errores | Hecho | `error.tsx` (con `digest` y botón de reintento), `not-found.tsx`, `global-error.tsx` y `global-not-found.tsx` |
| Imágenes | Hecho | Proxy BFF `/api/media/[...key]` firmado con AWS SigV4, restringido a prefijos públicos |
| SEO | Hecho | `metadata` con canonical y `hreflang`, Open Graph, `sitemap.xml`, `robots.txt` |
| Pruebas | Hecho | Vitest (46 pruebas) + Playwright con `@axe-core/playwright` (accesibilidad en claro y oscuro) |
| Reglas | Hecho | `.clinerules` y `docs/PROYECTO.md` |

### Verificación (definición de "terminado")

| Comprobación | Resultado |
|---|---|
| `pnpm lint` | ✅ sin errores |
| `pnpm typecheck` | ✅ sin errores |
| `pnpm test` | ✅ 46 pruebas (incluye 36 de contraste AA y 6 de seguridad del proxy de medios) |
| `pnpm build` | ✅ compiló, TypeScript pasó, 8 páginas generadas; `robots.txt` y `sitemap.xml` quedan estáticos |
| Tipos desde el backend encendido | ✅ `pnpm api:types` regeneró `schema.d.ts` y el archivo **no cambió** (hash SHA‑256 idéntico), así que la generación offline era exacta |
| Pruebas end-to-end | ✅ **22/22** con Playwright (escritorio 1280 px y móvil Pixel 7) |
| Accesibilidad (axe) | ✅ sin infracciones WCAG 2.2 AA en claro y oscuro, en móvil y escritorio, en portada, 404 y búsqueda provisional |
| Backend disponible | ✅ la portada mostró «Todo funcionando» con PostgreSQL y Redis en «Correcto» |
| Navegación con teclado | ✅ el primer Tab enfoca el enlace «Saltar al contenido principal» y el foco es visible |
| Responsive | ✅ verificado automáticamente a 375 px y 1280 px (pendiente tu revisión visual) |

### Defectos encontrados por las pruebas end-to-end y corregidos

1. **Selector de idioma roto** (`src/components/layout/language-switcher.tsx`): se usaba `asChild` sobre
   `DropdownMenuRadioItem`. En la versión instalada ese elemento renderiza también un indicador, así que
   `asChild` (que exige un único hijo) lanzaba «Primitive.div failed to slot onto its children» y el menú
   quedaba **vacío**: el idioma no se podía cambiar. Ahora se usa `DropdownMenuRadioGroup` con
   `onValueChange` + `router.replace(pathname, { locale })`, que conserva la semántica de botón de opción.
2. **Aviso de Next.js 16 sobre el desplazamiento suave:** se añadió `data-scroll-behavior="smooth"` al
   `<html>` para que Next desactive el desplazamiento suave durante los cambios de ruta.

### Avisos conocidos (no son errores)

- En desarrollo, `next-themes` genera el aviso «Encountered a script tag while rendering React component».
  Es un aviso de React 19 sobre una librería de terceros que no rompe nada (el tema se aplica bien, como
  demuestran las pruebas de axe en modo oscuro). No hay ningún `<script>` en nuestro código.
- La terminal de Trae se bloquea con comandos largos: se trabaja con scripts `.ps1` en `%TEMP%` y la salida
  se lee desde archivos.

### Pendientes menores

1. **Abrir `E:\ecommerce-web` como carpeta del proyecto en Cline**, para que `.clinerules` del frontend se
   aplique solo (el área de trabajo seguía siendo el backend).
2. Revisión visual humana (375 px y 1280 px, claro y oscuro) por parte del dueño del producto.

### URLs para revisar

| URL | Qué mirar |
|---|---|
| http://localhost:3000/es | Portada: título, buscador, tarjeta de estado del backend (con esqueleto antes de llegar) |
| http://localhost:3000/en | Lo mismo en inglés |
| http://localhost:3000/es/no-existe | Página 404 traducida, con acción sugerida |
| http://localhost:3000/es/search?q=zapatos | Página provisional de búsqueda (la real es la F3) |
| http://localhost:3000/es | Botón de tema (sol/luna) → alternar claro/oscuro; botón de idioma → cambiar a inglés manteniendo la página |
| http://localhost:3000/robots.txt y /sitemap.xml | SEO |

**Qué revisar a mano:** 375 px (Pixel) y 1280 px (escritorio), en claro y oscuro;
navegar solo con el teclado (Tab) y comprobar que el foco se ve siempre.

### Lo que **no** trae la F0 (a propósito)

El catálogo, la búsqueda real, el carrito, la cuenta, los paneles de vendedor y administración.
El enlace del carrito/cuenta no existe todavía: preferimos no mostrar iconos que lleven a ninguna parte.

### Pendientes anotados en `docs/PENDIENTES-BACKEND.md`

1. **Imágenes:** el backend solo devuelve `object_key`; convendría que devolviera la URL resuelta.
2. **Pagos:** Stripe y Mercado Pago reales necesitan endpoints en el backend (F6 queda en sandbox).
3. **Facetas:** la búsqueda no devuelve conteos por categoría/marca (se decidirá en F3).
4. **Códigos de error:** falta un listado público de todos los `code` para traducirlos (F2 lo necesita).

### Notas importantes para la próxima sesión

- **El backend no estaba corriendo** durante esta fase. Los tipos se generaron con
  `pnpm api:types:offline` (lee el código del backend sin levantar el servidor) y **hay que
  regenerarlos con `pnpm api:types`** cuando el backend esté arriba, para confirmar que coinciden.
- El área de trabajo de Cline seguía siendo `E:\ecommerce` (el backend). Para que `.clinerules` del
  frontend se aplique solo, abre **`E:\ecommerce-web`** como carpeta del proyecto.
- `src/app/[locale]/search/page.tsx` es **provisional**: la búsqueda real es la F3.
- Los enlaces del pie (ayuda, legales, vender) son texto, no enlaces, hasta que existan esas páginas.

### Commit de la fase

```
ea5c655  chore(f0): scaffold Next.js 16 App Router, design tokens, i18n es/en, generated API client and secure media proxy
```

Comprobado antes de confirmar: `.env.local` **sí** está ignorado, `.env.example` **sí** se incluye (75
archivos en el commit) y ni `.env.local` ni `openapi.json` entraron en él.

---

## Fase 1 · Sistema de diseño — **completada**

Se construyó siguiendo el plan aprobado en la sesión anterior, sin cambios de alcance.

### Qué se entregó

**Página `/design-system`** (dentro de `[locale]`, con `noindex` en la metadata: es una página interna de
trabajo, no debe indexarse).

**1. Componentes base que ya existen** (mostrar todas sus variantes y estados):
`button`, `input`, `badge`, `skeleton`, `dropdown-menu` (tema e idioma).

**2. Componentes de dominio a crear** en `src/components/domain/`:

| Componente | Qué debe resolver |
|---|---|
| `product-card.tsx` | Imagen (`next/image`), título, precio, reputación, insignias, acciones rápidas |
| `price.tsx` | Moneda con `Intl.NumberFormat`, precio anterior tachado, descuento y «≈» para la conversión |
| `rating-stars.tsx` | Estrellas accesibles (media y número de reseñas), sin depender solo del color |
| `deal-badge.tsx` | Insignias de dominio: envío gratis, oferta, más vendido (tokens gain/brand/warning) |
| `variant-selector.tsx` | Muestras de color y talla con semántica de botón de opción; variantes sin stock deshabilitadas |
| `quantity-stepper.tsx` | Cantidad con límites reales del backend (mínimo y máximo), etiqueta y teclado |
| `image-gallery.tsx` | Galería con miniaturas navegables por teclado y texto alternativo obligatorio |
| `checkout-steps.tsx` | Pasos del checkout con `aria-current` en el paso activo |
| `order-timeline.tsx` | Línea de tiempo del pedido con los estados reales del backend |

**3. Estados obligatorios** en cada componente: normal, hover, foco, deshabilitado, cargando (esqueleto con
la forma final, no spinner) y error (mensaje claro con la causa traducida).

**4. Acento de marca:** se mantiene el turquesa como valor por defecto y, en `/design-system`, se muestran
**las 3 opciones lado a lado** (turquesa, coral y violeta) para que el dueño elija. El acento vive en un solo
bloque de `src/styles/tokens.css` (`--brand-accent*`) y se selecciona con el atributo `data-accent` en
`src/app/[locale]/layout.tsx`, así que cambiarlo es editar una línea. El contraste AA de los tres presets está
cubierto por pruebas automáticas.

**5. Traducciones:** claves nuevas en `messages/es.json` y `messages/en.json` (ningún texto suelto).

**6. Pruebas:** unitarias con Vitest por componente (interacción con teclado y nombres accesibles) y
end‑to‑end de `/design-system` con axe en claro y oscuro, a 375 px y 1280 px.

**7. Documentación y commit:** `docs/decisiones/0007-sistema-de-diseno.md`, actualización de este archivo y
commit **`da632e1`** · `feat(f1): design system page with domain components` (la página usa datos de ejemplo
porque es un catálogo interno; en pantallas reales los componentes se alimentan del backend).

### Componentes creados (9, en `src/components/domain/`)

`Price`, `RatingStars`, `DealBadge`, `ProductCard`, `VariantSelector`, `QuantityStepper`, `ImageGallery`,
`CheckoutSteps` y `OrderTimeline`, cada uno con sus estados y con esqueletos de carga. También se añadieron
ayudantes de formato con `Intl` (`src/lib/format/money.ts` y `date.ts`) y los tokens de acento.

### Verificación (definición de «terminado»)

| Comprobación | Resultado |
|---|---|
| `pnpm lint` | ✅ sin errores (`lint_exit=0`) |
| `pnpm typecheck` | ✅ sin errores (`typecheck_exit=0`) |
| `pnpm test` | ✅ **102 pruebas** en 9 archivos (`test_exit=0`); incluye 56 de contraste AA con los tres acentos |
| `pnpm test:e2e` | ✅ **46 pruebas en verde** con la caché de compilación borrada (`e2e_exit=0`) |
| `pnpm build` | ✅ compilación de producción sin errores (`build_exit=0`) |
| Accesibilidad (axe) | ✅ sin infracciones WCAG 2.2 AA en `/design-system` (es/en, claro/oscuro, 375 px y 1280 px) |
| `noindex` | ✅ verificado por prueba automática, fuera del sitemap y bloqueada en `robots.txt` |

### Ajuste de la infraestructura de pruebas

Las pruebas end-to-end fallaban **de forma intermitente** al visitar por primera vez una página recién creada:
en desarrollo, Next.js compila cada página y cada fragmento de JavaScript la primera vez que se piden, y con
varios trabajadores en paralelo alguno recibía un fragmento incompleto
(`SyntaxError: Unexpected end of JSON input`) sin que hubiera nada mal en el producto (se comprobó pidiendo la
página directamente al servidor: devuelve 200 y el `h1` correcto).

Se resolvió **en la raíz**: las pruebas end-to-end ahora se ejecutan **contra la compilación de producción**
(`command: "pnpm build && pnpm start"` en `playwright.config.ts`), donde el HTML y el JavaScript ya están
compilados y esa carrera no puede ocurrir. Ventajas añadidas: se miden tiempos reales de producción (la suite
completa tardó **49,6 s** frente a 1 min 54 s con el servidor de desarrollo) y `reuseExistingServer`
reaprovecha el servidor si ya está levantado. En el código quedó escrito el motivo, para que nadie lo revierta
sin entender por qué.

### Capturas para la revisión visual

`node scripts/capture-screenshots.mjs` (atajo `pnpm capture`) recorre las rutas indicadas en modo claro y
oscuro, a 375 px y 1280 px, y las guarda en la carpeta que se le indique. Fija el tema con `emulateMedia` **y**
con `localStorage.theme` (la clave que usa `next-themes`) para que la captura no dependa del sistema operativo
de la máquina, y usa `reducedMotion: "reduce"` para no capturar una animación a medias. Las capturas de la F1
están en `docs/capturas/`.

### Defectos reales que encontraron las pruebas y se corrigieron

1. **El turquesa base no llegaba a 3:1** sobre el fondo claro (2,73:1) y se usa en elementos gráficos
   (estrellas, bordes activos): se oscureció de `#00a99d` a `#009a8f`.
2. **El verde con texto blanco del paso completado** solo daba 3,37:1: se añadieron
   `--brand-success-strong` / `--brand-success-on-strong` (6,63:1 en claro y 10,97:1 en oscuro).
3. **La insignia y el botón destructivos de shadcn** no cumplían AA (4,15:1): ahora usan los tokens de
   peligro validados (`bg-danger-surface text-danger-text`, 6,88:1).
4. **Un mensaje de traducción contenía `<html>`**: next-intl lo interpretaba como etiqueta de texto
   enriquecido (`INVALID_MESSAGE: UNCLOSED_TAG`) y **rompía toda la página**. Se reescribió el texto. Lección
   anotada: en los mensajes no se deben usar `<` ni `>` sin escapar.
5. **Mi propia prueba de «nombre accesible» era incorrecta**: no reconocía el nombre que un elemento de tipo
   opción recibe de su `<label for>`. Ahora comprueba los cuatro mecanismos reales (`aria-label`,
   `aria-labelledby`, texto visible y `label` asociado).

### URLs para revisar

| URL | Qué mirar |
|---|---|
| http://localhost:3000/es/design-system | Toda la página: tokens, tipografía, acento, botones, campos, insignias, estados y componentes |
| http://localhost:3000/en/design-system | Lo mismo en inglés |
| Secciones de la misma página | `#colors`, `#typography`, `#accent`, `#buttons`, `#fields`, `#badges`, `#feedback`, `#domain` |

**Qué revisar a mano:** en la sección del acento, los tres presets (turquesa, coral y violeta) lado a lado;
botones y campos con el teclado (Tab) para ver el foco; 375 px y 1280 px; modo claro y oscuro.

### Commits de la fase

```
da632e1  feat(f1): design system page with domain components
b9ad5a1  docs(f1): record verified results, next-phase plan and testing setup
011ab52  chore(f1): run e2e against the production build, add screenshots tooling and close the phase docs
```

### Decisión pendiente del dueño del producto

Elegir el acento definitivo (**turquesa**, **coral** o **violeta**). Cambiarlo es una sola línea en
`src/app/[locale]/layout.tsx` (`data-accent="..."`); el contraste de los tres ya está validado.

## Fase 2 · Autenticación y cuenta — **completada**

Se construyó siguiendo el plan aprobado. Primero van los resultados reales y después el plan tal como se
escribió antes de empezar (útil para comparar).

### Resultados reales

**Páginas entregadas** (bajo `[locale]`, en español e inglés, con `noindex`):

| Ruta | Qué hace |
|---|---|
| `/login` | Entrar; acepta `?next=` para volver a donde el usuario iba |
| `/register` | Crear cuenta (nombre, correo, contraseña y confirmación) |
| `/forgot-password` | Pedir el enlace de recuperación |
| `/reset-password?token=…` | Guardar la contraseña nueva |
| `/verify-email?token=…` | Verificar el correo y, si el enlace ya no vale, pedir otro |
| `/account` | Datos personales, preferencias y cerrar sesión (con guardia de sesión) |
| `/account/addresses` | Libreta de direcciones: alta, edición, borrado con confirmación y predeterminada |

**Rutas BFF** (el navegador nunca ve un token): `/api/auth/{register,login,logout,refresh,session,verify-email,resend-verification,forgot-password,reset-password}`
y `/api/account/{profile,addresses,addresses/[addressId]}`.

**Sesión:** cookies `mv_access` (15 minutos) y `mv_refresh` (7 días), `httpOnly` y `Secure` en producción; el
refresh token rota en cada uso y se guarda siempre; el encabezado muestra "Mi cuenta" o "Iniciar sesión"
según la sesión real, resuelta en el servidor (sin parpadeos). El detalle completo está en
`docs/decisiones/0008-autenticacion-y-sesion.md`.

**La interfaz no promete lo que el backend no hace:** como el backend todavía no envía correos (escribe el
enlace en sus registros), la pantalla de recuperación lo dice abiertamente en vez de esperar un correo que no
llega. Queda anotado en `docs/PENDIENTES-BACKEND.md` (apartado 5), junto con la duda de si el correo
verificado debe exigirse para comprar (apartado 6).

### Plan que se aprobó y se siguió

### Objetivo

Registro, inicio de sesión, verificación de email, recuperación de contraseña, perfil, direcciones y
preferencias (idioma y moneda). **La sesión vive siempre en cookies httpOnly gestionadas por el servidor de
Next.js** (patrón BFF): el navegador nunca ve ni guarda un token.

### Endpoints del backend que se usarán

Los definitivos salen del cliente generado (`pnpm api:types`). Los grupos implicados son:

- `POST /api/v1/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` (el refresh rota el token; el
  access caduca a los 15 minutos y el refresh a los 7 días).
- `POST /api/v1/auth/verify-email` y las solicitudes de verificación y de recuperación de contraseña.
- `GET` y `PATCH /api/v1/users/me` (perfil, idioma y moneda preferidos).
- `GET`, `POST`, `PATCH` y `DELETE /api/v1/users/me/addresses` (direcciones de envío).

### Páginas nuevas (bajo `[locale]`)

| Ruta | Contenido |
|---|---|
| `/login` y `/register` | Formularios con validación y errores traducidos por `code` |
| `/forgot-password` y `/reset-password` | Solicitud y cambio de contraseña |
| `/verify-email` | Confirmación del correo (llega con `?token=`) |
| `/account` | Perfil, idioma y moneda preferidos |
| `/account/addresses` | Lista y formulario de direcciones (con actualizaciones optimistas) |

### Rutas BFF (servidor) en `src/app/api/auth/`

`register`, `login`, `logout`, `refresh` y `session`. Fijan y borran las cookies **httpOnly, Secure y
SameSite=Lax**, y **nunca** devuelven tokens al navegador. Un guardia para `/account/**` redirige a `/login`
cuando no hay sesión válida, y el `refresh` se renueva de forma transparente antes de caducar.

### Piezas a construir

- `features/auth`: esquemas Zod compartidos entre cliente y servidor, formularios con React Hook Form y
  hooks de TanStack Query (`useSession`, `useLogin`, `useLogout`, `useAddresses`).
- Mensajes de error por el campo `code` estable de la API (RFC 9457): `invalid_credentials`,
  `email_already_registered`, `invalid_refresh_token`…
- Enlaces reales en el encabezado (cuenta) y en el pie; el estado de sesión se resuelve en el servidor para
  no mostrar/ocultar cosas después de cargar.

### Criterio de «terminado»

`pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm test:e2e` en verde; axe sin infracciones en las páginas
nuevas; formularios usables con teclado y con mensajes claros; commit
`feat(f2): authentication, account and addresses with BFF session cookies`.

### Verificación (definición de «terminado»)

| Comprobación | Resultado |
|---|---|
| `pnpm lint` | ✅ sin errores |
| `pnpm typecheck` | ✅ sin errores |
| `pnpm test` | ✅ **131 pruebas** en 12 archivos (29 nuevas de la F2) |
| `pnpm test:e2e` | ✅ **76 pruebas en verde** contra la compilación de producción (30 nuevas) |
| Accesibilidad (axe) | ✅ sin infracciones en `/login`, `/register` y `/forgot-password` (es/en, claro y oscuro) |
| Seguridad | ✅ prueba automática: **sin tokens** en `localStorage` ni `sessionStorage`, y `/account` exige sesión |

### Defectos reales que encontraron las pruebas y se corrigieron

1. **El navegador no normalizaba el correo:** "Ana@Correo.COM" no encontraba la cuenta, mientras que el backend
   sí guarda los correos en minúsculas. Se igualó con `toLowerCase()` y una prueba unitaria lo fija.
2. **Enlaces dentro de una frase sin subrayar** (regla `link-in-text-block` de axe): en "¿No tienes cuenta?
   Crea una" el enlace se distinguía **solo** por el color. Ahora los enlaces que van dentro de un texto están
   siempre subrayados.
3. **`setState` sincrónico dentro de un efecto** en el panel de verificación de correo, que React desaconseja
   porque provoca renders en cascada: ahora el estado inicial ya sabe si hay token y solo se actualiza cuando
   llega la respuesta.
4. **Pruebas con selectores ambiguos** ("Contraseña" del campo y "Mostrar contraseña" del botón coincidían):
   era un fallo de la prueba, no del producto; se ajustó a una coincidencia exacta.

### Capturas

`docs/capturas/f2/`: entrar, crear cuenta, recuperar contraseña, restablecer contraseña y verificar correo, en
claro y oscuro y a 375 px y 1280 px (`pnpm capture`).

## Fases 3 a 10 — pendientes

Catálogo y búsqueda con filtros por faceta (F3) · página de producto con variantes, preguntas y reseñas (F4) ·
carrito (F5) · checkout y pagos en sandbox (F6) · mis compras, seguimiento y devoluciones (F7) · panel del
vendedor (F8) · panel de administración (F9) · pulido, rendimiento, SEO y despliegue (F10).
