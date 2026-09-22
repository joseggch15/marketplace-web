# Historial Â· fases 0 a 4 (detalle)

Detalle de las fases ya cerradas, tal como se escribio en su momento. Se conserva como referencia:
**no hace falta leerlo para trabajar en el proyecto** (por eso se movio aqui desde `docs/PROGRESO.md`).

## Fase 0 Â· Fundamentos â€” **completada** (pendiente de tu revisiÃ³n)

### QuÃ© se entregÃ³

| Ãrea | Estado | Detalle |
|---|---|---|
| Proyecto | Hecho | Next.js **16.3.5** (App Router) + React **19.2.8** + TypeScript estricto + Tailwind **4.3.3** + shadcn/ui (base Radix) en `E:\ecommerce-web` |
| Tipos de la API | Hecho | `src/lib/api/schema.d.ts` **generado** desde el OpenAPI del backend (78 rutas) con `openapi-typescript`; cliente `openapi-fetch` en `src/lib/api/client.ts` |
| Idiomas | Hecho | `es` (por defecto) y `en`, con rutas `/es/...` y `/en/...`, detecciÃ³n por navegador y cookie `NEXT_LOCALE` |
| Tema | Hecho | Modo claro y oscuro (`next-themes`), preferencia del sistema por defecto |
| Tokens | Hecho | `src/styles/tokens.css` (colores, sombras, radios, movimiento). NingÃºn color suelto en componentes |
| Layout | Hecho | Encabezado con buscador siempre visible, selector de tema e idioma, pie con enlaces honestos (sin enlaces rotos) |
| Estados | Hecho | Cargando (esqueletos), error, vacÃ­o (404) y Ã©xito diseÃ±ados en las pÃ¡ginas nuevas |
| Errores | Hecho | `error.tsx` (con `digest` y botÃ³n de reintento), `not-found.tsx`, `global-error.tsx` y `global-not-found.tsx` |
| ImÃ¡genes | Hecho | Proxy BFF `/api/media/[...key]` firmado con AWS SigV4, restringido a prefijos pÃºblicos |
| SEO | Hecho | `metadata` con canonical y `hreflang`, Open Graph, `sitemap.xml`, `robots.txt` |
| Pruebas | Hecho | Vitest (46 pruebas) + Playwright con `@axe-core/playwright` (accesibilidad en claro y oscuro) |
| Reglas | Hecho | `.clinerules` y `docs/PROYECTO.md` |

### VerificaciÃ³n (definiciÃ³n de "terminado")

| ComprobaciÃ³n | Resultado |
|---|---|
| `pnpm lint` | âœ… sin errores |
| `pnpm typecheck` | âœ… sin errores |
| `pnpm test` | âœ… 46 pruebas (incluye 36 de contraste AA y 6 de seguridad del proxy de medios) |
| `pnpm build` | âœ… compilÃ³, TypeScript pasÃ³, 8 pÃ¡ginas generadas; `robots.txt` y `sitemap.xml` quedan estÃ¡ticos |
| Tipos desde el backend encendido | âœ… `pnpm api:types` regenerÃ³ `schema.d.ts` y el archivo **no cambiÃ³** (hash SHAâ€‘256 idÃ©ntico), asÃ­ que la generaciÃ³n offline era exacta |
| Pruebas end-to-end | âœ… **22/22** con Playwright (escritorio 1280 px y mÃ³vil Pixel 7) |
| Accesibilidad (axe) | âœ… sin infracciones WCAG 2.2 AA en claro y oscuro, en mÃ³vil y escritorio, en portada, 404 y bÃºsqueda provisional |
| Backend disponible | âœ… la portada mostrÃ³ Â«Todo funcionandoÂ» con PostgreSQL y Redis en Â«CorrectoÂ» |
| NavegaciÃ³n con teclado | âœ… el primer Tab enfoca el enlace Â«Saltar al contenido principalÂ» y el foco es visible |
| Responsive | âœ… verificado automÃ¡ticamente a 375 px y 1280 px (pendiente tu revisiÃ³n visual) |

### Defectos encontrados por las pruebas end-to-end y corregidos

1. **Selector de idioma roto** (`src/components/layout/language-switcher.tsx`): se usaba `asChild` sobre
   `DropdownMenuRadioItem`. En la versiÃ³n instalada ese elemento renderiza tambiÃ©n un indicador, asÃ­ que
   `asChild` (que exige un Ãºnico hijo) lanzaba Â«Primitive.div failed to slot onto its childrenÂ» y el menÃº
   quedaba **vacÃ­o**: el idioma no se podÃ­a cambiar. Ahora se usa `DropdownMenuRadioGroup` con
   `onValueChange` + `router.replace(pathname, { locale })`, que conserva la semÃ¡ntica de botÃ³n de opciÃ³n.
2. **Aviso de Next.js 16 sobre el desplazamiento suave:** se aÃ±adiÃ³ `data-scroll-behavior="smooth"` al
   `<html>` para que Next desactive el desplazamiento suave durante los cambios de ruta.

### Avisos conocidos (no son errores)

- En desarrollo, `next-themes` genera el aviso Â«Encountered a script tag while rendering React componentÂ».
  Es un aviso de React 19 sobre una librerÃ­a de terceros que no rompe nada (el tema se aplica bien, como
  demuestran las pruebas de axe en modo oscuro). No hay ningÃºn `<script>` en nuestro cÃ³digo.
- La terminal de Trae se bloquea con comandos largos: se trabaja con scripts `.ps1` en `%TEMP%` y la salida
  se lee desde archivos.

### Pendientes menores

1. **Abrir `E:\ecommerce-web` como carpeta del proyecto en Cline**, para que `.clinerules` del frontend se
   aplique solo (el Ã¡rea de trabajo seguÃ­a siendo el backend).
2. RevisiÃ³n visual humana (375 px y 1280 px, claro y oscuro) por parte del dueÃ±o del producto.

### URLs para revisar

| URL | QuÃ© mirar |
|---|---|
| http://localhost:3000/es | Portada: tÃ­tulo, buscador, tarjeta de estado del backend (con esqueleto antes de llegar) |
| http://localhost:3000/en | Lo mismo en inglÃ©s |
| http://localhost:3000/es/no-existe | PÃ¡gina 404 traducida, con acciÃ³n sugerida |
| http://localhost:3000/es/search?q=zapatos | PÃ¡gina provisional de bÃºsqueda (la real es la F3) |
| http://localhost:3000/es | BotÃ³n de tema (sol/luna) â†’ alternar claro/oscuro; botÃ³n de idioma â†’ cambiar a inglÃ©s manteniendo la pÃ¡gina |
| http://localhost:3000/robots.txt y /sitemap.xml | SEO |

**QuÃ© revisar a mano:** 375 px (Pixel) y 1280 px (escritorio), en claro y oscuro;
navegar solo con el teclado (Tab) y comprobar que el foco se ve siempre.

### Lo que **no** trae la F0 (a propÃ³sito)

El catÃ¡logo, la bÃºsqueda real, el carrito, la cuenta, los paneles de vendedor y administraciÃ³n.
El enlace del carrito/cuenta no existe todavÃ­a: preferimos no mostrar iconos que lleven a ninguna parte.

### Pendientes anotados en `docs/PENDIENTES-BACKEND.md`

1. **ImÃ¡genes:** el backend solo devuelve `object_key`; convendrÃ­a que devolviera la URL resuelta.
2. **Pagos:** Stripe y Mercado Pago reales necesitan endpoints en el backend (F6 queda en sandbox).
3. **Facetas:** la bÃºsqueda no devuelve conteos por categorÃ­a/marca (se decidirÃ¡ en F3).
4. **CÃ³digos de error:** falta un listado pÃºblico de todos los `code` para traducirlos (F2 lo necesita).

### Notas importantes para la prÃ³xima sesiÃ³n

- **El backend no estaba corriendo** durante esta fase. Los tipos se generaron con
  `pnpm api:types:offline` (lee el cÃ³digo del backend sin levantar el servidor) y **hay que
  regenerarlos con `pnpm api:types`** cuando el backend estÃ© arriba, para confirmar que coinciden.
- El Ã¡rea de trabajo de Cline seguÃ­a siendo `E:\ecommerce` (el backend). Para que `.clinerules` del
  frontend se aplique solo, abre **`E:\ecommerce-web`** como carpeta del proyecto.
- `src/app/[locale]/search/page.tsx` es **provisional**: la bÃºsqueda real es la F3.
- Los enlaces del pie (ayuda, legales, vender) son texto, no enlaces, hasta que existan esas pÃ¡ginas.

### Commit de la fase

```
ea5c655  chore(f0): scaffold Next.js 16 App Router, design tokens, i18n es/en, generated API client and secure media proxy
```

Comprobado antes de confirmar: `.env.local` **sÃ­** estÃ¡ ignorado, `.env.example` **sÃ­** se incluye (75
archivos en el commit) y ni `.env.local` ni `openapi.json` entraron en Ã©l.

---

## Fase 1 Â· Sistema de diseÃ±o â€” **completada**

Se construyÃ³ siguiendo el plan aprobado en la sesiÃ³n anterior, sin cambios de alcance.

### QuÃ© se entregÃ³

**PÃ¡gina `/design-system`** (dentro de `[locale]`, con `noindex` en la metadata: es una pÃ¡gina interna de
trabajo, no debe indexarse).

**1. Componentes base que ya existen** (mostrar todas sus variantes y estados):
`button`, `input`, `badge`, `skeleton`, `dropdown-menu` (tema e idioma).

**2. Componentes de dominio a crear** en `src/components/domain/`:

| Componente | QuÃ© debe resolver |
|---|---|
| `product-card.tsx` | Imagen (`next/image`), tÃ­tulo, precio, reputaciÃ³n, insignias, acciones rÃ¡pidas |
| `price.tsx` | Moneda con `Intl.NumberFormat`, precio anterior tachado, descuento y Â«â‰ˆÂ» para la conversiÃ³n |
| `rating-stars.tsx` | Estrellas accesibles (media y nÃºmero de reseÃ±as), sin depender solo del color |
| `deal-badge.tsx` | Insignias de dominio: envÃ­o gratis, oferta, mÃ¡s vendido (tokens gain/brand/warning) |
| `variant-selector.tsx` | Muestras de color y talla con semÃ¡ntica de botÃ³n de opciÃ³n; variantes sin stock deshabilitadas |
| `quantity-stepper.tsx` | Cantidad con lÃ­mites reales del backend (mÃ­nimo y mÃ¡ximo), etiqueta y teclado |
| `image-gallery.tsx` | GalerÃ­a con miniaturas navegables por teclado y texto alternativo obligatorio |
| `checkout-steps.tsx` | Pasos del checkout con `aria-current` en el paso activo |
| `order-timeline.tsx` | LÃ­nea de tiempo del pedido con los estados reales del backend |

**3. Estados obligatorios** en cada componente: normal, hover, foco, deshabilitado, cargando (esqueleto con
la forma final, no spinner) y error (mensaje claro con la causa traducida).

**4. Acento de marca:** se mantiene el turquesa como valor por defecto y, en `/design-system`, se muestran
**las 3 opciones lado a lado** (turquesa, coral y violeta) para que el dueÃ±o elija. El acento vive en un solo
bloque de `src/styles/tokens.css` (`--brand-accent*`) y se selecciona con el atributo `data-accent` en
`src/app/[locale]/layout.tsx`, asÃ­ que cambiarlo es editar una lÃ­nea. El contraste AA de los tres presets estÃ¡
cubierto por pruebas automÃ¡ticas.

**5. Traducciones:** claves nuevas en `messages/es.json` y `messages/en.json` (ningÃºn texto suelto).

**6. Pruebas:** unitarias con Vitest por componente (interacciÃ³n con teclado y nombres accesibles) y
endâ€‘toâ€‘end de `/design-system` con axe en claro y oscuro, a 375 px y 1280 px.

**7. DocumentaciÃ³n y commit:** `docs/decisiones/0007-sistema-de-diseno.md`, actualizaciÃ³n de este archivo y
commit **`da632e1`** Â· `feat(f1): design system page with domain components` (la pÃ¡gina usa datos de ejemplo
porque es un catÃ¡logo interno; en pantallas reales los componentes se alimentan del backend).

### Componentes creados (9, en `src/components/domain/`)

`Price`, `RatingStars`, `DealBadge`, `ProductCard`, `VariantSelector`, `QuantityStepper`, `ImageGallery`,
`CheckoutSteps` y `OrderTimeline`, cada uno con sus estados y con esqueletos de carga. TambiÃ©n se aÃ±adieron
ayudantes de formato con `Intl` (`src/lib/format/money.ts` y `date.ts`) y los tokens de acento.

### VerificaciÃ³n (definiciÃ³n de Â«terminadoÂ»)

| ComprobaciÃ³n | Resultado |
|---|---|
| `pnpm lint` | âœ… sin errores (`lint_exit=0`) |
| `pnpm typecheck` | âœ… sin errores (`typecheck_exit=0`) |
| `pnpm test` | âœ… **102 pruebas** en 9 archivos (`test_exit=0`); incluye 56 de contraste AA con los tres acentos |
| `pnpm test:e2e` | âœ… **46 pruebas en verde** con la cachÃ© de compilaciÃ³n borrada (`e2e_exit=0`) |
| `pnpm build` | âœ… compilaciÃ³n de producciÃ³n sin errores (`build_exit=0`) |
| Accesibilidad (axe) | âœ… sin infracciones WCAG 2.2 AA en `/design-system` (es/en, claro/oscuro, 375 px y 1280 px) |
| `noindex` | âœ… verificado por prueba automÃ¡tica, fuera del sitemap y bloqueada en `robots.txt` |

### Ajuste de la infraestructura de pruebas

Las pruebas end-to-end fallaban **de forma intermitente** al visitar por primera vez una pÃ¡gina reciÃ©n creada:
en desarrollo, Next.js compila cada pÃ¡gina y cada fragmento de JavaScript la primera vez que se piden, y con
varios trabajadores en paralelo alguno recibÃ­a un fragmento incompleto
(`SyntaxError: Unexpected end of JSON input`) sin que hubiera nada mal en el producto (se comprobÃ³ pidiendo la
pÃ¡gina directamente al servidor: devuelve 200 y el `h1` correcto).

Se resolviÃ³ **en la raÃ­z**: las pruebas end-to-end ahora se ejecutan **contra la compilaciÃ³n de producciÃ³n**
(`command: "pnpm build && pnpm start"` en `playwright.config.ts`), donde el HTML y el JavaScript ya estÃ¡n
compilados y esa carrera no puede ocurrir. Ventajas aÃ±adidas: se miden tiempos reales de producciÃ³n (la suite
completa tardÃ³ **49,6 s** frente a 1 min 54 s con el servidor de desarrollo) y `reuseExistingServer`
reaprovecha el servidor si ya estÃ¡ levantado. En el cÃ³digo quedÃ³ escrito el motivo, para que nadie lo revierta
sin entender por quÃ©.

### Capturas para la revisiÃ³n visual

`node scripts/capture-screenshots.mjs` (atajo `pnpm capture`) recorre las rutas indicadas en modo claro y
oscuro, a 375 px y 1280 px, y las guarda en la carpeta que se le indique. Fija el tema con `emulateMedia` **y**
con `localStorage.theme` (la clave que usa `next-themes`) para que la captura no dependa del sistema operativo
de la mÃ¡quina, y usa `reducedMotion: "reduce"` para no capturar una animaciÃ³n a medias. Las capturas de la F1
estÃ¡n en `docs/capturas/`.

### Defectos reales que encontraron las pruebas y se corrigieron

1. **El turquesa base no llegaba a 3:1** sobre el fondo claro (2,73:1) y se usa en elementos grÃ¡ficos
   (estrellas, bordes activos): se oscureciÃ³ de `#00a99d` a `#009a8f`.
2. **El verde con texto blanco del paso completado** solo daba 3,37:1: se aÃ±adieron
   `--brand-success-strong` / `--brand-success-on-strong` (6,63:1 en claro y 10,97:1 en oscuro).
3. **La insignia y el botÃ³n destructivos de shadcn** no cumplÃ­an AA (4,15:1): ahora usan los tokens de
   peligro validados (`bg-danger-surface text-danger-text`, 6,88:1).
4. **Un mensaje de traducciÃ³n contenÃ­a `<html>`**: next-intl lo interpretaba como etiqueta de texto
   enriquecido (`INVALID_MESSAGE: UNCLOSED_TAG`) y **rompÃ­a toda la pÃ¡gina**. Se reescribiÃ³ el texto. LecciÃ³n
   anotada: en los mensajes no se deben usar `<` ni `>` sin escapar.
5. **Mi propia prueba de Â«nombre accesibleÂ» era incorrecta**: no reconocÃ­a el nombre que un elemento de tipo
   opciÃ³n recibe de su `<label for>`. Ahora comprueba los cuatro mecanismos reales (`aria-label`,
   `aria-labelledby`, texto visible y `label` asociado).

### URLs para revisar

| URL | QuÃ© mirar |
|---|---|
| http://localhost:3000/es/design-system | Toda la pÃ¡gina: tokens, tipografÃ­a, acento, botones, campos, insignias, estados y componentes |
| http://localhost:3000/en/design-system | Lo mismo en inglÃ©s |
| Secciones de la misma pÃ¡gina | `#colors`, `#typography`, `#accent`, `#buttons`, `#fields`, `#badges`, `#feedback`, `#domain` |

**QuÃ© revisar a mano:** en la secciÃ³n del acento, los tres presets (turquesa, coral y violeta) lado a lado;
botones y campos con el teclado (Tab) para ver el foco; 375 px y 1280 px; modo claro y oscuro.

### Commits de la fase

```
da632e1  feat(f1): design system page with domain components
b9ad5a1  docs(f1): record verified results, next-phase plan and testing setup
011ab52  chore(f1): run e2e against the production build, add screenshots tooling and close the phase docs
```

### DecisiÃ³n pendiente del dueÃ±o del producto

Elegir el acento definitivo (**turquesa**, **coral** o **violeta**). Cambiarlo es una sola lÃ­nea en
`src/app/[locale]/layout.tsx` (`data-accent="..."`); el contraste de los tres ya estÃ¡ validado.

## Fase 2 Â· AutenticaciÃ³n y cuenta â€” **completada**

Se construyÃ³ siguiendo el plan aprobado. Primero van los resultados reales y despuÃ©s el plan tal como se
escribiÃ³ antes de empezar (Ãºtil para comparar).

### Resultados reales

**PÃ¡ginas entregadas** (bajo `[locale]`, en espaÃ±ol e inglÃ©s, con `noindex`):

| Ruta | QuÃ© hace |
|---|---|
| `/login` | Entrar; acepta `?next=` para volver a donde el usuario iba |
| `/register` | Crear cuenta (nombre, correo, contraseÃ±a y confirmaciÃ³n) |
| `/forgot-password` | Pedir el enlace de recuperaciÃ³n |
| `/reset-password?token=â€¦` | Guardar la contraseÃ±a nueva |
| `/verify-email?token=â€¦` | Verificar el correo y, si el enlace ya no vale, pedir otro |
| `/account` | Datos personales, preferencias y cerrar sesiÃ³n (con guardia de sesiÃ³n) |
| `/account/addresses` | Libreta de direcciones: alta, ediciÃ³n, borrado con confirmaciÃ³n y predeterminada |

**Rutas BFF** (el navegador nunca ve un token): `/api/auth/{register,login,logout,refresh,session,verify-email,resend-verification,forgot-password,reset-password}`
y `/api/account/{profile,addresses,addresses/[addressId]}`.

**SesiÃ³n:** cookies `mv_access` (15 minutos) y `mv_refresh` (7 dÃ­as), `httpOnly` y `Secure` en producciÃ³n; el
refresh token rota en cada uso y se guarda siempre; el encabezado muestra "Mi cuenta" o "Iniciar sesiÃ³n"
segÃºn la sesiÃ³n real, resuelta en el servidor (sin parpadeos). El detalle completo estÃ¡ en
`docs/decisiones/0008-autenticacion-y-sesion.md`.

**La interfaz no promete lo que el backend no hace:** como el backend todavÃ­a no envÃ­a correos (escribe el
enlace en sus registros), la pantalla de recuperaciÃ³n lo dice abiertamente en vez de esperar un correo que no
llega. Queda anotado en `docs/PENDIENTES-BACKEND.md` (apartado 5), junto con la duda de si el correo
verificado debe exigirse para comprar (apartado 6).

### Plan que se aprobÃ³ y se siguiÃ³

### Objetivo

Registro, inicio de sesiÃ³n, verificaciÃ³n de email, recuperaciÃ³n de contraseÃ±a, perfil, direcciones y
preferencias (idioma y moneda). **La sesiÃ³n vive siempre en cookies httpOnly gestionadas por el servidor de
Next.js** (patrÃ³n BFF): el navegador nunca ve ni guarda un token.

### Endpoints del backend que se usarÃ¡n

Los definitivos salen del cliente generado (`pnpm api:types`). Los grupos implicados son:

- `POST /api/v1/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` (el refresh rota el token; el
  access caduca a los 15 minutos y el refresh a los 7 dÃ­as).
- `POST /api/v1/auth/verify-email` y las solicitudes de verificaciÃ³n y de recuperaciÃ³n de contraseÃ±a.
- `GET` y `PATCH /api/v1/users/me` (perfil, idioma y moneda preferidos).
- `GET`, `POST`, `PATCH` y `DELETE /api/v1/users/me/addresses` (direcciones de envÃ­o).

### PÃ¡ginas nuevas (bajo `[locale]`)

| Ruta | Contenido |
|---|---|
| `/login` y `/register` | Formularios con validaciÃ³n y errores traducidos por `code` |
| `/forgot-password` y `/reset-password` | Solicitud y cambio de contraseÃ±a |
| `/verify-email` | ConfirmaciÃ³n del correo (llega con `?token=`) |
| `/account` | Perfil, idioma y moneda preferidos |
| `/account/addresses` | Lista y formulario de direcciones (con actualizaciones optimistas) |

### Rutas BFF (servidor) en `src/app/api/auth/`

`register`, `login`, `logout`, `refresh` y `session`. Fijan y borran las cookies **httpOnly, Secure y
SameSite=Lax**, y **nunca** devuelven tokens al navegador. Un guardia para `/account/**` redirige a `/login`
cuando no hay sesiÃ³n vÃ¡lida, y el `refresh` se renueva de forma transparente antes de caducar.

### Piezas a construir

- `features/auth`: esquemas Zod compartidos entre cliente y servidor, formularios con React Hook Form y
  hooks de TanStack Query (`useSession`, `useLogin`, `useLogout`, `useAddresses`).
- Mensajes de error por el campo `code` estable de la API (RFC 9457): `invalid_credentials`,
  `email_already_registered`, `invalid_refresh_token`â€¦
- Enlaces reales en el encabezado (cuenta) y en el pie; el estado de sesiÃ³n se resuelve en el servidor para
  no mostrar/ocultar cosas despuÃ©s de cargar.

### Criterio de Â«terminadoÂ»

`pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm test:e2e` en verde; axe sin infracciones en las pÃ¡ginas
nuevas; formularios usables con teclado y con mensajes claros; commit
`feat(f2): authentication, account and addresses with BFF session cookies`.

### VerificaciÃ³n (definiciÃ³n de Â«terminadoÂ»)

| ComprobaciÃ³n | Resultado |
|---|---|
| `pnpm lint` | âœ… sin errores |
| `pnpm typecheck` | âœ… sin errores |
| `pnpm test` | âœ… **131 pruebas** en 12 archivos (29 nuevas de la F2) |
| `pnpm test:e2e` | âœ… **76 pruebas en verde** contra la compilaciÃ³n de producciÃ³n (30 nuevas) |
| Accesibilidad (axe) | âœ… sin infracciones en `/login`, `/register` y `/forgot-password` (es/en, claro y oscuro) |
| Seguridad | âœ… prueba automÃ¡tica: **sin tokens** en `localStorage` ni `sessionStorage`, y `/account` exige sesiÃ³n |

### Defectos reales que encontraron las pruebas y se corrigieron

1. **El navegador no normalizaba el correo:** "Ana@Correo.COM" no encontraba la cuenta, mientras que el backend
   sÃ­ guarda los correos en minÃºsculas. Se igualÃ³ con `toLowerCase()` y una prueba unitaria lo fija.
2. **Enlaces dentro de una frase sin subrayar** (regla `link-in-text-block` de axe): en "Â¿No tienes cuenta?
   Crea una" el enlace se distinguÃ­a **solo** por el color. Ahora los enlaces que van dentro de un texto estÃ¡n
   siempre subrayados.
3. **`setState` sincrÃ³nico dentro de un efecto** en el panel de verificaciÃ³n de correo, que React desaconseja
   porque provoca renders en cascada: ahora el estado inicial ya sabe si hay token y solo se actualiza cuando
   llega la respuesta.
4. **Pruebas con selectores ambiguos** ("ContraseÃ±a" del campo y "Mostrar contraseÃ±a" del botÃ³n coincidÃ­an):
   era un fallo de la prueba, no del producto; se ajustÃ³ a una coincidencia exacta.

### Capturas

`docs/capturas/f2/`: entrar, crear cuenta, recuperar contraseÃ±a, restablecer contraseÃ±a y verificar correo, en
claro y oscuro y a 375 px y 1280 px (`pnpm capture`).

## Fase 3 Â· CatÃ¡logo y bÃºsqueda â€” **completada**

### QuÃ© se entregÃ³

| Ruta | QuÃ© hace |
|---|---|
| `/search` | Resultados con filtros (texto, categorÃ­a, marca, rango de precio y orden), todo en la URL; `noindex` |
| `/c/<slug>` | CategorÃ­a con contenido propio: tÃ­tulo, descripciÃ³n, `canonical` y `hreflang` (indexable) |

**Piezas nuevas:** `src/features/catalog/` (`params.ts` con los filtros de la URL, `api.ts` server-only,
`selectors.ts` para el Ã¡rbol de categorÃ­as, `components/product-grid.tsx` y
`components/search-filters.tsx`), `src/lib/media/url.ts` (`mediaUrl()`) y la decisiÃ³n
`docs/decisiones/0009-catalogo-y-busqueda.md`.

**Reutilizado sin tocar:** `ProductCard`, `Price` y `Skeleton` de la F1, y el proxy de medios de la F0.

**Lo que se decidiÃ³ no pintar (por honestidad):** los resultados de bÃºsqueda no traen reputaciÃ³n ni tienda, asÃ­
que **no** se muestran estrellas (serÃ­a inventar valoraciones) ni Â«vendido porÂ». EstÃ¡ pedido en el apartado 7
de `docs/PENDIENTES-BACKEND.md`, junto con la moneda por producto (hoy se usa la moneda por defecto, COP) y el
filtro por categorÃ­a exacta (el backend todavÃ­a no incluye subcategorÃ­as).

### VerificaciÃ³n (definiciÃ³n de Â«terminadoÂ»)

| ComprobaciÃ³n | Resultado |
|---|---|
| `pnpm lint` | âœ… sin errores |
| `pnpm typecheck` | âœ… sin errores |
| `pnpm test` | âœ… **147 pruebas** en 13 archivos (16 nuevas de la F3) |
| `pnpm test:e2e` | âœ… **92 pruebas en verde** contra la compilaciÃ³n de producciÃ³n (16 nuevas) |
| Accesibilidad (axe) | âœ… sin infracciones en `/search` (es/en, claro y oscuro) |
| SEO | âœ… `/search` con `noindex` y `/c/<slug>` con `canonical`, `hreflang` y `index` |

### Defecto real que encontrÃ³ la revisiÃ³n y se corrigiÃ³

**Dos botones con el mismo nombre accesible en la misma pantalla:** el filtro tenÃ­a un botÃ³n de lupa con
`aria-label="Buscar"` y otro botÃ³n "Buscar" debajo (ademÃ¡s del de la cabecera). Para quien usa un lector de
pantalla son tres botones indistinguibles. Se dejÃ³ **un solo** botÃ³n de envÃ­o en el formulario (con la lupa
dentro) y el formulario lleva su propio `aria-label` para poder distinguirlo del buscador de la cabecera.

### Capturas

`docs/capturas/f3/` (16 imÃ¡genes: bÃºsqueda general, bÃºsqueda con texto, con filtros y pÃ¡gina de categorÃ­a, en
claro y oscuro y a 375 px y 1280 px). **Regeneradas con el backend encendido y el catÃ¡logo de demostraciÃ³n
sembrado** (`scripts/seed-demo.mjs`: 12 productos con variantes, precios e imÃ¡genes), asÃ­ que muestran la tienda
real con fotos. La primera tanda se habÃ­a hecho sin backend y solo servÃ­a para revisar el estado vacÃ­o y el
aviso de "catÃ¡logo no disponible".

## Fase 4 · Página de producto — **completada**

### Qué se entregó

| Ruta | Qué hace |
|---|---|
| `/p/<identificador>` | Ficha del producto: galería, marca, nota media real, descripción, **variantes con stock real**, reseñas con paginación por cursor y preguntas con las respuestas del vendedor. Indexable, con `canonical`, `hreflang` y JSON-LD |
| `POST /api/products/<id>/questions` | Ruta BFF que publica una pregunta con la sesión del usuario (valida el cuerpo y renueva el token si caducó) |

**Piezas nuevas:** `src/features/product/` (`api.ts` server-only, `selectors.ts` y `json-ld.ts` puros y
probados, `params.ts`, `schemas.ts`, `error-codes.ts`, `client.ts` + `hooks.ts` y
`components/{purchase-panel,reviews-section,questions-section,question-form}`),
`src/components/domain/{breadcrumbs,json-ld}.tsx`, `src/lib/api/bff-client.ts` (la llamada del navegador a las
rutas BFF, compartida con la F2), `src/lib/seo/json-ld.ts`, la decisión
`docs/decisiones/0010-pagina-de-producto.md` y el `sitemap.xml` ampliado con categorías y productos.

**Reutilizado:** `ImageGallery`, `VariantSelector`, `QuantityStepper`, `Price`, `RatingStars` y `DealBadge` de
la F1 (a `RatingStars` solo se le añadió `count` opcional para valorar una reseña suelta), el proxy de medios
de la F0 y `listCategories` del catálogo de la F3.

**Lo que se decidió no pintar (por honestidad):** no hay «vendido por» ni reputación del vendedor ni fecha de
entrega porque la API pública no devuelve esos datos (apartados 10 y 11 de `docs/PENDIENTES-BACKEND.md`), y el
botón «Agregar al carrito» queda **deshabilitado y explicado** hasta la F5 (el carrito). Las variantes se
identifican por su **SKU** porque el backend todavía no expone los valores de atributo.

**Stock real, no inventado:** se pide al inventario del backend (`GET /inventory/items/{variant_id}`). Si no
se puede comprobar, la ficha lo dice y no marca nada como agotado; el selector de cantidad desaparece en lugar
de inventar un máximo.

### Verificación (definición de «terminado»)

| Comprobación | Resultado |
|---|---|
| `pnpm lint` | ✅ sin errores |
| `pnpm typecheck` | ✅ sin errores |
| `pnpm test` | ✅ **231 pruebas** en 22 archivos (76 nuevas) |
| `pnpm test:e2e` | ✅ **108 pruebas en verde** contra la compilación de producción (16 nuevas) |
| Accesibilidad (axe) | ✅ sin infracciones en la ficha y en el 404 (es/en, claro y oscuro, 375 px y 1280 px) |
| SEO | ✅ `canonical` y `hreflang`, Open Graph y JSON-LD `Product`/`Offer`/`AggregateRating`/`BreadcrumbList` |

### Defectos reales que encontraron las pruebas y se corrigieron

1. **La ficha no podía tener `loading.tsx`.** Con él, Next.js envía la página en streaming y fija el estado
   HTTP en 200 antes de resolverse el `notFound()`: un producto inexistente respondía **200 con el texto de
   «no encontrado»** (un *soft 404*, que Google penaliza). Lo encontró la prueba end-to-end que exige un 404 de
   verdad; se eliminó el archivo y se documentó la decisión.
2. **La herramienta de capturas pisaba archivos.** `slugFor()` quitaba el idioma, así que `/es/p/<id>` y
   `/en/p/<id>` producían el mismo nombre y la segunda captura sobrescribía a la primera. Ahora el nombre
   incluye el idioma (`es-p-…`, `en-p-…`).
3. **Las pruebas de axe sobre un 404 medían un estado a medias.** Los 404 de una ruta dinámica los sirve el
   documento de error de Next.js, que en el HTML inicial no lleva `lang`; React lo añade al hidratar. Las
   pruebas ahora esperan a la hidratación antes de auditar (limitación del framework anotada en la decisión
   0010; afecta a todos los 404 del proyecto, no solo a los de la F4).
4. **Dos fallos propios que cazaron las pruebas unitarias:** el resumen de texto recortaba a 298 caracteres en
   vez de 300, y la prueba de las reseñas esperaba un `href` sin el idioma que next-intl añade a los enlaces
   internos.

### Capturas

`docs/capturas/f4/` (24 imágenes): la ficha de un producto con dos presentaciones y una sola imagen (es y en),
la de un producto de una sola presentación, la página 404 y el estado «el servicio no responde» (backend
detenido), todas en claro y oscuro y a 375 px y 1280 px. **Hechas con el backend encendido y el catálogo de
demostración sembrado**, así que se ven precios, stock y la imagen real; el estado de error se capturó
deteniendo el backend a propósito.


### Commit de la fase

`2c42056` — `feat(product): add the product page with real stock, reviews and questions`
(70 archivos, 3.422 líneas añadidas). Incluye el código, las pruebas, las capturas y la documentación de la
fase, ya subido a `joseggch15/marketplace-web` (`master`).

