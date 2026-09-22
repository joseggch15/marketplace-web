# 0010 · Página de producto (identificador en la URL, stock real y datos que no se inventan)

- **Fecha:** 22 de septiembre de 2026 (Fase 4)
- **Estado:** aceptada

## Contexto

La ficha de producto es la pantalla donde el proyecto se juega la conversión, así que hay que decidir con
cuidado qué se muestra. Los datos disponibles en la API pública son:

- `GET /api/v1/catalog/products/{product_id}` → `ProductOut`: `id`, `store_id`, `category_id`, `title`, `slug`,
  `description`, `brand`, `status`, `created_at`, `variants[]` y `images[]`.
- `VariantOut`: **solo** `id`, `sku`, `price` y `compare_at_price`.
- `GET /api/v1/inventory/items/{variant_id}` → stock real de la variante (endpoint público, sin sesión).
- `GET /api/v1/products/{product_id}/reviews` → reseñas, `rating_average`, `rating_count` y `next_cursor`.
- `GET /api/v1/products/{product_id}/questions` (sin `cursor`) y `POST` de la misma ruta (con sesión).

Tres limitaciones reales condicionan el diseño (anotadas en `docs/PENDIENTES-BACKEND.md`):

1. **No hay endpoint por `slug`** (apartado 9).
2. **Las variantes no traen valores de atributo ni stock** (apartado 10, nuevo).
3. **No hay datos públicos de la tienda ni de envío** (apartado 11, nuevo).

## Decisión

1. **La ficha vive en `/p/<product_id>`.** No hay forma de resolver un slug, y buscar por `q=<slug>` no sirve
   (el buscador indexa título y marca). Se prefiere una URL con identificador, indexable y con `canonical` y
   `hreflang` correctos, antes que mostrar la página 404 o inventar una dirección que el backend no entiende.
   El cambio a `/p/<slug>` cuando el backend lo permita son dos líneas (esta ruta y el enlace del catálogo).
2. **El stock es real o no se muestra.** Se pide a `GET /inventory/items/{variant_id}`, una vez por variante
   (dos o tres peticiones en paralelo). Si el endpoint responde 404, la variante tiene **0** unidades; si la
   petición falla, la disponibilidad queda **desconocida** y la interfaz lo dice, sin deshabilitar nada ni
   marcar «agotado»: afirmar algo que no se sabe es justo lo que el proyecto prohíbe.
3. **Las variantes se identifican por su SKU.** Es el único dato que las distingue hoy. Se ordenan por precio
   (la más barata primero) y, a igual precio, por SKU, comparando en **unidades menores exactas**
   (`toMinorUnits` → `BigInt`), nunca con `parseFloat`: el proyecto prohíbe el punto flotante con dinero.
4. **La caja de compra no promete lo que no hay.** El selector de variantes y el de cantidad funcionan con
   datos reales, pero «Agregar al carrito» está **deshabilitado y explicado**: el carrito es la F5. Un botón
   que no hace nada y no lo dice sería mentir al usuario.
5. **El formulario de preguntas pasa por el BFF.** `POST /api/products/{productId}/questions` valida el
   identificador, valida el cuerpo con Zod (3..2000 caracteres, igual que el backend) y usa `withAccessToken`
   para renovar la sesión si el access token caducó. El navegador no ve tokens en ningún momento.
6. **Reseñas paginadas por cursor en la URL; preguntas sin paginar.** Las reseñas aceptan `cursor`, así que
   «Ver más reseñas» navega a `?reviews_cursor=…` (compartible y sin JavaScript), mientras que el `canonical`
   apunta siempre a la dirección limpia. Las preguntas **no** se paginan porque la API no acepta `cursor`: se
   muestran las 20 primeras y no se ofrece lo que no existe.
7. **Nada de reputación inventada.** Las estrellas salen de `rating_average` y `rating_count`; sin reseñas se
   dice «este producto todavía no tiene reseñas» y el JSON-LD **omite** `aggregateRating`.
8. **SEO completo:** `metadata` con `canonical` y `hreflang`, Open Graph y datos estructurados `Product` +
   `Offer` + `AggregateRating` + `BreadcrumbList`. El `availability` de la oferta también respeta el punto 2:
   se omite si no se pudo comprobar el stock. El `sitemap.xml` pasa a incluir categorías y productos (la
   primera página del buscador, 100, anotado como pendiente en el apartado 13).
9. **El JSON-LD se escapa.** Se inserta con `dangerouslySetInnerHTML`, así que `serializeJsonLd` convierte
   `<`, `>`, `&` y los separadores Unicode en escapes `\u…`. El título de un producto lo escribe un vendedor:
   sin ese escape, un `</script>` dentro del título cerraría la etiqueta y permitiría inyectar HTML.
10. **El 404 real manda sobre el esqueleto de carga.** La ruta **no** tiene `loading.tsx`. Con él, Next.js
    envía la página en streaming y fija el estado HTTP en **200 antes** de que se resuelva el `notFound()`: un
    producto que no existe respondería 200 con el texto de «no encontrado» (un _soft 404_, que Google marca como
    error). Se descubrió con la prueba end-to-end que exige un 404 de verdad, y se prefirió el estado HTTP
    correcto: la ficha es dinámica y tarda milisegundos en pintarse.

## Alternativas descartadas

- **Montar la ficha en `/p/<slug>` sin endpoint por slug.** Descartada: daría 404 o exigiría traerse el catálogo
  entero para buscar el slug en el navegador (lento y peor para el SEO).
- **Anunciar «desde $X» con la horquilla de precios de las variantes.** Descartada: un `Offer` con horquilla no
  es válido para Google y confunde al comprador; se declara el precio de la variante más barata y la caja de
  compra muestra el precio de la presentación elegida.
- **Inventar un máximo de 10 unidades en el selector de cantidad.** Descartada: es la regla de la casa (nunca
  escasez inventada) y además permitiría comprar lo que no hay.
- **Mostrar el nombre de quien pregunta o reseña.** Descartada: la API no lo devuelve y no se puede deducir.
- **Una ficha completamente cliente con `useQuery`.** Descartada: debe renderizarse en el servidor por SEO y
  para que los datos lleguen en el primer pintado. Solo es cliente lo que necesita estado (variantes, cantidad
  y el formulario de preguntas).
- **Un botón «Agregar al carrito» que no hace nada.** Descartada por honestidad: se deja deshabilitado y con
  una explicación visible.
- **`loading.tsx` con esqueletos en la ruta del producto.** Descartada (al principio se implementó y la prueba
  end-to-end la tumbó): activa el streaming de Next.js y el estado HTTP queda en 200 antes de resolverse el
  `notFound()`, así que los productos inexistentes pasaban a ser _soft 404_. Los esqueletos siguen existiendo
  como componentes (`ImageGallerySkeleton`, `VariantSelectorSkeleton`, `PriceSkeleton`) para las pantallas que
  sí puedan usarlos sin romper el estado HTTP.

## Consecuencias

- Cada ficha hace **una petición por variante** al inventario. Cuando el backend incluya el stock en
  `ProductOut` (apartado 10), se borra `fetchAvailability` y la ficha vuelve a una sola petición.
- Cuando existan datos públicos de tienda y de envío (apartado 11), se añaden los bloques «vendido por» y
  «entrega estimada» sin cambiar nada de lo decidido aquí.
- `src/lib/api/bff-client.ts` pasa a ser la única llamada del navegador a nuestras rutas BFF (la usan la F2 y
  la F4): si mañana cambia la forma de tratar los errores, cambia en un solo sitio.
- **Limitación conocida (del framework, no de esta fase):** los 404 de una ruta dinámica los sirve Next.js con
  su documento de error (`<html id="__next_error__">`), que en el HTML inicial **no** lleva `lang`; React lo
  añade al hidratar, así que el documento que ve (y audita) el navegador sí cumple WCAG 3.1.1. Afecta a todos
  los 404 del proyecto (también al comodín `[...rest]` de la F0), están marcados con `noindex` y las pruebas
  end-to-end esperan a la hidratación antes de auditar. Si algún día se quiere corregir de raíz, hay que
  revisar cómo compone Next el documento cuando no existe un `layout` raíz (el del idioma vive en
  `[locale]/layout.tsx`, que es lo que pide next-intl).
