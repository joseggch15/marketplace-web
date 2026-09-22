# Pendientes del backend

Cosas que el backend (`E:\ecommerce`) debería cambiar o exponer para que el frontend quede como se
espera. **Nada de esto se ha tocado**: el backend es de solo lectura para este proyecto.

## 1. URLs de imágenes (imágenes de producto y logos de tienda) — F0

**Qué pasa hoy:** la API devuelve solo `object_key` (por ejemplo `products/9c1f...e4.jpg`) en
`ProductImageOut` y en el `thumbnail` de los resultados de búsqueda (`ProductSearchItem`). El bucket de
MinIO no tiene política de lectura pública, así que el navegador no puede cargar la imagen directamente.

**Por qué importa:** sin URL, el frontend no puede usar `next/image` con optimización ni cacheo por CDN, y
el navegador no puede pedir los archivos desde MinIO sin credenciales.

**Solución provisional en el frontend (F0):** proxy interno `/api/media/[key]` (Route Handler del BFF) que
valida la clave contra una lista de **prefijos públicos permitidos** (`products/`; `stores/` reservado
para logos) y un formato estricto, y luego transmite el archivo con cabeceras de caché.
**Nunca** sirve objetos con otros prefijos: los documentos de verificación de vendedores y cualquier
archivo privado quedan fuera por diseño.

**Solución recomendada en el backend (elegir una):**
- Devolver en la respuesta un campo `url` ya resuelto (público o presignado con caducidad corta), o
- Exponer un endpoint `GET /api/v1/media/{key}` con la misma validación de prefijos, o
- Definir política de lectura pública **solo** para el prefijo `products/` del bucket y devolver la URL
  base en la configuración.
- Además, `new_object_key()` en `app/core/storage.py` genera siempre claves `products/...`, incluso para
  logos de tienda; convendría parametrizar el prefijo (`products/`, `stores/`).

**Impacto si no se cambia:** funciona, pero cada imagen pasa por el servidor del frontend (más carga y
menos caché de CDN) y hay dos sitios con la lógica de "qué archivo es público".

## 2. Pagos reales (Stripe y Mercado Pago) — F6

**Qué pasa hoy:** `PAYMENT_PROVIDER=sandbox` y la confirmación se hace con
`POST /orders/{order_id}/payments` + `POST /payments/{payment_id}/simulate`.

**Por qué importa:** los componentes oficiales de Stripe (Payment Element) y Mercado Pago (Checkout
Bricks) necesitan que el backend cree un **PaymentIntent** (Stripe) o una **preference** (Mercado Pago) en
su servidor y devuelva el `client_secret` / `preference_id`, además de validar el webhook firmado.

**Acuerdo con el dueño del producto:** la F6 se entrega en **sandbox** con el simulador del backend. La
integración real queda pendiente del backend y se retomará cuando existan esos endpoints.

## 3. Conteos de facetas en la búsqueda — F3

**Qué pasa hoy:** `GET /api/v1/catalog/search` acepta `q, category_id, brand, min_price, max_price, sort,
cursor, limit` y devuelve `items` + `next_cursor`, sin agregaciones.

**Por qué importa:** los filtros por faceta "bien hechos" (los de Mercado Libre o Amazon) muestran cuántos
resultados hay por categoría y por marca. Sin conteos, el frontend puede filtrar pero no puede avisar
"Celulares (128)" ni deshabilitar facetas sin resultados.

**Solución recomendada:** devolver un objeto `facets` con conteos por categoría y por marca (y rango de
precio) para los filtros aplicados, o un endpoint aparte `GET /catalog/search/facets`.

**Impacto si no se cambia:** se entregan filtros funcionales sin conteos (la opción que se decidirá en F3).

## 4. Catálogo público de códigos de error — F0/F2

**Qué pasa hoy:** los errores llegan en formato RFC 9457 con un campo `code` estable
(`email_already_registered`, `insufficient_stock`, `invalid_credentials`, `coupon_expired`, …), pero no
existe un listado publicado de todos los valores posibles.

**Por qué importa:** el frontend traduce los mensajes **por `code`**, no por el texto en inglés. Sin
listado, hay que inventariar los códigos leyendo el código del backend, y cualquier código nuevo aparecerá
como "error desconocido".

**Solución recomendada:** publicar el listado (por ejemplo en un enum de OpenAPI, o en
`docs/ERRORES.md` del backend) y mantenerlo al día.

**Impacto si no se cambia:** el frontend usa un mensaje genérico traducido para códigos desconocidos.
