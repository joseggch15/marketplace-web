# Pendientes del backend

Cosas que el backend (`E:\ecommerce`) debería cambiar o exponer para que el frontend quede como se
espera. El backend ya **no** es de solo lectura para el frontend: hay una tarea dedicada que los resuelve y
deja aquí el estado.

## Estado de la lista (22 de septiembre de 2026)

| # | Apartado | Estado |
|---|---|---|
| 1 | URLs de imágenes | **parcial** (las claves ya llevan el punto; sigue sin haber campo `url`) |
| 2 | Pagos reales | **resuelto en el backend** (adaptador de Mercado Pago; ver avisos abajo) |
| 3 | Conteos de facetas | pendiente |
| 4 | Catálogo público de códigos de error | pendiente |
| 5 | Envío de correos (SMTP + plantillas) | pendiente |
| 6 | ¿Exigir correo verificado para comprar? | pendiente (decisión del dueño) |
| 7 | Reputación y tienda en los resultados de búsqueda | pendiente |
| 8 | Claves de imagen sin punto | **resuelto** |
| 9 | Producto por slug | pendiente |
| 10 | Stock y atributos en las variantes | **resuelto** |
| 11 | Tienda pública y envío estimado | **resuelto** |
| 12 | Paginación de las preguntas | pendiente |
| 13 | Listado del catálogo para el sitemap | pendiente |
| 14 | Avisos de stock y de cambio de precio en el carrito | pendiente |
| 15 | El registro no devuelve tokens | pendiente |

> Tras regenerar los tipos (`pnpm api:types`) el frontend ya puede usar: `VariantOut.stock`, `VariantOut.available`,
> `VariantOut.attribute_values[]`, `ProductOut.total_available`, `GET /stores/{store_id}` y
> `GET /catalog/products/{product_id}/shipping`. La F6 sigue **bloqueada hasta que el dueño la desbloquee**.

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

> **Resuelto en el backend (22/09/2026):** adaptador de **Mercado Pago** (Checkout Bricks / Checkout Pro) con
> `POST /api/v1/orders/{order_id}/payments`, idempotencia derivada de la orden y del intento, webhook que
> **verifica la firma y consulta el pago** para confirmar estado, monto y moneda antes de marcar la orden como
> pagada. Decisión `0019-pagos-mercado-pago.md`. Configuración en `.env`: `MERCADOPAGO_ACCESS_TOKEN`,
> `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`. **Stripe queda pendiente** (adaptador secundario).
> ⚠️ Tres detalles del protocolo (encabezado y plantilla de firma, decimales del COP) quedaron en configuración
> porque la documentación oficial no fue accesible desde el entorno de desarrollo: hay que confirmarlos antes de
> cobrar de verdad.

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

## 5. Envío de correos (verificación y recuperación de contraseña) — F2

**Qué pasa hoy:** `AuthService.request_password_reset()` y el registro/reenvío de verificación crean el token
en la base de datos, pero **no envían ningún correo**: el token se escribe en los registros del backend
(`logger.info("password_reset_token_generated", email=..., token=...)`). Lo mismo con el enlace de
verificación de correo.

**Por qué importa:** el usuario no puede completar la recuperación de contraseña ni verificar su correo sin
ayuda técnica, así que en la interfaz el flujo se entrega con un aviso honesto: "en este entorno de pruebas el
backend todavía no envía correos: el enlace aparece en sus registros". Sin ese aviso, el usuario esperaría un
correo que nunca llega.

**Solución recomendada:** conectar un proveedor de correo (SMTP o API transaccional) y enviar dos plantillas:
verificación de correo y restablecimiento de contraseña, con el enlace apuntando al frontend
(`{NEXT_PUBLIC_SITE_URL}/{locale}/verify-email?token=…` y `/reset-password?token=…`). Hace falta además una
variable de configuración para la URL pública del frontend.

**Impacto si no se cambia:** los flujos de verificación y recuperación funcionan, pero solo pueden probarse
copiando el token de los registros del backend (es lo que se hizo en la F2 para las pruebas end-to-end).

## 6. ¿Debe exigirse el correo verificado para comprar? — F2

**Qué pasa hoy:** `POST /auth/login` no comprueba `email_verified_at`, así que una cuenta sin verificar puede
iniciar sesión (y por tanto comprar).

**Por qué importa:** es una decisión de negocio, no técnica: si se exige verificación, hay que rechazar el
login (o el checkout) con un código estable (`email_not_verified`) para que el frontend pueda ofrecer
"reenviar el correo".

**Solución recomendada:** decidirlo y, si se exige, devolver un `code` claro en lugar de un 401 genérico.

**Impacto si no se cambia:** el frontend muestra el estado "correo sin verificar" en Mi cuenta y avisa de que
se pedirá antes de comprar, pero hoy nadie lo bloquea realmente.

## 7. Datos de reputación y tienda en los resultados de búsqueda — F3

**Qué pasa hoy:** `SearchResponse.items` devuelve `ProductSearchItem`, que solo trae `id, title, slug, brand,
category_id, min_price` y `thumbnail` (esta última como `object_key`, no como URL).

**Por qué importa:** una grilla de marketplace sin reputación se ve pobre y engañosa: `RatingStars` existe y
está probado en el frontend, pero **no se puede pintar** porque no hay datos (y no se inventan). Además, sin el
nombre de la tienda no se puede mostrar "vendido por" ni filtrar por vendedor, y sin unidades vendidas no se
puede justificar la insignia "más vendido" (`DealBadge` ya existe).

**Solución recomendada:** añadir a `ProductSearchItem` los campos `rating_average: number | null`,
`review_count: integer`, `store_name: string` y, si se quiere usar la insignia de más vendido,
`sold_count: integer`. Es un `JOIN` con la tabla de reseñas y la de tiendas en la misma consulta que ya
calcula `min_price`.

**Impacto si no se cambia:** la grilla del catálogo muestra imagen, título, marca y precio (sin estrellas ni
tienda) y el caso "sin reseñas" se ve igual que "no hay datos".

## 8. Las claves de imagen se generan sin punto antes de la extensión — F3/F4

> **Resuelto (22/09/2026):** `new_object_key()` genera `products/<32 hex>.png` (con el punto) y acepta prefijo
> (`stores/` para los logos). Las claves antiguas sin punto siguen existiendo en el bucket: se pueden volver a
> subir. Cuando no queden, el frontend puede dejar de aceptar el formato viejo.

**Qué pasa hoy:** al subir una imagen, `new_object_key()` del backend genera claves como
`products/32fea407815043478c76ab412cbd2b49png`: **32 dígitos hexadecimales seguidos de la extensión, sin el
punto** (`...b49` + `png`). Se ve en la respuesta real de `GET /catalog/search` (`thumbnail`) y en
`UploadUrlOut.object_key`.

**Por qué importa:** el proxy de imágenes del frontend (`/api/media/[...key]`) valida las claves con una lista
blanca (`src/lib/media/keys.ts`) que exige extensión **después de un punto** — es la comprobación que impide
servir archivos que no sean imágenes. Con el formato actual, **todas las imágenes reales se rechazan y las
tarjetas muestran "sin imagen"**, aunque la subida y el adjuntado funcionen bien.

**Solución recomendada (en el backend):** incluir el punto al construir la clave:
`f"{prefix}/{uuid4().hex}{extension}"` con `extension` normalizada a `".png"`, `.jpg`… Es una línea y deja el
formato igual al que se documentó (`products/<32 hex>.jpg`).

**Mientras tanto (frontend):** en la F4 se aceptará también el formato sin punto (`products/<32 hex>png`),
manteniendo la lista blanca de extensiones de imagen, y se quitará cuando el backend corrija la clave.

**Solución provisional usada:** los datos de demostración (`scripts/seed-demo.mjs`) ya crean las imágenes con
este formato, así que reproducen el problema real en local en vez de esconderlo.

## 9. Falta poder pedir un producto por su slug — F4

**Qué pasa hoy:** `ProductOut` y los resultados de búsqueda traen `slug`, pero **todos** los endpoints de
producto son por identificador: `GET /api/v1/catalog/products/{product_id}`, `.../reviews`, `.../questions`.
Revisado el esquema completo: `slug` **nunca** aparece como parámetro de ruta (solo como campo).

**Por qué importa:** el proyecto exige **URLs con slug** para el SEO (`Product`, `canonical`, `hreflang`), y el
catálogo ya enlaza a `/p/<slug>`. Sin una forma de resolver `slug → producto`, la página de producto tiene que
usar el UUID en la dirección pública, que es ilegible y peor para posicionar. Buscar por `q=<slug>` **no sirve**:
el buscador indexa título y marca, no el slug (`balon-de-futbol-profesional-no5` no encuentra "Balón de fútbol
profesional nº5").

**Solución recomendada:** `GET /api/v1/catalog/products/by-slug/{slug}` → `ProductOut` (o aceptar `?slug=` en el
listado público). Es una consulta por índice único sobre `products.slug`.

**Mientras tanto (frontend, F4):** la página se monta en `/p/<product_id>` con `canonical` y `hreflang` a sí
misma, y el enlace del catálogo apunta al id. Cuando exista el endpoint por slug, el cambio es de una línea en
la ruta (`/p/[productId]` → `/p/[slug]`) más el enlace en `product-grid.tsx`.

## 10. Las variantes no traen valores de atributo ni stock — F4

> **Resuelto (22/09/2026):** `VariantOut` incluye `stock`, `available` y `attribute_values[]`
> (`attribute_id`, `name`, `value`), y `ProductOut` incluye `total_available`. Se resuelve en **dos consultas
> por producto** (no N+1) y `available` ya descuenta las unidades reservadas. El frontend puede dejar de pedir
> `GET /inventory/items/{variant_id}` variante por variante.

**Qué pasa hoy:** `VariantOut` solo tiene `id`, `sku`, `price` y `compare_at_price`. No incluye los valores de
atributo (`VariantValue`: color, talla, sabor…) ni el stock, y `ProductOut` tampoco trae ningún total.

**Por qué importa:** en una ficha de producto el comprador elige «Color: negro / Talla: M», no un código
interno. Hoy las variantes se identifican por su **SKU** (`AUD-NEG`), que es correcto pero poco humano, y el
stock se tiene que pedir variante por variante a `GET /inventory/items/{variant_id}`: una petición extra por
variante y un endpoint de inventario **sin autenticación**.

**Solución recomendada:** añadir a `VariantOut` `stock: int`, `available: int` y
`attribute_values: [{ attribute_id, name, value }]`, y a `ProductOut` un `total_available`.

**Impacto si no se cambia:** funciona (el frontend pide el stock al endpoint de inventario y muestra el SKU),
pero cada ficha necesita N peticiones extra y el inventario queda expuesto públicamente.

## 11. No hay datos públicos de la tienda ni del envío para la ficha — F4

> **Resuelto (22/09/2026):** `GET /api/v1/stores/{store_id}` público (nombre, slug, descripción, `logo_url`,
> `rating_average`, `rating_count`, `orders_delivered`) — solo tiendas aprobadas, el resto responde 404; y
> `GET /api/v1/catalog/products/{product_id}/shipping` con la ventana de entrega estimada (días hábiles para el
> país de destino) y el coste de envío (hoy `0`, se define en el checkout). La estimación es **configurable**
> (`SHIPPING_*`) y lo declara en `source="configured_default"`: no es una tarifa de transportadora, así que la
> interfaz debe presentarla como aproximada.

**Qué pasa hoy:** los endpoints de tienda (`/sellers/me`, `/sellers`, `/sellers/{store_id}/approve`) son del
vendedor o del administrador: no hay forma pública de pedir el nombre, el logo o la reputación de la tienda a
la que pertenece un producto. Tampoco existe una estimación de envío por producto.

**Por qué importa:** el proyecto quiere mostrar «vendido por», la reputación del vendedor y la fecha estimada
de entrega (inspiración de Mercado Libre y Amazon). En la F4 esos bloques **no se pintan** porque no hay datos,
y no se inventan.

**Solución recomendada:** `GET /api/v1/stores/{store_id}` público con `name`, `logo_object_key`,
`rating_average`, `rating_count` y `orders_delivered`, más un cálculo de envío estimado (o
`GET /api/v1/catalog/products/{product_id}/shipping`).

## 12. Las preguntas no se pueden paginar — F4

**Qué pasa hoy:** `GET /products/{product_id}/questions` devuelve `next_cursor`, pero **no acepta** el
parámetro `cursor` (solo `limit`), y el servicio devuelve siempre `next_cursor=None`.

**Por qué importa:** un producto popular acumula decenas de preguntas y el frontend solo puede mostrar la
primera página (20). Las reseñas sí se paginan, así que el comportamiento es incoherente.

**Solución recomendada:** aceptar `cursor` igual que en las reseñas y devolver el cursor real.

## 13. Falta un listado público del catálogo completo (para el sitemap) — F4

**Qué pasa hoy:** el único listado público de productos es `GET /catalog/search`, con `limit` máximo de 100 y
paginación por cursor.

**Por qué importa:** `sitemap.xml` debe incluir todas las URL de producto. Hoy el mapa se arma con la primera
página del buscador (100 productos); cuando el catálogo crezca habrá que recorrer cursores y, por número de
URL, paginar el sitemap como pide el proyecto.

## 14. El carrito no informa de stock ni de cambios de precio — F5

**Qué pasa hoy:** `CartItemOut` trae `unit_price` con el precio **actual** de la variante, pero nada más:

- **No dice si el precio cambió** desde que se agregó el producto (no hay precio de cuando se agregó ni un aviso
  de cambio), así que la interfaz no puede avisar «el precio cambió desde que lo agregaste».
- **No informa de la disponibilidad**: no hay `available` ni ningún estado por línea. Además `POST /cart/items`
  y `PATCH /cart/items/{variant_id}` aceptan hasta **100 unidades sin comprobar el inventario**, así que se puede
  dejar en el carrito más de lo que existe.
- **No trae imagen ni atributos de la variante** (`thumbnail`, color/talla): la línea del carrito solo puede
  mostrar el nombre, el SKU y el precio.

**Por qué importa:** un carrito que no avisa de que algo ya no hay (o de que subió de precio) es la antesala de
un pago que falla o de una sorpresa desagradable al pagar, y el proyecto prohíbe explícitamente cualquier aviso
inventado: o el dato es real, o no se muestra.

**Mientras tanto (frontend, F5):** la línea muestra el SKU, el precio actual y el subtotal **calculados por el
servidor**, y no se pinta ningún aviso de stock ni de cambio de precio. Los importes se marcan como
«pendientes» mientras hay una operación en vuelo, en vez de recalcularlos en el navegador.

**Solución recomendada:** añadir a `CartItemOut` `available: int` y `price_changed: bool` (o
`added_unit_price: Decimal`), y devolver `insufficient_stock` en `POST`/`PATCH` cuando la cantidad pedida supere
lo disponible. Con eso la interfaz podrá marcar la línea y ofrecer «ajustar a lo disponible» sin inventar nada.

## 15. El registro no devuelve tokens, así que no se puede fusionar el carrito ahí — F5

**Qué pasa hoy:** `POST /api/v1/auth/register` responde `UserOut` (201) **sin** par de tokens. El frontend llama
a la fusión del carrito también al registrarse (la llamada está puesta en `src/app/api/auth/register/route.ts`),
pero sin sesión no hay carrito de usuario al que fusionar: la fusión termina en no hacer nada y el carrito del
invitado se conserva en su cookie httpOnly hasta el inicio de sesión, que es el paso siguiente del flujo.

**Por qué importa:** hoy no se pierde nada (registrarse y entrar deja el carrito intacto), pero el carrito no se
fusiona «al registrarse» como pide el producto, y no hay forma de hacerlo desde el servidor sin iniciar sesión.

**Solución recomendada:** que `register` devuelva `TokenPair` (o acepte un parámetro para iniciar sesión al
crear la cuenta). El día que lo haga, `mergeGuestCartIfSignedIn()` empieza a funcionar en el registro **sin
cambiar una línea del frontend**.

