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

## Fase 1 · Sistema de diseño — **planificada, NO iniciada**

**Motivo por el que no se inició:** el dueño del producto puso una condición explícita («solo si el contexto
de la tarea está por debajo de 100k tokens»). Esta sesión ya supera ese umbral (ha incluido la construcción
completa de la F0 y varias salidas muy grandes de terminal y de HTML), así que se detuvo aquí para no
construir la F1 con menos calidad. **Todo está listo para ejecutarla en una tarea nueva**, sin trabajo perdido.

### Plan listo para ejecutar

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
**2 alternativas lado a lado** (coral y violeta) para que el dueño elija. El acento vive en un solo bloque de
`src/styles/tokens.css` (`--brand-accent*`), así que cambiarlo es editar tres líneas.

**5. Traducciones:** claves nuevas en `messages/es.json` y `messages/en.json` (ningún texto suelto).

**6. Pruebas:** unitarias con Vitest por componente (interacción con teclado y nombres accesibles) y
end‑to‑end de `/design-system` con axe en claro y oscuro, a 375 px y 1280 px.

**7. Documentación y commit:** `docs/decisiones/0007-sistema-de-diseno.md`, actualización de este archivo y
commit `feat(f1): design system page with domain components` (la página usa datos de ejemplo porque es un
catálogo interno; en pantallas reales los componentes se alimentan del backend).

## Fases 2 a 10 — pendientes

Autenticación y cuenta · catálogo y búsqueda · página de producto · carrito · checkout y pagos ·
mis compras · panel del vendedor · panel de administración · pulido y despliegue.
