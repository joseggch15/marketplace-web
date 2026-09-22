# 0015 · Pruebas end-to-end de la compra (F6 y F7)

- **Fecha:** 22 de septiembre de 2026
- **Estado:** aceptada

## Qué se decidió

1. **Dos archivos**: `e2e/checkout.spec.ts` (pagar, rechazar y reintentar) y `e2e/orders.spec.ts` (lista, detalle,
   cancelar y la regla de la reseña). Un tercero, `e2e/support/demo.ts`, tiene lo que comparten: la sesión de
   demostración, la búsqueda de un producto con stock real y el paso por el checkout.
2. **La sesión de demostración se crea una sola vez por corrida y se reutiliza**. El backend limita los intentos de
   entrada a **5 por minuto y por IP**, y cada prueba necesita sesión: se entra por el BFF (la misma ruta que usa el
   formulario), se guardan las cookies httpOnly en `e2e/.auth/` —carpeta ignorada por git— y las pruebas siguientes
   las copian a su contexto. La copia caduca a los 5 minutos.
3. **Un solo trabajador, en serie** (`workers: 1`, `fullyParallel: false`). Las pruebas usan la **misma cuenta de
   demostración** y su carrito vive en el servidor: al correr en paralelo, una prueba creaba el pedido (el backend
   vacía el carrito) mientras otra estaba a punto de pagar, y la segunda recibía `cart_empty`. Fue un fallo real de
   la tanda, no del producto. Mejor determinista que rápido: la suite entera tarda menos de un minuto.
4. **Los estados se comprueban contra la API a través del BFF** (`GET /api/orders`), no adivinando por la interfaz:
   así se afirma «el pago rechazado deja el pedido pendiente» con el dato real, y se obtiene el `id` para navegar al
   detalle.
5. **Si una respuesta no trae el estado esperado, el error muestra el cuerpo** (`expectStatus` en `demo.ts`). Un
   `expect(status).toBe(201)` a secas deja «Expected 201, Received 422» sin decir qué campo falló: el cuerpo
   `application/problem+json` trae el `code` y el detalle, que es lo que hace falta para arreglarlo.
6. **`axe` en las páginas nuevas** (`/es/checkout` en sus pasos, `/es/orders` y el detalle), en claro y oscuro.

## Tres fallos del producto que encontraron las pruebas

Ninguno se había visto antes porque la comprobación a mano de la F6 se había hecho **contra la API**, no con el
checkout abierto en el navegador:

1. **`MISSING_MESSAGE: Checkout (es)`**: el layout solo manda al navegador una **lista blanca** de espacios de
   mensajes (para no enviar JavaScript de más) y le faltaban `Checkout` y `Orders`. La pantalla del checkout
   reventaba al renderizarse. Se añadieron los dos espacios y se dejó anotado en el propio layout: si se añade un
   componente cliente con un espacio nuevo, hay que añadirlo ahí.
2. **La dirección se enviaba vacía a quien no tenía direcciones guardadas**: el formulario se pintaba cuando la
   cuenta no tenía direcciones, pero los valores se leían solo si el comprador marcaba «usar otra dirección», así
   que el pedido salía con la dirección en blanco y el backend respondía **422**. Ahora la condición es una sola
   (`usingNewAddressForm`) y la usan el formulario, el resumen y el `save_address`.
3. **Al crear el pedido, el checkout colapsaba al estado «carrito vacío»**: el backend vacía el carrito al crear el
   pedido, la caché del carrito se invalidaba y la pantalla dejaba de mostrar el paso de pago, con lo que **el pago
   era imposible de terminar desde la interfaz**. Se guarda una copia del carrito (`placedCart`) en el momento de
   crear el pedido y es la que se pinta hasta que el pago se resuelve.

También se corrigió una violación `definition-list` de axe: un `<p>` era hijo directo de un `<dl>` en el paso de
pago.

## Consecuencias

- Las pruebas de la compra necesitan **backend encendido y datos de demostración**; si falta el entorno se
  **omiten** con un mensaje que dice qué falta (mismo patrón que las del carrito).
- Las pruebas **crean pedidos de verdad** en la base de datos de demostración. Por eso el caso de rechazo corre una
  sola vez por corrida y el pedido pendiente se cancela al final, que además es lo que hay que demostrar.
- La captura de pantallas de estas páginas necesita sesión: `scripts/capture-screenshots.mjs` acepta
  `--session=demo` y entra con la cuenta de demostración antes de fotografiar.
