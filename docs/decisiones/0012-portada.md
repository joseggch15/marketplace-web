# 0012 · Portada real de la tienda

## Qué se decidió

1. **La portada es una tienda, no un tablero del proyecto.** Se van el estado técnico del backend, el plan de
   fases y la etiqueta «Fase 0». El comprador ve: buscador protagonista, categorías con su conteo real,
   «Recién llegados» y «Los más vendidos».
   - El componente `PlatformStatusCard` **se conserva** (es útil para depurar y para la página interna
     `/design-system`) y sus textos se movieron del namespace `Home` a un namespace propio, `Health`.
2. **Buscador en el héroe** con formulario `GET` (`?q=…`): funciona sin JavaScript y la búsqueda queda en la URL,
   así que se puede compartir y el botón «atrás» funciona.
3. **Categorías con conteo real** desde las *facets* de `/catalog/search`, cruzadas con `/catalog/categories`
   para obtener el slug de la URL bonita. Una categoría sin productos publicados no aparece (nunca un «(0)»).
4. **«Los más vendidos» sin orden inventado.** La API **no tiene** un orden `best_selling`, así que se pide una
   página amplia (24 por relevancia) y se ordena por `sold_count` (unidades realmente vendidas en órdenes
   pagadas) en el servidor. La insignia «Más vendido» se muestra **solo en los tres primeros** y el resto enseña
   la cifra real («12 vendidos»): una insignia en todos los productos no informa de nada. Si nadie ha vendido
   nada, la sección no se pinta.
5. **Las tarjetas muestran reputación, tienda y unidades vendidas** cuando el dato existe y no es cero (la API
   ya los devuelve en `ProductSearchItem`). Si no hay reseñas, no se pinta un hueco vacío.
6. **URL de producto por slug** (`/p/balon-de-futbol-profesional-no5`), con la ruta aceptando también el
   identificador para no romper enlaces antiguos. El `canonical` y el `hreflang` apuntan **siempre** al slug: una
   sola dirección por producto.
7. **`sitemap.xml` real**: recorre el catálogo publicado con `GET /catalog/products/public` (paginado por
   cursor, páginas de 500, tope de 10 páginas) y usa `updated_at` como `lastmod`.
8. **Estados de la portada**: carga (esqueletos con la forma final, sección por sección con `Suspense`), vacío
   (sin productos publicados, con una acción), error (el backend no responde, explicado) y éxito. Si una sección
   opcional falla (categorías o más vendidos), se omite y el resto de la página sigue.
9. **El registro deja la sesión iniciada** (decisión 0023 del backend): el BFF guarda las cookies y el carrito
   del invitado se fusiona en el mismo paso. La pantalla pasa a «ya estás dentro» con «ir a la tienda».

## Alternativas descartadas

- **Sección «más vendidos» con un endpoint propio**: no existe y no se puede pedir al backend en esta tarea.
- **Mostrar el estado del backend en el pie**: se descartó; el pie es del comprador y el dato es de desarrollo.
- **Insignia «más vendido» en todos los productos vendidos**: no aporta nada y desvaloriza la insignia.

## Consecuencias

- `src/lib/api/schema.d.ts` se regeneró con `pnpm api:types`: los tipos nuevos (`stock` y `available` en las
  variantes, `price_changed` y `available` en las líneas del carrito, `RegisterOut`) obligaron a completar
  algunas fixtures de pruebas.
- La portada es dinámica (`no-store`) con `Suspense` por sección: el HTML base se sirve al instante y las
  secciones llegan en cuanto el backend responde.
