# 0013 · Checkout y pago de prueba (F6)

## Qué se decidió

1. **Tres pasos**: dirección → envío y cupón → pago, con el resumen **pegajoso** al lado en escritorio y al final en
   móvil. El indicador de pasos es el componente `CheckoutSteps` que ya existía.
2. **El pedido se crea cuando el comprador confirma el pago**, no al entrar en el checkout. Así, quien abandona el
   flujo no deja pedidos `pending` ni stock reservado en la base de datos.
3. **Clave de idempotencia generada en el navegador** (`crypto.randomUUID`) al empezar el intento y **reutilizada**
   en los reintentos. Se manda en el cuerpo y la ruta BFF la reenvía como cabecera `Idempotency-Key`: un doble clic
   o una red que se cae devuelven el mismo pedido en lugar de crear dos.
4. **Los importes son del servidor, siempre**. El subtotal y el descuento salen de `POST /coupons/validate`; el
   total que se cobra es el `total` del pedido. El navegador no suma, no resta ni multiplica dinero.
5. **Pago marcado como «modo de prueba»** con dos botones (aprobar o rechazar) sobre la pasarela `sandbox` del
   backend. **No se piden ni se guardan datos de tarjeta** (regla del proyecto): la interfaz enseña una tarjeta de
   prueba explícitamente ficticia y lo dice.
6. **`succeeded` es el desenlace correcto de la pasarela** (la orden pasa a `payment_status: paid`). El frontend
   reconoce `succeeded` **y** `paid` (`paymentSucceeded`) para no confundir un pago bueno con uno fallido.
7. **El envío no se inventa**: la API calcula `shipping_total` (hoy 0) y el checkout muestra la **estimación real**
   de entrega (`/catalog/products/{id}/shipping`), diciendo con todas las letras que es una estimación de la tienda
   y no una promesa de la transportadora.
8. **La confirmación no promete correos**: la API solo tiene plantillas de verificación y de contraseña, así que la
   pantalla dice qué ha pasado y **qué pasa ahora**, sin afirmar que se haya enviado ningún correo.
9. **Cancelar y reseñar respetan la máquina de estados del backend**: cancelar solo en `pending`; reseñar solo si
   la sub-orden del vendedor está `delivered` y el producto no tiene ya una reseña del usuario (se consulta con las
   reseñas publicadas del producto, porque la API no tiene «mis reseñas»).
10. **BFF para todo**: el navegador nunca habla con la API ni ve tokens. Las rutas nuevas son `/api/orders`,
    `/api/orders/{id}/cancel`, `/api/orders/{id}/payments`, `/api/payments/{id}/simulate`, `/api/coupons/validate`,
    `/api/reviews` y `/api/shipping/estimate`.

## Un detalle de validación que costó un 422

El navegador manda `null` (no `undefined`) en los campos opcionales de la dirección. Con Zod hay que usar
`nullish()` y no `optional()`: `optional()` acepta `undefined` pero **rechaza `null`**, y el backend devolvía 422.
Se centralizó en un ayudante `optionalText(max)` para que no vuelva a pasar.

## Consecuencias

- `Orders` y `Checkout` son los namespaces nuevos de mensajes; los estados desconocidos tienen su propia clave
  (`unknown`) para no disfrazar un estado nuevo de otro conocido.
- El detalle del pedido pide el nombre de cada tienda (`/stores/{store_id}`) y las reseñas de los productos
  entregados: son pocas peticiones y todas en paralelo en el servidor.
