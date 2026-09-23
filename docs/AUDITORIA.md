# Auditoría antes de publicar (F10)

Resumen de lo que se ha revisado, **con qué se ha medido** y qué queda pendiente. Se hizo antes de la F10 y se
repite al cerrar cada fase; aquí queda el estado final del prototipo.

## Accesibilidad

**Con qué se mide:** `@axe-core/playwright` en las pruebas end-to-end, con las etiquetas de **WCAG 2.2 AA**
(`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`), en **claro y oscuro**, en cada página nueva y en cada
pantalla del recorrido completo. Se ejecuta contra la **compilación de producción**, no contra el servidor de
desarrollo.

**Qué se comprobó a mano además de axe** (axe no ve todo):

- El **foco es visible** al navegar con el teclado (prueba propia en la portada y en el sistema de diseño).
- Todos los **botones tienen nombre accesible** (prueba del sistema de diseño).
- El **significado nunca depende del color**: los estados llevan icono y texto traducido.
- Los formularios asocian etiqueta, ayuda y error con `aria-describedby` y marcan `aria-invalid`; los avisos son
  `role="alert"` (error) o `role="status"` (éxito).
- Los controles de puntuación (reseñas) y cantidad son controles nativos (radios, botones) con etiquetas, no
  divs con `onClick`.
- Los campos de dinero y unidades usan `inputMode` para que el móvil muestre el teclado correcto.

**Lo que se corrigió por estas pruebas:** el layout solo envía al navegador una **lista blanca** de espacios de
mensajes y le faltaban `Checkout`, `Orders`, `Seller` y `Admin`; sin ellos, las pantallas de esas features fallaban
con `MISSING_MESSAGE`. Ahora está anotado en el propio layout.

**Pendiente:** una revisión con **lector de pantalla real** (NVDA o VoiceOver) de los flujos de compra y venta, que
es lo único que no se puede automatizar. Se recomienda hacerla con el despliegue de producción y un usuario que no
sea el desarrollador.

## Rendimiento

**Decisiones que acotan el trabajo del navegador:**

- **Server Components por defecto.** El JavaScript de cliente se limita a los formularios y a los contadores; los
  listados, los paneles y las fichas se renderizan en el servidor.
- **Sin librerías de datos en el navegador**: el navegador solo habla con nuestras rutas BFF; el backend y sus
  tipos viven en el servidor.
- **Tipografías** con `next/font` (se descargan en la compilación y se sirven desde nuestro dominio).
- **Imágenes** con `next/image` y el proxy `/api/media/...`, que cachea una hora en el borde y un día en el
  navegador.
- **Paginación por cursor** en todos los listados grandes (pedidos, catálogo, ventas, usuarios, preguntas): no hay
  `OFFSET` que se degrade con el tiempo.
- **Sumas de dinero con `BigInt`** en lugar de `number`: exactas y sin coste perceptible (se recorre el mismo
  listado que ya se ha leído).

**Lo que se midió:** `pnpm build` termina sin errores ni avisos, con **48 rutas** (páginas y BFF) y **0 errores**
de `eslint` (queda 1 aviso de `react-hook-form` en el checkout y ninguno en el resto) y **0 errores** de
`tsc --noEmit`.

**Pendiente (recomendado, no bloqueante):** medir con **Lighthouse/PageSpeed** la URL pública de producción (móvil
y escritorio) en `/es`, una ficha de producto y el buscador, y activar **Vercel Analytics** o el RUM del proveedor
para tener datos reales. En local, con backend y base de datos en la misma máquina, las cifras no representan al
usuario final.

## SEO

**Ya está implementado:**

- `lang` correcto por idioma, `canonical` y `hreflang` en todas las páginas (`es` y `en`).
- Metadatos por página (`title` con plantilla, `description`) y **Open Graph** con el nombre de la marca.
- `sitemap.xml` y `robots.txt` **dinámicos**: el mapa recorre el catálogo publicado con `slug` y `updated_at`.
- **JSON-LD** de producto (precio, moneda, disponibilidad, valoración) y de la organización en la portada.
- **URLs legibles** con el `slug` del producto (`/es/p/<slug>`) y del catálogo por categoría.
- **`noindex`** en todo lo privado: cuenta, direcciones, mis compras, panel del vendedor, panel de administración
  y sistema de diseño.
- **404 traducido** con salida a la tienda, no una página en blanco.

**Pendiente:** dar de alta el dominio en **Google Search Console** y enviar el `sitemap.xml` (lo hace el dueño
después de publicar), y revisar los datos estructurados con la prueba de resultados enriquecidos de Google.

## Seguridad (repaso rápido antes de publicar)

- Cookies de sesión **httpOnly, Secure en producción y SameSite=Lax**; los tokens **nunca** llegan al navegador.
- Autorización en **cada** endpoint del backend (vendedor dueño de su tienda, comprador dueño de sus pedidos,
  administrador con rol), y el frontend no la sustituye: solo decide qué se enseña.
- `CORS` restringido, validación de entrada con Zod en cada ruta BFF, y **cero secretos** en el repositorio
  (`.env.example` con marcadores).
- Rate limiting del backend en login, registro, recuperación de contraseña y publicación de preguntas, con los
  códigos traducidos en la interfaz.
- Proxy de medios con **lista exacta** de tipos de imagen (SVG prohibido) y cabeceras `nosniff` y
  `Content-Security-Policy: default-src 'none'`.
- **Nunca** se almacenan datos de tarjeta: la pasarela los tokeniza y el webhook se verifica por firma.

**Pendiente en producción:** rotar los secretos respecto a los de desarrollo, activar copias de seguridad de la
base de datos y revisar los límites de los proveedores (los gratuitos suelen tener límites de tráfico).
