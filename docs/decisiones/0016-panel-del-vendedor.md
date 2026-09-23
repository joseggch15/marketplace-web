# 0016 · Panel del vendedor (F8)

- **Fecha:** 22 de septiembre de 2026
- **Estado:** aceptada

## Qué se decidió

1. **Rutas BFF finas, autorización en el backend.** Todo lo que escribe pasa por `/api/seller/…`
   (`store`, `products`, `products/{id}`, `publication`, `variants/{variantId}/stock`, `images`,
   `images/{imageId}`, `orders/{id}/status`, `orders/{id}/shipment`, `orders/{id}/shipment/status`,
   `categories/{id}/attributes`). El navegador nunca habla con FastAPI ni ve tokens: la sesión viaja en cookies
   httpOnly y `withAccessToken` renueva el access token si caducó. Quién puede hacer qué lo decide el backend
   (403/409/422 con su `code`), no la interfaz.
2. **La lista de variantes la construye el servidor.** El navegador manda los **valores** escritos en los
   atributos de la categoría (`Rojo, Azul`); el `POST /api/seller/products` calcula el producto cartesiano con
   `toVariants` (las funciones ya probadas de `variants.ts`) y genera los SKU. El formulario usa las mismas
   funciones para la **vista previa** («se van a crear 2 variantes: E2EBOLSO-ROJO-1, …»), pero no es quien manda.
3. **El stock es el total del almacén, no un incremento.** Un campo numérico por variante (`PATCH …/stock`), con
   el aviso de que el backend nunca baja por debajo de lo reservado por pedidos en curso (`409
insufficient_stock`). Se enseña también lo reservado (`stock - available`), que es lo que explica el límite.
4. **El precio se muestra en solo lectura en la edición.** `ProductUpdate` solo admite título, descripción y
   marca: cambiar el precio exigiría crear otra variante. Antes de ofrecer un campo que el servidor ignora, se
   dice por qué.
5. **Una venta se gestiona por su envío**, que es como lo hace el backend: `pending` → **preparar**
   (`PATCH …/status?status=processing`) → **preparar el envío** (`POST …/shipment`, queda en `ready`) →
   **marcar como enviado** (`POST …/shipment/status?status=shipped`, que mueve la venta a `shipped`) →
   **entregar** (`status=delivered`, que cierra la venta). El estado también va por query en el endpoint de la
   venta, porque así lo define la API.
6. **Las imágenes se suben desde el servidor.** Se pide la URL firmada, se suben los bytes y se adjunta: así el
   navegador no depende del CORS de MinIO. La ruta BFF valida tipo y tamaño antes de gastar la firma, y **rechaza
   SVG** (`unsupported_image_type`), que es el motivo por el que la lista blanca es exacta.
7. **Las tres cifras, sin gráficos.** No hay endpoint de totales para un vendedor, así que se pagina el listado
   de ventas por cursor con un tope (3 páginas × 100) y la pantalla **dice sobre cuántas ventas** está calculando
   (`summarizeSales`). El dinero se suma en céntimos con `BigInt`, nunca con `number`.
8. **`loadMyStore()` con `cache()` de React** y resultado de tres estados (`ok`, `none`, `unavailable`): «no
   tienes tienda» y «no se pudo preguntar» se cuentan distinto, y el layout y la página comparten una sola
   consulta por petición.
9. **Un producto de otra tienda se trata como inexistente** (404 en pantalla) aunque la API lo devuelva: la
   autorización real es del servidor, pero no se enseña una ficha que no se puede editar.
10. **`ErrorNotice`/`SuccessNotice` se movieron a `components/domain/notice.tsx`**: los usan las features de
    pedidos y de vendedor, así que ya no viven dentro de una de ellas.
11. **El «resumen» y «mis productos» se renderizan en el servidor** con los datos reales (una sola lectura por
    página); solo los formularios son componentes cliente, que es donde hay interactividad de verdad.
12. **El campo de valores de atributo es controlado** (`SellerValuesField`): los atributos dependen de la
    categoría elegida y no son campos fijos del esquema, así que se guardan en el estado del formulario y se
    validan al enviar (con las mismas claves de traducción `Seller.validation.*`).
13. **`useWatch` en vez de `form.watch`**: `watch()` desactiva la optimización de React Compiler en el
    componente y el linter lo avisa; `useWatch` es la API que sí entiende.

## Comprobaciones que quedan pendientes por diseño

- La **creación de tienda** no tiene e2e propio: la cuenta de demostración ya tiene tienda aprobada y el backend
  responde `store_already_exists`. El formulario se prueba a mano y la pantalla cubre los tres estados.
- Las e2e **crean un producto por corrida** (nombre con marca de tiempo) y **crean un pedido pagado** cada vez:
  es la única forma de probar el panel con datos reales, y el catálogo de demostración lo admite.
