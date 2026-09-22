# 0009 · Catálogo y búsqueda (filtros en la URL y paginación por cursor)

- **Fecha:** 22 de septiembre de 2026 (Fase 3)
- **Estado:** aceptada

## Contexto

El backend expone `GET /api/v1/catalog/search` con `q`, `category_id`, `brand`, `min_price`, `max_price`,
`sort` (`newest` por defecto, `price_asc`, `price_desc`, `relevance`), `cursor` y `limit` (1..100, 20 por
defecto), y `GET /api/v1/catalog/categories`. Dos limitaciones reales condicionan el diseño:

1. **No hay conteos por faceta** (`facets`), ni total de resultados: la respuesta trae `items` y `next_cursor`.
2. **Los resultados son pobres**: `ProductSearchItem` = `id, title, slug, brand, category_id, min_price,
thumbnail`. Sin reputación, sin tienda, sin moneda y con `thumbnail` como **clave de objeto**, no URL.

Ambas están anotadas en `docs/PENDIENTES-BACKEND.md` (apartados 3 y 7).

## Decisión

1. **Los filtros viven en la URL** (`/es/search?q=…&category_id=…&sort=…`), no en el estado de un componente.
   Toda búsqueda es compartible, el botón "atrás" funciona y la página se puede renderizar en el servidor.
   Toda la conversión está en `src/features/catalog/params.ts` (`parseCatalogQuery`, `toSearchParams`,
   `catalogHref`) y tiene pruebas unitarias, porque un fallo aquí sería silencioso: la búsqueda parecería
   funcionar mostrando otra cosa.
2. **Los precios viajan como texto.** El backend usa `Decimal`; el proyecto prohíbe el punto flotante para
   dinero. Se aceptan "1500" y "1500,50" (coma o punto) y se **rechaza** lo que no sea un precio válido;
   "1.500" (separador de miles) no se interpreta como 1500, para no adivinar.
3. **Renderizado en el servidor.** `/search` y `/c/<slug>` son Server Components que piden los datos con
   `cache: "no-store"` (el catálogo cambia y no queremos servir precios viejos). El filtro es un componente
   cliente que solo **navega**: no filtra en el navegador ni guarda estado de resultados.
4. **La búsqueda degrada sin backend.** `searchProducts()` y `listCategories()` devuelven
   `{ ok: true, data } | { ok: false, reason: "unavailable" }`, nunca una excepción: si la API está caída se
   muestra un aviso traducido con salida al inicio (mismo patrón que `features/health/api.ts`). Esto permite
   además que las pruebas end-to-end de la fase corran sin backend.
5. **Paginación por cursor con "Ver más resultados".** Los cursores son opacos y **solo hacia adelante**, así
   que la primera entrega navega a `?cursor=…` (compartible, sin JavaScript) en lugar de scroll infinito, que
   exige acumular páginas en el cliente. El cursor se **descarta al cambiar cualquier filtro**.
6. **`/search` no se indexa; `/c/<slug>` sí.** El buscador generaría infinitas combinaciones de filtros en
   Google; las categorías tienen contenido propio (título, descripción, `canonical` y `hreflang`).
7. **No se pintan estrellas que no existen.** `RatingStars` está probado y disponible, pero los resultados no
   traen reputación: se muestra imagen, título y precio, y cuando el backend añada `rating_average` y
   `review_count` se rellena ese hueco sin tocar nada más.
8. **Moneda de los precios: la por defecto del backend (COP).** La respuesta de búsqueda no dice la moneda de
   cada producto; se usa `defaultCurrency` de `src/i18n/routing.ts` y queda anotado como pendiente.
9. **Las imágenes pasan por el proxy propio** (`mediaUrl()` en `src/lib/media/url.ts`): valida la clave antes
   de construir `/api/media/<clave>` y devuelve `null` si no es pública, de modo que la tarjeta muestra "sin
   imagen" en lugar de un enlace roto.

## Alternativas descartadas

- **Filtrar en el cliente** (traer todo y filtrar con JavaScript). Descartada: no escala, rompe el SEO y la
  búsqueda dejaría de ser compartible.
- **Paginación por `offset`.** Descartada por el proyecto: da resultados inconsistentes cuando el catálogo
  cambia mientras el usuario navega.
- **Scroll infinito ya.** Descartada en esta entrega por coste/beneficio: requiere acumular páginas en el
  cliente (estado, duplicados, accesibilidad del foco). "Ver más resultados" es correcto, accesible y
  compartible; el scroll infinito se puede añadir encima sin cambiar los parámetros de la URL.
- **Mostrar `commission_rate`** (viene en `CategoryOut`). Descartada: es información del vendedor, no del
  comprador.
- **Interpretar "1.500" como 1500.** Descartada: adivinar el formato puede cobrar un precio equivocado; se
  rechaza y se pide un número sin separador de miles.

## Consecuencias

- El filtro de categoría es **exacto**: el backend no incluye subcategorías, así que un producto de
  "celulares" no aparece al filtrar por "tecnología". Cuando el backend lo soporte (`category_id` + `children`
  o un parámetro `include_children`), solo cambia `params.ts`.
- Cuando el backend devuelva conteos de faceta, se mostrarán junto a cada filtro sin cambiar la URL (el
  apartado 3 de `docs/PENDIENTES-BACKEND.md` ya lo pide).
- Los enlaces de producto apuntan a `/p/<slug>`, que llega en la F4; hasta entonces muestran la página 404
  traducida (y así queda dicho en `docs/PROGRESO.md`).
