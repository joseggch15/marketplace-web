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
| Servidor en marcha | ✅ `GET /es` → **200** y `GET /es/no-existe` → **404**, con HTML renderizado en el servidor |
| Estado de error real | ✅ como el backend estaba apagado, la portada mostró «Backend no disponible» y cómo levantar­lo (sin datos inventados) |
| CSS generado | ✅ se emiten `shadow-card`, `bg-success-surface`, `text-danger-text`, el foco visible y `prefers-reduced-motion` |
| Responsive | ⏳ por revisar a 375 px y 1280 px, en claro y oscuro (es tuyo) |
| axe (end-to-end) | ⏳ pendiente de instalar el navegador: `pnpm exec playwright install chromium` (descarga ~130 MB; **no lo hice sin tu permiso**) |

### Pendientes inmediatos (2 minutos)

1. **Regenerar los tipos con el backend encendido:** `pnpm api:types` y comprobar que `schema.d.ts` no
   cambia (si cambia, mirar por qué).
2. **Ejecutar las pruebas de accesibilidad:** `pnpm exec playwright install chromium` y luego
   `pnpm test:e2e` (incluye axe en claro y oscuro, a 375 px y 1280 px).
3. **Abrir `E:\ecommerce-web` como carpeta del proyecto en Cline**, para que `.clinerules` del frontend se
   aplique de verdad (el área de trabajo seguía siendo el backend).

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

### Commit sugerido

```
chore(f0): scaffold Next.js 16 App Router, design tokens, i18n es/en, generated API client and secure media proxy
```

---

## Fase 1 · Sistema de diseño — pendiente

Incluirá la página interna `/design-system` con todos los componentes y variantes, y la propuesta de
**2 alternativas al acento turquesa** con validación de contraste AA.

## Fases 2 a 10 — pendientes

Autenticación y cuenta · catálogo y búsqueda · página de producto · carrito · checkout y pagos ·
mis compras · panel del vendedor · panel de administración · pulido y despliegue.
