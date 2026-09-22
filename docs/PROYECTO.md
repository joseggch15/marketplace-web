# Proyecto: frontend del marketplace (documento completo del encargo)

> Este documento es el encargo original, tal como lo entregó el dueño del producto, más las decisiones
> tomadas en la Fase 0. El backend vive en `E:\ecommerce` y el frontend en `E:\ecommerce-web`.
> El resumen de reglas que se aplican al escribir código está en `.clinerules`.

## Rol

Actúa como Frontend Architect Senior y Diseñador de Producto (UI/UX) con experiencia en marketplaces de
alto tráfico como Mercado Libre, Amazon, eBay, AliExpress, Temu y Shein. Dominas diseño de interfaces,
sistemas de diseño, accesibilidad, rendimiento web y SEO. El dueño del producto es principiante en
frontend: explícale cada decisión en español, de forma breve y sencilla.

## Objetivo

Construir el frontend web del marketplace multi-vendedor cuyo backend ya existe: FastAPI, en
`E:\ecommerce`, con documentación OpenAPI en `/openapi.json`. Son tres experiencias:

1. Tienda para compradores (prioridad máxima)
2. Panel del vendedor (Seller Center)
3. Panel de administración

**Datos de la marca:**

- Nombre: **pendiente**. Se usa el placeholder de `src/config/brand.ts` («Mercado Vivo») hasta que el
  dueño verifique que el dominio está libre y que la marca no está registrada ante la Superintendencia de
  Industria y Comercio.
- Personalidad visual: **«Mercado Vivo»** — confiable y moderna (azul de confianza, acento turquesa en
  lugar del amarillo para no parecerse a Mercado Libre).
- Idiomas iniciales: **español e inglés**, con la arquitectura lista para añadir más.


## Stack (no se cambia sin justificarlo y pedir permiso)

- Next.js con App Router (última versión estable) y React
- TypeScript en modo `strict`
- Tailwind CSS + shadcn/ui (componentes accesibles basados en Radix que quedan como código propio)
- TanStack Query para datos del servidor en componentes cliente
- React Hook Form + Zod para formularios y validación
- next-intl para idiomas
- Cliente de API generado automáticamente desde el OpenAPI del backend con `openapi-typescript` +
  `openapi-fetch`. **Nunca** se escriben a mano los tipos de la API
- pnpm como gestor de paquetes y Node.js LTS
- Vitest + Testing Library para componentes; Playwright para pruebas end-to-end, con
  `@axe-core/playwright` para accesibilidad
- ESLint + Prettier
- Despliegue final en Vercel

Antes de usar cualquier API de Next.js o de una librería, se verifica cómo funciona en la versión
instalada. No se asume que funciona como en versiones antiguas.

## Arquitectura

- Proyecto independiente en `E:\ecommerce-web`. No se modifica nada del backend. Si se necesita un cambio
  allá (un endpoint, un campo, CORS), se anota en `docs/PENDIENTES-BACKEND.md` con el motivo y se continúa.
- **Server Components por defecto.** `"use client"` solo donde haya interactividad real.
- **Patrón BFF**: el navegador nunca ve ni guarda tokens. El login pasa por el servidor de Next.js, que
  guarda el access y el refresh token en cookies httpOnly, Secure y SameSite=Lax, y renueva el access token
  automáticamente. Prohibido guardar tokens en `localStorage` o `sessionStorage`.
- Organización por funcionalidad (`features/auth`, `features/catalog`, `features/cart`…), con los
  componentes de UI compartidos en `components/ui`.
- Filtros, búsqueda y paginación viven en la URL (search params), para que cualquier búsqueda se pueda
  compartir y el botón «atrás» funcione.
- Variables de entorno: solo lo público lleva el prefijo `NEXT_PUBLIC_`. Ningún secreto llega al navegador.

## Principios de UI/UX

**Inspiración (tomar lo mejor de cada plataforma):**

- Mercado Libre: preguntas y respuestas en la página de producto, reputación del vendedor visible, envío y
  fecha de entrega destacados.
- Amazon: caja de compra clara, fecha estimada de entrega, checkout corto.
- Shein y AliExpress: grillas visuales con mucha imagen, selector de variantes con muestras de color y
  talla, cupones visibles.
- eBay: señales de confianza y garantía de compra.

**Prohibidos los patrones oscuros:** nada de urgencia falsa, contadores que se reinician, escasez
inventada, costos ocultos que aparecen al final, confirmaciones que avergüenzan («No, prefiero pagar más»)
ni casillas premarcadas. Las ofertas por tiempo limitado muestran solo tiempos y stock reales del backend.

**Reglas de experiencia:**

- Mobile-first: primero se diseña para celular y luego se adapta a escritorio.
- La búsqueda es protagonista: barra siempre visible, autocompletado y filtros por facetas fáciles de usar
  en celular.
- Comprar con el menor número de pasos posible. Se puede agregar al carrito sin iniciar sesión.
- Cada pantalla tiene sus cuatro estados diseñados: cargando (skeletons, no spinners genéricos), vacío (con
  una acción sugerida), error (mensaje claro y cómo resolverlo) y éxito.
- Actualizaciones optimistas en carrito y favoritos, que se revierten si el servidor falla.
- Transparencia de precios: el precio convertido a la moneda del usuario lleva «≈», y en el checkout se
  muestra claramente el monto real que se cobrará, en la moneda del vendedor, antes de pagar.
- Mensajes de error traducidos a partir del `code` estable que devuelve la API.
- Microinteracciones sutiles y útiles, respetando `prefers-reduced-motion`.

## Sistema de diseño

- Tokens de diseño centralizados (colores, tipografía, espaciado, bordes, sombras) como variables CSS.
  Ningún color ni tamaño suelto dentro de los componentes.
- Modo claro y oscuro.
- Tipografía con `next/font`, máximo dos familias (Inter y Plus Jakarta Sans).
- Una página interna `/design-system` que muestra todos los componentes y sus variantes (**F1**).
- Componentes clave del dominio: tarjeta de producto, precio (con moneda y descuento), estrellas de
  calificación, insignias (envío gratis, oferta, más vendido), selector de variantes, selector de
  cantidad, galería de imágenes, pasos del checkout y línea de tiempo del pedido.

## Reglas técnicas no negociables

**Accesibilidad (WCAG 2.2 AA)**

- Todo se puede usar con teclado y el foco siempre es visible.
- Contraste mínimo AA, texto alternativo en las imágenes, etiquetas en todos los campos y HTML semántico.

**Rendimiento (Core Web Vitals en nivel «bueno»)**

- LCP < 2,5 s, INP < 200 ms, CLS < 0,1.
- `next/image` para todas las imágenes, con tamaños definidos, y carga diferida de lo que no está a la vista.
- No agregar librerías pesadas sin justificarlo.

**SEO**

- Páginas de producto y de categoría renderizadas en el servidor, con metadata, Open Graph, datos
  estructurados JSON-LD (`Product`, `Offer`, `AggregateRating`, `BreadcrumbList`), `sitemap.xml`,
  `robots.txt`, URLs amigables con slug, `canonical` y `hreflang` por idioma.

**Internacionalización**

- Idioma y moneda se detectan por ubicación y navegador como valor inicial. El usuario puede cambiarlos
  cuando quiera, y si tiene sesión se guardan en su perfil.
- Números, monedas y fechas con `Intl`, en la zona horaria del usuario.
- Ningún texto visible escrito directamente en los componentes: todo va en los archivos de traducción.

**Pagos**

- Se usan los componentes oficiales de Stripe (Payment Element) y de Mercado Pago (Checkout Bricks). El
  frontend nunca toca ni guarda datos de tarjetas.

**Código**

- Nombres en inglés; comentarios y explicaciones en español.
- Componentes pequeños y reutilizables. Prohibido usar `any` en TypeScript.

## Hoja de ruta por fases

- **F0**: Fundamentos (proyecto, herramientas, cliente de API generado, i18n, tema, layout base con header y
  footer, páginas de error y 404, pruebas configuradas) — **completada**.
- **F1**: Sistema de diseño y página `/design-system`.
- **F2**: Autenticación y cuenta (registro, login, verificación de email, recuperar contraseña, perfil,
  direcciones, preferencias).
- **F3**: Home, categorías y búsqueda con filtros y autocompletado.
- **F4**: Página de producto (galería, variantes, precio, stock, envío, vendedor, preguntas y reseñas).
- **F5**: Carrito.
- **F6**: Checkout y pagos en sandbox.
- **F7**: Mis compras (pedidos, seguimiento, devoluciones, reseñas).
- **F8**: Panel del vendedor.
- **F9**: Panel de administración.
- **F10**: Pulido final (auditoría de accesibilidad, rendimiento y SEO, pruebas end-to-end de los flujos
  críticos y despliegue en Vercel).

## Cómo se trabaja en este proyecto

1. Una fase a la vez. Nunca se avanza sin aprobación.
2. Antes de cada fase se muestra un plan corto: páginas, componentes y endpoints del backend que se usarán.
3. Se pide permiso antes de ejecutar comandos que instalen o borren cosas.
4. Si algo es ambiguo, se pregunta. No se inventan requisitos.
5. Al terminar cada pantalla, se entrega la URL exacta y qué revisar (en celular y en escritorio, en modo
   claro y oscuro).
6. Se mantienen actualizados `docs/PROGRESO.md` y `docs/decisiones/`.

## Ahorro de tokens

- Leer solo los archivos necesarios para la tarea actual. No releer archivos que no han cambiado.
- Hacer cambios puntuales en lugar de reescribir archivos completos.
- Durante el desarrollo, ejecutar solo las pruebas de lo que se está cambiando. La suite completa, el lint
  y el typecheck se ejecutan una vez al final de cada fase.
- No repetir en las respuestas el código que ya se escribió: resumir qué cambió.
- Si el contexto de la tarea supera ~150k tokens, detenerse, actualizar `docs/PROGRESO.md` y pedir abrir una
  tarea nueva.

## Definición de «terminado» para cada fase

- Funciona conectado al backend real, sin datos inventados. La única excepción es un endpoint que no existe,
  y en ese caso queda anotado en `docs/PENDIENTES-BACKEND.md`.
- `pnpm lint`, `pnpm typecheck` y las pruebas pasan.
- Diseño responsive verificado a 375 px y a 1280 px, en modo claro y oscuro.
- Sin errores de accesibilidad de axe en las páginas nuevas.
- `docs/PROGRESO.md` actualizado y un mensaje de commit sugerido.

## Decisiones del dueño del producto al iniciar la F0

1. **Backend:** corre en su propia terminal en `http://127.0.0.1:8000`. No hay que iniciarlo ni detenerlo.
2. **pnpm:** autorizada la instalación y el uso de `create-next-app` dentro de `E:\ecommerce-web`, sin
   borrar la carpeta `docs/`.
3. **Dirección visual:** «Mercado Vivo», cambiando el amarillo de acento para no parecerse a Mercado Libre.
   En la F1 se proponen 2 alternativas de acento y se valida el contraste AA.
4. **Marca:** placeholder en `src/config/brand.ts`; el nombre se decide después de comprobar dominio y
   registro ante la SIC.
5. **Alcance de F0:** home mínima, layout, errores y tokens, sin catálogo.
6. **Imágenes:** se acepta el proxy `/api/media/[key]`, pero solo con claves de prefijos públicos
   (imágenes de producto y logos de tienda), validando la clave. Nunca archivos privados, como los
   documentos de verificación de vendedores. Anotar en `docs/PENDIENTES-BACKEND.md` que el backend debería
   devolver URLs.
7. **Pagos:** la F6 queda en sandbox; la integración real de Stripe y Mercado Pago queda como pendiente del
   backend.
